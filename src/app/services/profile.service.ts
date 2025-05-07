import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/api/profile';
  private profileSubject = new BehaviorSubject<any>(null); // Holds the current profile data
  profile$ = this.profileSubject.asObservable(); // Observable for components to subscribe to

  private participantProfileSubject = new BehaviorSubject<any>(null);
participantProfile$ = this.participantProfileSubject.asObservable();
  constructor(private http: HttpClient, private authser: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authser.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Get user profile
  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap((profile) => this.profileSubject.next(profile)) // Update the BehaviorSubject
    );
  }

  // Create or update user profile
  saveProfile(profileData: FormData): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/addprofile`, profileData, { headers: this.getHeaders() })
      .pipe(
        tap((profile) => this.profileSubject.next(profile)) // Update the BehaviorSubject
      );
  }

  // Update user profile
  updateProfile(profileData: FormData): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/editprofile`, profileData, { headers: this.getHeaders() })
      .pipe(
        tap((profile) => this.profileSubject.next(profile)) // Update the BehaviorSubject
      );
  }

  // Emit updates for a participant's profile
  getParticipantProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/participant/${userId}`, { headers: this.getHeaders() }).pipe(
      tap((profile) => this.participantProfileSubject.next(profile)) // Emit the updated participant profile
    );
  }

  // Toggle profile visibility
  toggleProfileVisibility(): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/toggle-visibility`, {}, { headers: this.getHeaders() })
      .pipe(
        tap((profile) => this.profileSubject.next(profile)) // Update the BehaviorSubject
      );
  }
}
