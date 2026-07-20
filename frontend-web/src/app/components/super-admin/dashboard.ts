import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, Admin, DashboardStats } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

type Tab = 'overview' | 'admins';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class SuperAdminDashboardComponent implements OnInit {
  activeTab: Tab = 'overview';
  stats: DashboardStats | null = null;
  admins: Admin[] = [];
  loading = false;
  error = '';
  successMsg = '';
  showCreateForm = false;
  createLoading = false;
  createForm: FormGroup;
  name = '';

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.name = this.auth.getName() || '';
    this.loadStats();
    this.loadAdmins();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.error = ''; this.successMsg = '';
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: s => this.stats = s,
      error: err => this.error = err.message,
    });
  }

  loadAdmins(): void {
    this.loading = true;
    this.adminService.getAdmins().subscribe({
      next: a => { this.admins = a; this.loading = false; },
      error: err => { this.error = err.message; this.loading = false; },
    });
  }

  createAdmin(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.createLoading = true; this.error = '';
    const { name, email, password } = this.createForm.value;
    this.adminService.createAdmin(name, email, password).subscribe({
      next: () => {
        this.successMsg = `Admin account created for ${name}.`;
        this.createLoading = false;
        this.showCreateForm = false;
        this.createForm.reset();
        this.loadAdmins();
        this.loadStats();
      },
      error: err => { this.error = err.message; this.createLoading = false; },
    });
  }

  deleteAdmin(id: string, name: string): void {
    if (!confirm(`Delete admin ${name}? This cannot be undone.`)) return;
    this.adminService.deleteAdmin(id).subscribe({
      next: () => {
        this.successMsg = `Admin ${name} deleted.`;
        this.loadAdmins();
        this.loadStats();
      },
      error: err => this.error = err.message,
    });
  }

  goToAdmin(): void { this.router.navigate(['/admin/dashboard']); }
  logout(): void { this.auth.logout(); }

  get f() { return this.createForm.controls; }
}
