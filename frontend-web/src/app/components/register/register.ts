import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

type Role = 'athlete' | 'coach';
type Step = 'role' | 'details' | 'success';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],  // FIX: standalone + imports
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent implements OnInit {
  step: Step = 'role';
  selectedRole: Role | null = null;
  form!: FormGroup;
  certFile: File | null = null;
  certError = '';
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  // ── Role selection ─────────────────────────────────────────────────────────

  selectRole(role: Role): void {
    this.selectedRole = role;
  }

  confirmRole(): void {
    if (!this.selectedRole) return;
    this.buildForm();
    this.step = 'details';
  }

  goBack(): void {
    this.step = 'role';
    this.errorMessage = '';
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  private buildForm(): void {
    const base = {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      date_of_birth: ['', [Validators.required, this.ageValidator]],
    };

    const coachExtra =
      this.selectedRole === 'coach'
        ? {
            years_of_experience: [null, [Validators.min(0), Validators.max(60)]],
            bio: ['', Validators.maxLength(500)],
          }
        : {};

    this.form = this.fb.group({ ...base, ...coachExtra });
  }

  private passwordValidator(ctrl: AbstractControl) {
    const v: string = ctrl.value || '';
    if (!/[A-Z]/.test(v)) return { noUppercase: true };
    if (!/\d/.test(v)) return { noDigit: true };
    return null;
  }

  private ageValidator(ctrl: AbstractControl) {
    if (!ctrl.value) return null;
    const dob = new Date(ctrl.value);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 14) return { tooYoung: true };
    if (age > 120) return { invalidDate: true };
    return null;
  }

  get f() {
    return this.form.controls;
  }

  // ── Certification file ─────────────────────────────────────────────────────

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.certError = '';
    this.certFile = null;

    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.certError = 'Only PDF, JPEG, or PNG files are accepted.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.certError = 'File must be under 5 MB.';
      return;
    }
    this.certFile = file;
  }

  removeCert(): void {
    this.certFile = null;
    this.certError = '';
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.certError) return;

    this.loading = true;
    this.errorMessage = '';

    const dob: string = this.form.value.date_of_birth;

    if (this.selectedRole === 'athlete') {
      this.authService
        .registerAthlete({
          name: this.form.value.name,
          email: this.form.value.email,
          password: this.form.value.password,
          date_of_birth: dob,
        })
        .subscribe({
          next: () => {
            this.loading = false;
            this.step = 'success';
          },
          error: (err: Error) => {
            this.loading = false;
            this.errorMessage = err.message;
          },
        });
    } else {
      this.authService
        .registerCoach({
          name: this.form.value.name,
          email: this.form.value.email,
          password: this.form.value.password,
          date_of_birth: dob,
          years_of_experience: this.form.value.years_of_experience ?? undefined,
          bio: this.form.value.bio || undefined,
          certification: this.certFile ?? undefined,
        })
        .subscribe({
          next: () => {
            this.loading = false;
            this.step = 'success';
          },
          error: (err: Error) => {
            this.loading = false;
            this.errorMessage = err.message;
          },
        });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  maxDob(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    return d.toISOString().split('T')[0];
  }

  passwordFieldErrors(): string {
    const ctrl = this.f['password'];
    if (!ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Password is required.';
    if (ctrl.errors['minlength']) return 'Password must be at least 8 characters.';
    if (ctrl.errors['noUppercase']) return 'Add at least one uppercase letter.';
    if (ctrl.errors['noDigit']) return 'Add at least one number.';
    return '';
  }
}
