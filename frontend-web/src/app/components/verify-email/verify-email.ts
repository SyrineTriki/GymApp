import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

type Status = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css'],
})
export class VerifyEmailComponent implements OnInit {
  status: Status = 'loading';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      this.message = 'No verification token found. Please use the link from your email.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.status = 'success';
        this.message = res.message;
      },
      error: (err: Error) => {
        this.status = 'error';
        this.message = err.message;
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
