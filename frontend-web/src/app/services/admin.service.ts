import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Coach {
  id: string; name: string; email: string; is_verified: boolean;
  created_at: string; status: string;
  years_of_experience?: number; bio?: string; certification_filename?: string;
}

export interface Athlete {
  id: string; name: string; email: string;
  is_verified: boolean; created_at: string;
}

export interface Admin {
  id: string; name: string; email: string;
  role: string; is_verified: boolean; created_at: string;
}

export interface DashboardStats {
  total_athletes: number; total_coaches: number;
  pending_coaches: number; approved_coaches: number; rejected_coaches: number;
  total_admins?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/admin/stats`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getCoaches(status = 'all'): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${this.base}/admin/coaches?status=${status}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  reviewCoach(id: string, action: 'approve' | 'reject', reason?: string): Observable<any> {
    return this.http.post(`${this.base}/admin/coaches/${id}/review`, { action, reason }, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getAthletes(): Observable<Athlete[]> {
    return this.http.get<Athlete[]>(`${this.base}/admin/athletes`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.base}/admin/users/${id}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  // Super admin only
  getAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(`${this.base}/super-admin/admins`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  createAdmin(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/super-admin/admins`, { name, email, password }, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  deleteAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.base}/super-admin/admins/${id}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.detail || err.error?.message || 'Something went wrong.';
    return throwError(() => new Error(message));
  }
}
