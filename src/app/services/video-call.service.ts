import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io } from 'socket.io-client';
import * as TwilioVideo from 'twilio-video';


@Injectable({
  providedIn: 'root'
})
export class VideoCallService {


 private socket = io('http://localhost:3000'); // Update with your server URL
  roomId$ = new BehaviorSubject<string | null>(null);

  constructor() {}

  createRoom() {
    this.socket.emit('createRoom');
    this.socket.on('roomCreated', (roomId: string) => {
      this.roomId$.next(roomId);
    });
  }

  joinRoom(roomId: string) {
    this.socket.emit('joinRoom', roomId);
    this.roomId$.next(roomId);
  }

  sendSignal(roomId: string, signal: any) {
    this.socket.emit('signal', { roomId, signal });
  }

  listenForSignals(callback: (data: any) => void) {
    this.socket.on('signal', callback);
  }



}
