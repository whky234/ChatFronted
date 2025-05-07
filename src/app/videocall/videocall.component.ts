import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { VideosocService } from '../services/videosoc.service';

@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.component.html',
  styleUrls: ['./videocall.component.css']
})
export class VideocallComponent implements AfterViewInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteAudio') remoteAudioRef!: ElementRef<HTMLAudioElement>;

  roomId: string = '';
  joiningRoomId: string = '';
  isInRoom: boolean = false;
  isCreatingRoom: boolean = false;
  isJoiningRoom: boolean = false;
  isMuted: boolean = true;
  isVideoOff: boolean = false;
  errorMessage: string = '';

  isMinimized: boolean = false;
isVisible: boolean = true; // for fully closing the dialog
roomFull: boolean = false;
roomNotFound: boolean = false;

  constructor(private videoSocService: VideosocService) {}

  ngOnInit(): void {
    this.videoSocService.onRoomFull().subscribe(full => {
      if (full) {
        this.roomFull = true;
        alert('Room is full. Please try a different room.');
      }
    });

    this.videoSocService.onRoomNotFound().subscribe(notFound => {
      if (notFound) {
        this.roomNotFound = true;
        alert('Room not found. Please check the room ID.');
      }
    });
  }


  async ngAfterViewInit() {
    try {
      await this.checkMediaPermissions();
      this.setupRemoteStreamHandling();
    } catch (err) {
      this.errorMessage = 'Could not access camera/microphone. Please check permissions.';
      console.error('Media initialization error:', err);
    }
  }

  private async checkMediaPermissions(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      throw err;
    }
  }

  private setupRemoteStreamHandling() {
    this.videoSocService.onRemoteStreamAdded().subscribe(stream => {
      if (this.remoteVideoRef?.nativeElement) {
        this.remoteVideoRef.nativeElement.srcObject = stream;
        this.remoteVideoRef.nativeElement.play().catch(err => {
          console.error('Remote video play failed:', err);
          setTimeout(() => this.remoteVideoRef.nativeElement.play(), 500);
        });
      }
    });

    this.videoSocService.onRemoteAudioAdded().subscribe(track => {
      if (this.remoteAudioRef?.nativeElement) {
        const audioStream = new MediaStream();
        audioStream.addTrack(track);
        this.remoteAudioRef.nativeElement.srcObject = audioStream;
        this.handleAudioAutoplay(this.remoteAudioRef.nativeElement);
      }
    });
  }

  private handleAudioAutoplay(audioElement: HTMLAudioElement) {
    audioElement.play().catch(err => {
      console.log('Audio playback blocked, waiting for user interaction');
      const playAudio = () => {
        audioElement.play()
          .then(() => document.removeEventListener('click', playAudio))
          .catch(e => console.error('Audio play failed:', e));
      };
      document.addEventListener('click', playAudio);
    });
  }

  async createRoom() {
    this.isCreatingRoom = true;
    this.errorMessage = '';
    try {
      this.roomId = await this.videoSocService.createRoom();
      this.isInRoom = true;
      await this.setupLocalMedia();
    } catch (error) {
      console.error('Error creating room:', error);
      this.errorMessage = 'Failed to create room. Please try again.';
    } finally {
      this.isCreatingRoom = false;
    }
  }

  async joinRoom() {
    this.isJoiningRoom = true;
    this.errorMessage = '';
    this.roomFull = false;
    this.roomNotFound = false;
    try {
      const success = await this.videoSocService.joinRoom(this.joiningRoomId);

      if (this.roomFull || this.roomNotFound) {
        return; // Don't proceed if either condition is met
      }
      if (success) {
        this.roomId = this.joiningRoomId;
        this.isInRoom = true;
        await this.setupLocalMedia();
      }
    } catch (error) {
      console.error('Error joining room:', error);
      this.errorMessage = 'Failed to join room. Please check the ID and try again.';
    } finally {
      this.isJoiningRoom = false;
    }
  }

  private async setupLocalMedia() {
    try {
      const localStream = await this.videoSocService.getLocalStream();
      if (localStream && this.localVideoRef) {
        this.localVideoRef.nativeElement.srcObject = localStream;
        await this.localVideoRef.nativeElement.play().catch(e => {
          console.error('Local video play error:', e);
          this.errorMessage = 'Error starting local video. Please refresh and try again.';
        });
      }
    } catch (err) {
      console.error('Local media setup error:', err);
      this.errorMessage = 'Error setting up local media.';
    }
  }

  async toggleMute() {
    const localStream = this.videoSocService.getCurrentLocalStream();
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => track.enabled = !track.enabled);
      this.isMuted = !this.isMuted;
    }
  }

  async toggleVideo() {
    const localStream = this.videoSocService.getCurrentLocalStream();
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => track.enabled = !track.enabled);
      this.isVideoOff = !this.isVideoOff;
    }
  }


  async leaveRoom() {
    this.videoSocService.cleanUp();
    this.isInRoom = false;
    this.roomId = '';
    this.joiningRoomId = '';
    this.isMuted = false;
    this.isVideoOff = false;
    this.resetMediaElements();

  }


  private resetMediaElements() {
    if (this.localVideoRef?.nativeElement) {
      this.localVideoRef.nativeElement.srcObject = null;
    }
    if (this.remoteVideoRef?.nativeElement) {
      this.remoteVideoRef.nativeElement.srcObject = null;
    }
    if (this.remoteAudioRef?.nativeElement) {
      this.remoteAudioRef.nativeElement.srcObject = null;
    }
  }

  ngOnDestroy() {
    // this.leaveRoom();
  }

  // Helper methods for template
  hasLocalVideo(): boolean {
    if (!this.localVideoRef?.nativeElement?.srcObject) return false;
    const stream = this.localVideoRef.nativeElement.srcObject as MediaStream;
    return stream.getVideoTracks().some(track => track.readyState === 'live');
  }

  hasRemoteVideo(): boolean {
    if (!this.remoteVideoRef?.nativeElement?.srcObject) return false;
    const stream = this.remoteVideoRef.nativeElement.srcObject as MediaStream;
    return stream.getVideoTracks().some(track => track.readyState === 'live');
  }

  minimizeDialog() {
    this.isMinimized = !this.isMinimized;
  }

  closeDialog() {
    this.leaveRoom(); // cleanup
    this.isVisible = false;
  }
}
