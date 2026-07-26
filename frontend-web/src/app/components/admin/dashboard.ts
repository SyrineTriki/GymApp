import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, Coach, Athlete, DashboardStats } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Tilt3dDirective } from '../../shared/tilt-3d.directive';
import { CountUpDirective } from '../../shared/count-up.directive';
import { AmbientBackgroundComponent } from '../../shared/ambient-background.component';

type Tab = 'overview' | 'pending' | 'coaches' | 'athletes';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Tilt3dDirective, CountUpDirective, AmbientBackgroundComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {
  activeTab: Tab = 'overview';
  stats: DashboardStats | null = null;
  coaches: Coach[] = [];
  athletes: Athlete[] = [];
  loading = false;
  actionLoading: string | null = null;
  error = '';
  successMsg = '';
  rejectModal: { coach: Coach; reason: string } | null = null;
  role = '';
  name = '';

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.name = this.auth.getName() || '';
    this.loadStats();
    this.loadPendingCoaches();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.error = ''; this.successMsg = '';
    if (tab === 'coaches')  this.loadCoaches();
    if (tab === 'athletes') this.loadAthletes();
    if (tab === 'pending')  this.loadPendingCoaches();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: s => this.stats = s,
      error: err => this.error = err.message,
    });
  }

  loadPendingCoaches(): void {
    this.loading = true;
    this.adminService.getCoaches('pending').subscribe({
      next: c => { this.coaches = c; this.loading = false; },
      error: err => { this.error = err.message; this.loading = false; },
    });
  }

  loadCoaches(): void {
    this.loading = true;
    this.adminService.getCoaches('all').subscribe({
      next: c => { this.coaches = c; this.loading = false; },
      error: err => { this.error = err.message; this.loading = false; },
    });
  }

  loadAthletes(): void {
    this.loading = true;
    this.adminService.getAthletes().subscribe({
      next: a => { this.athletes = a; this.loading = false; },
      error: err => { this.error = err.message; this.loading = false; },
    });
  }

  approve(coach: Coach): void {
    this.actionLoading = coach.id;
    this.adminService.reviewCoach(coach.id, 'approve').subscribe({
      next: () => {
        this.successMsg = `${coach.name} approved!`;
        this.actionLoading = null;
        this.loadPendingCoaches();
        this.loadStats();
      },
      error: err => { this.error = err.message; this.actionLoading = null; },
    });
  }

  openRejectModal(coach: Coach): void {
    this.rejectModal = { coach, reason: '' };
  }

  confirmReject(): void {
    if (!this.rejectModal || !this.rejectModal.reason.trim()) return;
    const { coach, reason } = this.rejectModal;
    this.actionLoading = coach.id;
    this.rejectModal = null;
    this.adminService.reviewCoach(coach.id, 'reject', reason).subscribe({
      next: () => {
        this.successMsg = `${coach.name} rejected.`;
        this.actionLoading = null;
        this.loadPendingCoaches();
        this.loadStats();
      },
      error: err => { this.error = err.message; this.actionLoading = null; },
    });
  }

  deleteUser(id: string, name: string): void {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    this.adminService.deleteUser(id).subscribe({
      next: () => {
        this.successMsg = `${name} deleted.`;
        if (this.activeTab === 'athletes') this.loadAthletes();
        else this.loadCoaches();
        this.loadStats();
      },
      error: err => this.error = err.message,
    });
  }

  logout(): void { this.auth.logout(); }

  statusClass(status: string): string {
    return { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' }[status] || '';
  }

  certUrl(filename: string): string {
    return `http://localhost:8000/uploads/${filename}`;
  }

  goToSuperAdmin(): void { this.router.navigate(['/super-admin/dashboard']); }
}
