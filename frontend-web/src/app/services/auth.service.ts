import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/v1/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    return this.http.post<LoginResponse>(`${this.base}/login`, form).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('name', res.name);
      }),
      catchError(this.handleError),
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getRole(): string | null  { return localStorage.getItem('role'); }
  getName(): string | null  { return localStorage.getItem('name'); }
  isLoggedIn(): boolean     { return !!this.getToken(); }
  isAdmin(): boolean        { return this.getRole() === 'admin'; }
  isSuperAdmin(): boolean   { return this.getRole() === 'super_admin'; }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.detail || err.error?.message || 'Something went wrong.';
    return throwError(() => new Error(message));
  }
}
