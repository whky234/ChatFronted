import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {

  private apiUrl = "http://localhost:3000/create-meeting"; // Backend API

  constructor(private http: HttpClient) {}

  createMeeting(): Observable<any> {
    return this.http.post<any>(this.apiUrl, {}).pipe(
      tap((response) => console.log("API Response in Angular:", response)), // Debugging
      catchError((error) => {
        console.error("Error in API call:", error);
        throw error;
      })
    );
  }
}
