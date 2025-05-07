import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-google-auth-callback',
  templateUrl: './google-auth-callback.component.html',
  styleUrl: './google-auth-callback.component.css'
})
export class GoogleAuthCallbackComponent {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('jwt', token);  // Store the JWT
        this.router.navigate(['/chat']);  // Redirect to dashboard or desired route
      } else {
        this.router.navigate(['/login']);  // Redirect to login if there's an error
      }
    });
  }
}
