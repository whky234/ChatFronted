import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  email = '';
  token = '';
  newPassword = '';
  message = '';

  constructor(private authService: AuthService,private snack:MatSnackBar,private router:Router) {}

  onResetPassword() {
    const resetData = { email: this.email, token: this.token, newPassword: this.newPassword };
    this.authService.resetPassword(resetData).subscribe({
      next: (response) => {
        this.message = response.message;
        this.snack.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'] // Optional: Custom styling for success
        });
         this.router.navigate(['/login'])

      },
      error: (err) => {
        const errormessage = err.error.message || 'Error resetting password. Try again.';
        this.snack.open(errormessage, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'] // Optional: Custom styling for success
        });
      }
    });
  }
}
