import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-ongoingcall',
  templateUrl: './ongoingcall.component.html',
  styleUrl: './ongoingcall.component.css'
})
export class OngoingcallComponent {
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  audioElement: HTMLAudioElement = new Audio();

  constructor(
    public dialogRef: MatDialogRef<OngoingcallComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.initializeCall();
  }

  ngOnDestroy(): void {
    this.endCall();
  }

  initializeCall() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.localStream = stream;
        this.localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.localStream));
      })
      .catch((error) => console.error('Error accessing audio devices:', error));

    // Handle remote audio
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.audioElement.srcObject = this.remoteStream;
      this.audioElement.play();
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.emit('call:ice-candidate', {
          fromUserId: this.data.fromUserId,
          toUserId: this.data.toUserId,
          candidate: event.candidate
        });
      }
    };

    this.listenForICECandidates();
  }

  listenForICECandidates() {
    this.socketService.on('call:ice-candidate', async (data: any) => {
      if (this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
  }

  endCall() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    this.dialogRef.close('ended');
  }
}
