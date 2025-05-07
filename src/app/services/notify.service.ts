import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private apiUrl = 'http://localhost:3000/api'; // Adjust your backend URL


  constructor(private http: HttpClient,private authser:AuthService) { }


  getNotifications(): Observable<any[]> {
      const token = this.authser.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.apiUrl}/getnoti`,{headers});
  }

  getGroupNoify(): Observable<any[]> {
    const token = this.authser.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any[]>(`${this.apiUrl}/getGroupNotify`,{headers});
}


markAllAsRead(): Observable<any> {
  const token = this.authser.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.http.put<any>(`${this.apiUrl}/mark-all-read`, {}, { headers });
}


}
