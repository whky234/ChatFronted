import { query } from '@angular/animations';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { io, Socket } from 'socket.io-client';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  onAny(arg0: (event: any, data: any) => void) {
    throw new Error('Method not implemented.');
  }

  private socket = io('http://localhost:3000'); // Replace with your server URL

  private apiUrl = 'https://api.api-ninjas.com/v1/emoji';
  private apiKey = 'p0AqS5WRerPUKedklOAWH42b2AQPbnLSlMchMiht'; // Replace with your API key
constructor(private Http:HttpClient){
  console.log('Connecting to WebSocket server...');
  this.socket.on('connect', () => {
    console.log('Connected to WebSocket server:', this.socket.id);
  });

  this.socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server.');
  });
}

ngOnInit(): void {
  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  //Add 'implements OnInit' to the class.

}

getEmojis(query: string) {
  const apiUrl = `https://api.api-ninjas.com/v1/emoji?name=${query}`;
  const headers = new HttpHeaders({
    'X-Api-Key': `${this.apiKey}` // Replace with your actual API key
  });

  return this.Http.get<any[]>(apiUrl, { headers });
}

private handleError(error: HttpErrorResponse) {
  console.error('Error fetching emojis:', error);
  return throwError(() => new Error('Failed to fetch emojis. Please try again later.'));
}
// Emit an event to the server
emit(eventName: string, data: any) {
  this.socket.emit(eventName, data);
}

// Listen for events from the server
on(eventName: string, callback: (data: any) => void) {
  this.socket.on(eventName, callback);
}

off(event: string): void {
  this.socket.off(event);
}

registerUser(userId: string) {
  this.socket.emit('register', userId);
}

listenForNewMessages(): Observable<any> {
  return new Observable((subscriber) => {
    this.socket.on('newMessage', (data) => {
      subscriber.next(data);
    });
  });
}
// Disconnect from the server
disconnect() {
  this.socket.disconnect();
}

listen(eventName: string): Observable<any> {
  return new Observable((subscriber) => {
    this.socket.on(eventName, (data) => {
      console.log(`🔥 Event received: ${eventName}`, data); // Debugging
      subscriber.next(data);
    });

    return () => {
      this.socket.off(eventName);
    };
  });
}


}
