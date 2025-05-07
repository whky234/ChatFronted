import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupsocketService {
  private socket: Socket;



  constructor() {
    this.socket = io('http://localhost:3000'); // Replace with your server URL

    console.log('Connecting to WebSocket server...');
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server.');
    });
  }





  // Emit an event to the server
emit(eventName: string, data: any) {
  this.socket.emit(eventName, data);
}

joinGroupRoom(groupId: string,userId:string) {
  console.log("📡 Joining group room:", groupId);
  this.socket.emit("group:join", { groupId,userId });
}

// Listen for events from the server
on(eventName: string, callback: (data: any) => void) {
  this.socket.on(eventName, callback);
}

  joinGroup(groupId: string, userId: string) {
    this.socket.emit('group:join', { groupId, userId });
  }

  leaveGroup(groupId: string, userId: string) {
    this.socket.emit('group:leave', { groupId, userId });
  }

  sendMessage(groupId: string, userId: string, message: string, receivers: any) {
    this.socket.emit('group:message:send', { groupId, userId, message });
  }

  onNewMessage(): Observable<any> {
    return fromEvent(this.socket, 'group:message:receive');
  }

  onTyping(): Observable<any> {
    return fromEvent(this.socket, 'group:typing');
  }

  onStopTyping(): Observable<any> {
    return fromEvent(this.socket, 'group:stopTyping');
  }

  sendTyping(groupId: string, userId: string) {
    this.socket.emit('group:typing', { groupId, userId });
  }

  stopTyping(groupId: string, userId: string) {
    this.socket.emit('group:stopTyping', { groupId, userId });
  }

  onNotification(): Observable<any> {
    return fromEvent(this.socket, 'notification:new');
  }

  listen(event: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(event, (data) => {
        subscriber.next(data);
      });
    });
  }
}
