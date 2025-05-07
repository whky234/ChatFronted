import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css'] // Fixed typo: styleUrl → styleUrls
})
export class ForgotpasswordComponent {
  email = '';

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  onForgotPassword() {
    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Error sending reset link. Try again.', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}
