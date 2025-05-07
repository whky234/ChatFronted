import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  message = '';

  constructor(private authService: AuthService, private router: Router,private snack:MatSnackBar) {}

  onSignup() {
    const userData = { name: this.name, email: this.email, password: this.password };
    this.authService.signup(userData).subscribe({
      next: (response) => {
        console.log('Signup response:', response); // Debugging line
        this.snack.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'] // Optional: Custom styling for success
        });
        this.router.navigate(['/verify-otp']);
      },
      error: (err) => {
        const errmessage= err.error.message || 'Signup failed. Try again.';
        this.snack.open(errmessage, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'] // Optional: Custom styling for success
        });
        console.error('Signup error:', err); // Log the error
      }
    });
  }
}
