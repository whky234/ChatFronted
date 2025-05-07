import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  private apiUrl = 'http://localhost:3000/chat'; // Backend API URL

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<{ formatreply: string }> {
    return this.http.post<{ formatreply: string }>(this.apiUrl, { message });
  }
}
