import { Component, OnDestroy, OnInit } from '@angular/core';
import { GroupcallService } from '../services/groupcall.service';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  usernames: { [key: string]: string } = {};

  micEnabled = true;
  cameraEnabled = true;
  isMinimized = false;
  isChatOpen = false;

  chatMessages: string[] = [];
  chatInput = '';
  errorMessage = '';
  isHost = false;


  constructor(
    private webRTCService: GroupcallService,
    private authService: AuthService,
      private snackBar: MatSnackBar

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

    // Listen for private messages
    this.webRTCService.getPrivateMessages().subscribe(({ from, message }) => {
      this.chatMessages.push(`Private from ${from}: ${message}`);
    });
  }

  private showSuccess(message: string) {
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    panelClass: ['snack-success']
  });
}

private showError(message: string) {
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    panelClass: ['snack-error']
  });
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

    this.webRTCService['socket'].on('participant-removed', (msg: string) => {
  this.showError(msg);
  this.leaveRoom();


});

this.webRTCService['socket'].on('muted-by-host', () => {
  this.localStream?.getAudioTracks().forEach(track => track.enabled = false);
  this.showError('You were muted by the host');
});

this.webRTCService['socket'].on('camera-off-by-host', () => {
  this.localStream?.getVideoTracks().forEach(track => track.enabled = false);
  this.showError('Your camera was turned off by the host');
});


  }

  participantMuteStatus: { [key: string]: boolean } = {};
  participantCameraStatus:{ [key: string]: boolean } = {};


  toggleHostCamera(participantId: string) {
  const isCameraOff = this.webRTCService.isParticipantCameraOff(participantId);
  const newCameraStatus = !isCameraOff;

  this.webRTCService.toggleCameraParticipant(this.roomId, participantId, newCameraStatus);
  this.webRTCService.setParticipantCameraStatus(participantId, newCameraStatus);

  const action = newCameraStatus ? 'Camera Off' : 'Camera On';
  this.showSuccess(`${action} for ${this.usernames[participantId] || participantId}`);
}

isParticipantCameraOff(id: string): boolean {
  return this.participantCameraStatus[id] ?? false;
}


toggleMute(participantId: string) {
  const isMuted = this.webRTCService.isParticipantMuted(participantId);
  const newMuteStatus = !isMuted;

  this.webRTCService.toggleMuteParticipant(this.roomId, participantId, newMuteStatus);

  // Update the local mute status map
  this.webRTCService.setParticipantMuteStatus(participantId, newMuteStatus);

  const action = newMuteStatus ? 'Muted' : 'Unmuted';
  this.showSuccess(`${action} ${this.usernames[participantId] || participantId}`);
}




removeUser(participantId: string) {
  this.webRTCService.removeParticipant(this.roomId, participantId);
  this.showSuccess(`Removed ${this.usernames[participantId] || participantId} from the room`);

}

isParticipantMuted(id: string): boolean {
  return this.participantMuteStatus[id] ?? false;
}

copyRoomId() {
  navigator.clipboard.writeText(this.roomId).then(() => {
    this.showSuccess('Room ID copied to clipboard!');
  }).catch(() => {
    this.showError('Failed to copy Room ID.');
  });
}





  async createRoom() {
    try {
      const newRoomId = await this.webRTCService.createRoom();
      this.roomId = newRoomId;
      await this.webRTCService.joinRoom(this.roomId);
      this.isInRoom = true;
      this.isHost = true;
      this.errorMessage = '';
       this.showSuccess('Room created and joined successfully!');
    } catch (err) {
      this.errorMessage = 'Failed to create room';
    this.showError(this.errorMessage);
    }
  }





  async joinRoom() {
    if (!this.roomId) return;

    try {
      await this.webRTCService.joinRoom(this.roomId);
      this.isInRoom = true;
          this.isHost = false; // Not the host

      this.errorMessage = '';
        this.showSuccess('Joined the room successfully!');
    } catch (err) {
    this.errorMessage = 'Could not join room';
    this.showError(this.errorMessage);    }
  }

  leaveRoom() {
    if (this.roomId) {
      this.webRTCService.leaveRoom(this.roomId);
          this.showSuccess('Left the room.');

    }
    this.isInRoom = false;
    this.roomId = '';
    this.errorMessage = '';
  }

  endCall() {
    if (this.roomId) {
      this.webRTCService.endCall(this.roomId);

      this.showSuccess('Call ended.');
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

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
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

  registerUsername() {
     if (this.username) {
    this.webRTCService.registerUser(this.username);
    this.showSuccess(`Username "${this.username}" registered`);
  } else {
    this.showError('Username cannot be empty');
  }
  }

  sendPrivateMessage(username: string, message: string) {
   if (username && message) {
    this.webRTCService.sendPrivateMessageByUsername(username, message);
    this.chatMessages.push(`To ${username}: ${message}`);
    this.showSuccess('Private message sent');
  } else {
    this.showError('Recipient and message are required');
  }
  }

  sendMessage() {
    if (this.chatInput.trim()) {
      this.chatMessages.push(`You: ${this.chatInput}`);
      this.chatInput = '';
    }
  }
}
