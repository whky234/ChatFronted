import { Component, OnDestroy, OnInit } from '@angular/core';
import { GroupcallService } from '../services/groupcall.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-groupcall',
  templateUrl: './groupcall.component.html',
  styleUrls: ['./groupcall.component.css']
})
export class GroupcallComponent implements OnInit, OnDestroy {
  roomId: string = '';
  isInRoom = false;
  localStream: MediaStream | null = null;
  remoteStreams = new Map<string, MediaStream>();
  username = '';

  micEnabled = true;
  cameraEnabled = true;
  isMinimized = false;

  chatMessages: string[] = [];
  chatInput = '';
  errorMessage = '';

  constructor(
    private webRTCService: GroupcallService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.webRTCService.getLocalStream().subscribe(stream => {
      this.localStream = stream;
    });

    this.webRTCService.getRemoteStreams().subscribe(streams => {
      this.remoteStreams = streams;
    });

    this.authService.getCurrentUser().subscribe(user => {
      this.username = user.name;
    });

    this.setupSocketErrorHandlers();
  }

  private setupSocketErrorHandlers() {
    this.webRTCService['socket'].on('room-error', (msg: string) => {
      this.errorMessage = msg;
    });

    this.webRTCService['socket'].on('call-ended', () => {
      this.isInRoom = false;
      this.roomId = '';
      this.errorMessage = 'Call ended by host';
    });
  }

  async createRoom() {
    try {
      const newRoomId = await this.webRTCService.createRoom();
      this.roomId = newRoomId;
      await this.webRTCService.joinRoom(this.roomId);
      this.isInRoom = true;
      this.errorMessage = '';
    } catch (err) {
      this.errorMessage = 'Failed to create room';
    }
  }

  async joinRoom() {
    if (!this.roomId) return;

    try {
      await this.webRTCService.joinRoom(this.roomId);
      this.isInRoom = true;
      this.errorMessage = '';
    } catch (err) {
      this.errorMessage = 'Could not join room';
    }
  }

  leaveRoom() {
    if (this.roomId) {
      this.webRTCService.leaveRoom(this.roomId);
    }
    this.isInRoom = false;
    this.roomId = '';
    this.errorMessage = '';
  }

  endCall() {
    if (this.roomId) {
      this.webRTCService.endCall(this.roomId);
    }
    this.isInRoom = false;
    this.roomId = '';
    this.errorMessage = '';
  }

  toggleMic() {
    if (this.localStream) {
      this.micEnabled = !this.micEnabled;
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = this.micEnabled;
      });
    }
  }

  toggleCamera() {
    if (this.localStream) {
      this.cameraEnabled = !this.cameraEnabled;
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = this.cameraEnabled;
      });
    }
  }

  async shareScreen() {
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      for (const pc of this.webRTCService['peerConnections'].values()) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      }

      screenTrack.onended = () => {
        if (this.localStream) {
          const originalTrack = this.localStream.getVideoTracks()[0];
          for (const pc of this.webRTCService['peerConnections'].values()) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(originalTrack);
            }
          }
        }
      };
    } catch (err) {
      console.error('Screen share failed:', err);
    }
  }

  toggleMinimized() {
    this.isMinimized = !this.isMinimized;
  }

  ngOnDestroy() {
    this.leaveRoom();
  }

  gridTemplateColumns(): string {
    const total = this.remoteStreams.size + (this.localStream ? 1 : 0);

    if (total <= 1) return '1fr';
    if (total === 2) return '1fr 1fr';
    if (total <= 4) return '1fr 1fr';
    if (total <= 6) return '1fr 1fr 1fr';
    if (total <= 9) return '1fr 1fr 1fr';
    return '1fr 1fr 1fr 1fr'; // max 4 per row
  }
}
