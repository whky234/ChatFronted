import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { Socket, io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class VideosocService {
  private socket: Socket;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private roomId: string | null = null;
  private isCaller: boolean = false;

  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private remoteAudioSubject = new BehaviorSubject<MediaStreamTrack | null>(null);
  private roomFullSubject = new BehaviorSubject<boolean>(false);
  private roomNotFoundSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });
    this.setupSocketListeners();
  }

  async createRoom(): Promise<string> {
    try {
      this.roomId = Math.random().toString(36).substring(2, 8);
      this.isCaller = true;
      this.socket.emit('createRoom', this.roomId);
      await this.getUserMedia();
      return this.roomId;
    } catch (err) {
      console.error('Error creating room:', err);
      throw err;
    }
  }

  async joinRoom(roomId: string): Promise<boolean> {
    try {
      this.roomId = roomId;
      this.isCaller = false;
      this.socket.emit('joinRoom', roomId);
      await this.getUserMedia();
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      throw err;
    }
  }

  onRemoteStreamAdded(): Observable<MediaStream> {
    return this.remoteStreamSubject.asObservable().pipe(
      filter((stream): stream is MediaStream => stream !== null)
    );
  }

  onRemoteAudioAdded(): Observable<MediaStreamTrack> {
    return this.remoteAudioSubject.asObservable().pipe(
      filter((track): track is MediaStreamTrack => track !== null)
    );
  }

  onRoomFull(): Observable<boolean> {
    return this.roomFullSubject.asObservable();
  }

  onRoomNotFound(): Observable<boolean> {
    return this.roomNotFoundSubject.asObservable();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => console.log('Connected to signaling server'));
    this.socket.on('connect_error', (err) => console.error('Connection error:', err));

    this.socket.on('roomFull', () => {
      console.warn('Room is full');
      this.roomFullSubject.next(true);
    });

    this.socket.on('roomNotFound', () => {
      console.warn('Room not found');
      this.roomNotFoundSubject.next(true);
    });

    this.socket.on('roomJoined', (roomId: string) => {
      console.log(`Joined room: ${roomId}`);
      this.roomFullSubject.next(false);
      this.roomNotFoundSubject.next(false);
    });

    this.socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      console.log('Received offer');
      if (!this.peerConnection) await this.createPeerConnection();
      try {
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);
        this.socket.emit('answer', { roomId: this.roomId, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    this.socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      console.log('Received answer');
      try {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    this.socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      console.log('Received ICE candidate');
      try {
        if (this.peerConnection && candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    this.socket.on('newParticipant', () => {
      console.log('New participant joined');
      this.startCall();
    });

    this.socket.on('participantLeft', () => {
      console.log('Participant left');
      this.cleanUp();
      this.remoteStreamSubject.next(null);
      this.remoteAudioSubject.next(null);
    });
  }

  async createPeerConnection(): Promise<void> {
    if (!this.localStream) await this.getUserMedia();

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.localStream!.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        this.remoteAudioSubject.next(event.track);
      } else if (event.track.kind === 'video') {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        this.remoteStreamSubject.next(stream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'disconnected') {
        this.cleanUp();
      }
    };
  }

  public async startCall(): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    if (this.peerConnection && this.isCaller) {
      try {
        console.log('Creating offer...');
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await this.peerConnection.setLocalDescription(offer);
        console.log('Sending offer...');
        this.socket.emit('offer', { roomId: this.roomId, offer });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }
  }

  public async openLocalStream(): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      return null;
    }
  }

  public async getLocalStream(): Promise<MediaStream | null> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    return this.localStream;
  }

  public getCurrentLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public cleanUp(): void {
    console.log('Cleaning up...');
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.roomId = null;
    this.isCaller = false;
  }

  public async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('Got media stream', this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }
}
