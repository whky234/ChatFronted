import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class GroupcallService {
  private socket: Socket;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStream = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreams = new BehaviorSubject<Map<string, MediaStream>>(
    new Map()
  );
  private privateMessage$ = new Subject<{ from: string; message: string }>();

  participantMuteStatus: { [key: string]: boolean } = {};
  participantCameraStatus: { [key: string]: boolean } = {};


  constructor(private snackBar: MatSnackBar) {
    this.socket = io('http://localhost:3000');
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('user-joined', (userId: string) => {
      this.createPeerConnection(userId, true);
    });

    this.socket.on('call-ended', () => {
      console.log('Call ended by host');
      this.cleanup();
    });

    this.socket.on('user-left', (userId: string) => {
      this.removePeerConnection(userId);
    });

    this.socket.on('room-users', (users: string[]) => {
      users.forEach((userId) => this.createPeerConnection(userId, false));
    });

    this.socket.on('offer', async ({ from, offer }) => {
      console.log(`Received offer from ${from}`);

      const pc = this.getPeerConnection(from);
      await (await pc).setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await (await pc).createAnswer();
      await (await pc).setLocalDescription(answer);
      this.socket.emit('answer', { targetId: from, answer });
    });

    this.socket.on('answer', async ({ from, answer }) => {
      console.log(`Received answer from ${from}`);

      const pc = this.getPeerConnection(from);
      await (await pc).setRemoteDescription(new RTCSessionDescription(answer));
    });

    this.socket.on('ice-candidate', async ({ from, candidate }) => {
      console.log(`ICE Candidate from ${from}:`, candidate);

      const pc = this.getPeerConnection(from);
      if (candidate) {
        await (await pc).addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Private messaging listeners
    this.socket.on('private-message', ({ from, message }) => {
      console.log(`Private message from ${from}: ${message}`);
      this.snackBar.open(`Private message from ${from}: ${message}`, 'Close', {
        duration: 3000,
      });
      this.privateMessage$.next({ from, message });
    });

    this.socket.on('user-not-found', (username: string) => {
      console.error(`User not found: ${username}`);
       this.snackBar.open(
        `User not found: ${username}`,
        'Dismiss',
        {
          duration: 3000,
        }
      );
    });

    this.socket.on('user-registered', ({ success }) => {
      console.log(`User registration ${success ? 'successful' : 'failed'}`);
    });

    this.socket.on('removed-from-room', () => {
      this.snackBar.open(
        'You were removed from the room by the host',
        'Dismiss',
        {
          duration: 3000,
        }
      );
      this.cleanup();
    });



    this.socket.on('mute-status', ({ muted }) => {
      this.snackBar.open(
        `Your mic has been ${muted ? 'muted' : 'unmuted'} by the host`,
        'Dismiss',
        {
          duration: 3000,
        }
      );
      const stream = this.localStream.value;
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !muted;
        });
      }
    });

    this.socket.on('mute-camera', ({ muted }) => {
  this.snackBar.open(
    `Your camera has been ${muted ? 'turned off' : 'turned on'} by the host`,
    'Dismiss',
    { duration: 3000 }
  );
  const stream = this.localStream.value;
  if (stream) {
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }
});

  }

  toggleCameraParticipant(roomId: string, targetId: string, muted: boolean) {
  this.socket.emit('toggle-camera', { roomId, targetId, muted });
}

  isParticipantMuted(id: string): boolean {
    return this.participantMuteStatus[id] ?? false;
  }

  removeParticipant(roomId: string, targetId: string) {
    this.socket.emit('remove-participant', { roomId, targetId });
    this.removePeerConnection(targetId);
  }

  toggleMuteParticipant(roomId: string, targetId: string, muted: boolean) {
    this.socket.emit('toggle-mute', { roomId, targetId, muted });
  }

  setParticipantMuteStatus(participantId: string, muted: boolean) {
    this.participantMuteStatus[participantId] = muted;
  }

  setParticipantCameraStatus(participantId: string, status: boolean) {
  this.participantCameraStatus[participantId] = status;
}

isParticipantCameraOff(participantId: string): boolean {
  return this.participantCameraStatus[participantId] ?? false;
}

  private async createPeerConnection(userId: string, initiator = false) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${userId}`, event.candidate);

        this.socket.emit('ice-candidate', {
          targetId: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received remote track from ${userId}`);

      const streams = this.remoteStreams.value;
      streams.set(userId, event.streams[0]);
      this.remoteStreams.next(streams);
    };

    const localStream = this.localStream.value;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    this.peerConnections.set(userId, pc);

    if (initiator) {
      console.log(`Creating offer to ${userId}`);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket.emit('offer', { targetId: userId, offer });
    }

    return pc;
  }

  private async getPeerConnection(userId: string): Promise<RTCPeerConnection> {
    let pc = this.peerConnections.get(userId);
    if (!pc) {
      pc = await this.createPeerConnection(userId);
    }
    return pc;
  }

  private removePeerConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }

    const streams = this.remoteStreams.value;
    streams.delete(userId);
    this.remoteStreams.next(streams);
  }

  async joinRoom(roomId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localStream.next(stream);
      this.socket.emit('join-room', roomId);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      this.snackBar.open('Error accessing camera/mic', 'Dismiss', {
        duration: 3000,
      });
    }
  }
  createRoom(): Promise<string> {
    return new Promise((resolve) => {
      this.socket.emit('create-room');
      this.socket.once('room-created', ({ roomId }) => {
        resolve(roomId);
      });
    });
  }




  getLocalStream() {
    return this.localStream.asObservable();
  }

  getRemoteStreams() {
    return this.remoteStreams.asObservable();
  }

  leaveRoom(roomId: string) {
    this.socket.emit('leave-room', roomId);
    this.cleanup();
  }

  endCall(roomId: string) {
    this.socket.emit('end-call', roomId);
    this.cleanup();
  }
  private cleanup() {
    // Stop and clear local stream
    const stream = this.localStream.value;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.localStream.next(null);
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Clear remote streams
    this.remoteStreams.next(new Map());
  }

  // Register a user by username
  registerUser(username: string) {
    this.socket.emit('register-user', username);
  }

  // Send a private message using recipient's username
  sendPrivateMessageByUsername(username: string, message: string) {
    this.socket.emit('private-message-username', { username, message });
  }

  // Listen for incoming private messages
  getPrivateMessages(): Observable<{ from: string; message: string }> {
    return this.privateMessage$.asObservable();
  }
}
