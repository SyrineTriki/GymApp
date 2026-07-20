import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    // If already logged in, redirect
    if (this.auth.isLoggedIn()) this.redirectByRole();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => { this.loading = false; this.redirectByRole(); },
      error: (err: Error) => { this.loading = false; this.error = err.message; },
    });
  }

  private redirectByRole(): void {
    if (this.auth.isSuperAdmin()) this.router.navigate(['/super-admin/dashboard']);
    else if (this.auth.isAdmin()) this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/login']);
  }

  get f() { return this.form.controls; }
}
