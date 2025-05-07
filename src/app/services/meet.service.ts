import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MeetService {

  private apiUrl = 'http://localhost:3000'; // Replace with your backend URL

  constructor(private http: HttpClient,private authser:AuthService) {}

  createMeet(meetData: any): Observable<any> {
      const headers = new HttpHeaders({
          Authorization: `Bearer ${this.authser.getToken()}`
        });
    return this.http.post(`${this.apiUrl}/api/create-meet`, meetData,{headers});
  }

  authorizeGoogle(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }
}
