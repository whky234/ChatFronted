import { ConnectService } from './../services/connect.service';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';

  constructor(private authService: AuthService, private router: Router,private connect:ConnectService,
    private snack:MatSnackBar

  ) {}

  onLogin() {

      // Proceed with login
      this.authService.login({ email: this.email, password: this.password }).subscribe({
        next: (response) => {
          this.snack.open(response.message, 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar'] // Optional: Custom styling for success
          });

          // Navigate to the chat page on successful login
          this.router.navigate(['/chat']);
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Invalid credentials or user not verified.';

          this.snack.open(errorMessage, 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar'] // Optional: Custom styling for error
          });
        },
      });
    
  }





  googleLogin() {
    this.authService.googleLogin();
  }
}
