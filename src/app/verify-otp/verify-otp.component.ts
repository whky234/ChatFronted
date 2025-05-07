import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css'
})
export class VerifyOtpComponent {
  email = '';
  otp = '';
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  onVerifyOTP() {
    this.authService.verifyOTP(this.email, this.otp).subscribe({
      next: (response) => {
        this.message = 'OTP verified successfully!';
        this.router.navigate(['/login']);
      },
      error: () => {
        this.message = 'Invalid OTP. Please try again.';
      }
    });
  }
}
