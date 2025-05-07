import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SocketService } from '../services/socket.service';
import { ParticipantprofileComponent } from '../participantprofile/participantprofile.component';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Modal } from 'bootstrap';
import { Dialog } from '@angular/cdk/dialog';
import { AudiocallcomponentComponent } from '../audiocallcomponent/audiocallcomponent.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { VideocallComponent } from '../videocall/videocall.component';

export interface Message {
  _id: string;
  text: string;
  time: string;
  type: string; // 'sent' or 'received'
  senderName?: string; // Add optional senderName
  receiverName?: string; // Add optional receiverName
  fileUrl?: string | null; // Optional property for file URL
  audioUrl?: string | null; // Optional property for audio URL

  deliveryStatus?: string | null;
}

@Component({
  selector: 'app-chatwindow',
  templateUrl: './chatwindow.component.html',
  styleUrls: ['./chatwindow.component.css'],
})
export class ChatwindowComponent {
  @ViewChild('waveform') waveformRef!: ElementRef; // Reference to the waveform container

  selectemoji: boolean = false;
  @Input() selectedUser: any;
  @Input() currentUser: any;
  messages: Message[] = [];
  message: string = ''; // Input field message
  emojis: any[] = [];
  limitedEmojis: any[] = [];
  isprogress: boolean = false;
  selectedFile: File | null = null;
  isTyping: boolean = false;
  typingIndicator: string = '';
  typingTimeout: any;
  isRecording: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  audioUrl: string | null = null;

  editingMessage: any = null;
  editedText: string = '';

  blockedUsers: string[] = []; // Store blocked user IDs

  contacts: any[] = [];
  showContactList: boolean = false;
  selectedMessageToForward: any = null;

  inCall = false;
  activeRoom: any;
  @ViewChild('videoContainer', { static: false }) videoContainer!: ElementRef;
  peerConnection: RTCPeerConnection | null = null;
  incomingCall = false;
  callerName = '';

  @ViewChild('chatWindow') chatWindow!: ElementRef;
  showScrollButton = false;

  isSearching: boolean = false;
  searchQuery: string = '';
  filteredMessages: any[] = []; // This stores the filtered messages
  currentChatWithId: string | null = null;


  constructor(
    private socketService: SocketService,
    private authser: AuthService,
    private Dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private dialog: Dialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Load emojis and setup periodic refresh for messages
    this.getEmoji();
    this.getMessages();
    this.receiveSocket();
    this.deleteSocket();
    this.notifyOnlineStatus();
    this.fetchBlockedUsers();
    console.log('id', this.currentUser._id);

    console.log('✅ Subscribing to message:edited event');

    this.socketService.listen('message:edited').subscribe((data) => {
      console.log('🔥 Message edited received:', data);

      const index = this.messages.findIndex((m) => m._id === data.messageId);
      if (index !== -1) {
        this.messages[index].text = data.newText;
        this.cdr.detectChanges(); // Ensure UI updates
      }
    });

    setInterval(() => {
      this.cdr.detectChanges(); // Manually detect changes
    }, 60000); // Runs every 1 minute
  }

  ngAfterViewInit() {
    this.chatWindow.nativeElement.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } =
        this.chatWindow.nativeElement;
      this.showScrollButton = scrollHeight - scrollTop - clientHeight > 100;
    });
  }

  ngOnDestroy(): void {
    this.notifyOfflineStatus();
    this.socketService.disconnect();
    if (this.currentChatWithId) {
      this.socketService.emit('chat:close', {
        userId: this.currentUser._id,
      });
      console.log(`[DEBUG] Component destroyed. Chat closed.`);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedUser'] && changes['selectedUser'].currentValue) {
      const newChatId = this.selectedUser.userId._id;

      if (this.currentChatWithId && this.currentChatWithId !== newChatId) {
        this.closePreviousChat(this.currentChatWithId);
      }

      this.getMessages();
      this.receiveSocket();
    }
  }


  @HostListener('window:beforeunload', ['$event'])
  onWindowClose(event: Event): void {
    // Notify the server when the user closes the browser
    this.notifyOfflineStatus();
  }

  @HostListener('window:beforeunload', ['$event'])
handleBeforeUnload(event: Event) {
  this.closePreviousChat(this.currentUser._id);
}
  notifyActiveChat() {
    if (this.selectedUser?.userId?._id) {
      this.socketService.emit('chat:open', {
        userId: this.currentUser._id,
        chatWithUserId: this.selectedUser.userId._id,
      });

      console.log("chatopen")
    }
  }

  toggleSearch(): void {
    this.isSearching = !this.isSearching;
    this.searchQuery = ''; // Clear search when closing
    if (!this.isSearching) {
      this.filteredMessages = this.messages; // Reset messages when search closes
    }
  }
  filterMessages(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredMessages = [...this.messages]; // Show all messages if search is empty
    } else {
      this.filteredMessages = this.messages.filter((message) =>
        message.text.toLowerCase().includes(query)
      );
    }
  }

  receiveSocket(): void {
    // ✅ Cleanup previous listeners
    this.socketService.off('message:receive');
    this.socketService.off('message:sent');
    this.socketService.off('message:seen');
    this.socketService.off('typing');
    this.socketService.off('stopTyping');
    this.socketService.off('user:status');

    // ✅ Rebind all necessary listeners
    this.socketService.on('user:status', (data) => {
      if (data.userId === this.selectedUser.userId._id) {
        this.selectedUser.userId.isOnline = data.isOnline;
        this.cdr.detectChanges();
      }
    });

    this.socketService.on('typing', (data) => {
      if (data.fromUserId === this.selectedUser.userId._id) {
        this.typingIndicator = `${this.selectedUser.name} is typing...`;
      }
    });

    this.socketService.on('stopTyping', (data) => {
      if (data.fromUserId === this.selectedUser.userId._id) {
        this.typingIndicator = '';
      }
    });

    this.socketService.on('message:receive', (newMessage) => {
      console.log('📩 Received new message:', newMessage);

      if (!newMessage.sender || !newMessage.sender._id) return;

      const isRelevant =
        this.selectedUser.userId._id === newMessage.sender._id ||
        this.selectedUser.userId._id === newMessage.receiver._id;

      if (!isRelevant) return;

      const receivedMessage = {
        _id: newMessage.message._id,
        text: newMessage.message.text,
        time: new Date(newMessage.message.time).toLocaleString(),
        type:
          newMessage.sender._id === this.currentUser._id ? 'sent' : 'received',
        senderName: newMessage.sender.name,
        receiverName: newMessage.receiver?.name || 'Unknown',
        fileUrl: newMessage.message.fileUrl
          ? `http://localhost:3000${newMessage.message.fileUrl}`
          : null,
        audioUrl: newMessage.message.audioUrl
          ? `http://localhost:3000${newMessage.message.audioUrl}`
          : null,
        deliveryStatus: newMessage.message.deliveryStatus,
      };

      this.messages.push(receivedMessage);
      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 200);

      const isInActiveChat =
    this.currentChatWithId === newMessage.sender._id ||
    this.currentChatWithId === newMessage.receiver._id;

  if (isInActiveChat && newMessage.sender._id !== this.currentUser._id) {
    this.messageSeen(newMessage.message._id); // ✅ Auto mark as seen
  }
    });
    this.socketService.on('message:sent', (data) => {
      const msg = this.messages.find((m) => m._id === data.messageId);
      if (msg) {
        msg.deliveryStatus = 'sent';
        this.cdr.detectChanges();
      }
    });


    this.socketService.on('message:seen', (data) => {
      const msg = this.messages.find((m) => m._id === data.messageId);
      if (msg) {
        msg.deliveryStatus = 'seen';
        this.cdr.detectChanges();
        console.log('👁️ Message seen on sender side:', msg);
      }
    });

  }


  deleteSocket(): void {
    // Listen for delete event from the server
    this.socketService.on('message:deleted', (data) => {
      console.log('🚨 Message deleted:', data.messageId);

      // Remove deleted message from UI in real time
      this.messages = this.messages.filter((msg) => msg._id !== data.messageId);
    });
  }

  notifyOnlineStatus(): void {
    this.socketService.emit('user:online', this.currentUser._id);
  }

  notifyOfflineStatus(): void {
    this.socketService.emit('user:offline', this.currentUser._id);
  }
  onMessageInput() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.socketService.emit('typing', {
        toUserId: this.selectedUser.userId._id,
        fromUserId: this.currentUser._id,
      });
    }

    clearTimeout(this.typingTimeout); // Clear any existing timeout

    // Set a timeout to emit stopTyping after a delay
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      this.socketService.emit('stopTyping', {
        toUserId: this.selectedUser.userId._id,
        fromUserId: this.currentUser._id,
      });
    }, 10000); // Adjust debounce delay as needed
    setTimeout(() => {
      this.scrollToBottom();
    }, 200);
  }

  scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTop =
        this.chatWindow.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  getEmoji() {
    this.isprogress = true;

    const emojiList = [
      '😀',
      '😁',
      '😂',
      '🤣',
      '😃',
      '😄',
      '😅',
      '😆',
      '😉',
      '😊',
      '😋',
      '😎',
      '😍',
      '😘',
      '😗',
      '😙',
      '😚',
      '🙂',
      '🤗',
      '🤩',
      '🤔',
      '🤨',
      '😐',
      '😑',
      '😶',
      '🙄',
      '😏',
      '😣',
      '😥',
      '😮',
      '🤐',
      '😯',
      '😪',
      '😫',
      '😴',
      '😌',
      '😛',
      '😜',
      '😝',
      '🤤',
      '😒',
      '😓',
      '😔',
      '😕',
      '🙃',
      '🤑',
      '😲',
      '☹',
      '😖',
      '😞',
      '😟',
      '😢',
      '😭',
      '😤',
      '😠',
      '😡',
      '🤬',
      '🤯',
      '😳',
      '🥺',
    ];

    this.emojis = emojiList.slice(0, 60); // Limit to 60 emojis
    this.isprogress = false;
  }

  appendEmoji(emoji: string): void {
    this.message += emoji;
  }

  onSelectEmoji(): void {
    this.selectemoji = !this.selectemoji;
    setTimeout(() => this.scrollToBottom(), 100); // Ensure the UI updates before scrolling
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.message = `File: ${this.selectedFile.name}`; // Show the filename in the message input
    }
  }
  isZipFile(fileUrl: string | null | undefined): boolean {
    return fileUrl ? fileUrl.toLowerCase().endsWith('.zip') : false;
  }

  closePreviousChat(previousChatWithId: string): void {
    this.socketService.emit('chat:close', {
      userId: this.currentUser._id,
      chatWithUserId: previousChatWithId,
    });

    console.log('📴 chat:close emitted for:', previousChatWithId);
    console.log(`[DEBUG] Chat closed on page unload.`);
  }

  getMessages() {
    const newChatWithId = this.selectedUser.userId._id;

    if (!newChatWithId) return;

    // ✅ Always emit chat:open (even for same chat)
    this.notifyActiveChat();

    // ✅ If same chat, just refresh listeners and scroll
    const isSameChat = this.currentChatWithId === newChatWithId;
    this.currentChatWithId = newChatWithId;

    // ✅ Reset UI state regardless
    this.typingIndicator = '';

    // ⚠️ Optional: Skip re-fetching if you already have messages for this chat
    // You can disable this check if your backend might return updated statuses
    if (isSameChat && this.messages.length > 0) {
      console.log('🔁 Reopened same chat. Not refetching messages.');
      return;
    }

    // ✅ Otherwise fetch messages from backend
    console.log('📩 Fetching messages for:', newChatWithId);
    this.messages = [];

    this.authser.getMessages(newChatWithId).subscribe(
      (data: any[]) => {
        this.messages = data
          .map((message) => ({
            _id: message._id,
            text: message.text,
            time: new Date(message.time).toLocaleString(),
            type: message.sender._id === this.currentUser._id ? 'sent' : 'received',
            senderName: message.sender.name,
            receiverName: message.receiver?.name || 'Unknown',
            fileUrl: message.fileUrl ? `http://localhost:3000${message.fileUrl}` : null,
            audioUrl: message.audioUrl ? `http://localhost:3000${message.audioUrl}` : null,
            deliveryStatus: message.deliveryStatus,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        console.log('✅ Fetched messages:', this.messages);

        // ✅ Mark unseen messages as seen
        this.messages.forEach((msg) => {
          if (msg.type === 'received' && msg.deliveryStatus !== 'seen') {
            this.messageSeen(msg._id);
          }
        });

        // ✅ Scroll to latest
        setTimeout(() => this.scrollToBottom(), 200);
      },
      (error) => {
        console.error('❌ Error fetching messages:', error);
        this.snackBar.open(
          error?.error?.message || 'Failed to fetch messages.',
          'Close',
          { duration: 3000 }
        );
      }
    );
  }


  messageSeen(messageId: string): void {
    if (!messageId || !this.currentUser?._id || !this.selectedUser?.userId?._id) {
      return;
    }

    this.socketService.emit('message:seen', {
      messageId,
      fromUserId: this.currentUser._id,
      toUserId: this.selectedUser.userId._id,
    });

    console.log('👁️ Emitted message:seen for', messageId);
  }



  // Fetch chat users when opening the forward modal
  // Open Forward Modal with Chat Users
  openForwardModal(message: any) {
    this.selectedMessageToForward = message;
    this.showContactList = true;

    this.authser.fetchChatUsers().subscribe({
      next: (users) => {
        console.log('Raw Users Response:', users);
        this.contacts = users.chatUsers;
      },
      error: (err) => {
        console.error('Failed to fetch chat users:', err);
      },
    });
  }

  sendMessage(): void {
    if (
      this.message.trim() ||
      this.selectedFile ||
      (this.audioUrl && this.audioChunks.length > 0)
    ) {
      const formData = new FormData();
      formData.append('receiver', this.selectedUser.userId._id);
      formData.append(
        'text',
        this.message.trim() || (this.audioUrl ? 'Audio message' : '')
      );

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      } else if (this.audioUrl && this.audioChunks.length > 0) {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', {
          type: 'audio/wav',
        });
        formData.append('file', audioFile);
      }

      this.socketService.emit('stopTyping', {
        toUserId: this.selectedUser.userId._id,
        fromUserId: this.currentUser._id,
      });

      this.isTyping = false; // Reset typing state

      this.authser.sendMessage(formData).subscribe({
        next: (response) => {
          const newMessage = {
            _id: response.message?._id,
            text: this.message.trim() || '',
            type: 'sent',
            time: new Date().toISOString(),
            fileUrl: response?.message.fileUrl
              ? `http://localhost:3000${response?.message.fileUrl}`
              : null,
            audioUrl: response?.message.audioUrl
              ? `http://localhost:3000${response?.message.audioUrl}`
              : null,
            senderName: this.currentUser.name,
            receiverName: this.selectedUser.name,
            deliveryStatus: response.message?.deliveryStatus, // Initially mark as sent
          };

          this.playSound('/assets/message-124468.mp3');
          setTimeout(() => this.scrollToBottom(), 200);
          this.messages.push(newMessage);

          this.socketService.emit('message:send', {
            message: newMessage,
            toUserId: this.selectedUser.userId._id,
            fromUserId: this.currentUser._id,
          });

          this.clearInputs();
          if (this.audioUrl) this.clearAudioRecording(); // Clear recording if audio message
        },
        error: (err: HttpErrorResponse) => {
          console.error('Failed to send message:', err);
          this.showErrorSnackbar(
            err.error?.message || 'Failed to send message. Please try again.'
          );
        },
      });
    }
  }

  // Show Snackbar for error messages
  private showErrorSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // Show for 3 seconds
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'], // Custom styling
    });
  }

  playSound(soundFile: string) {
    const audio = new Audio(soundFile);
    audio.play();
  }

  deleteMessageForMe(messageId: string): void {
    this.authser.deleteMessageForMe(messageId).subscribe({
      next: () => {
        this.messages = this.messages.filter((msg) => msg._id !== messageId); // Remove message from UI
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      },
    });
  }

  deleteMessageForEveryone(messageId: string): void {
    this.authser.deleteMessageForEveryone(messageId).subscribe({
      next: () => {
        // Emit delete event to backend
        this.socketService.emit('message:delete', {
          messageId,
          fromUserId: this.currentUser._id,
          toUserId: this.selectedUser.userId._id,
        });

        // Remove message from UI
        this.messages = this.messages.filter((msg) => msg._id !== messageId);
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      },
    });
  }

  isWithinTimeLimit(timestamp: string): boolean {
    // Parse the timestamp using JavaScript Date object
    const parts = timestamp.split(', '); // Split date and time
    const dateParts = parts[0].split('/'); // Extract DD/MM/YYYY
    const timeParts = parts[1].split(':'); // Extract HH:mm:ss

    // Create a Date object in the correct format (YYYY, MM-1, DD, HH, MM, SS)
    const messageTime = new Date(
      Number(dateParts[2]), // Year
      Number(dateParts[1]) - 1, // Month (0-based index)
      Number(dateParts[0]), // Day
      Number(timeParts[0]), // Hours
      Number(timeParts[1]), // Minutes
      Number(timeParts[2]) // Seconds
    ).getTime();

    const currentTime = new Date().getTime(); // Get current time in milliseconds
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

    return currentTime - messageTime <= tenMinutes;
  }

  enableEditMode(message: any) {
    this.editingMessage = message;
    this.editedText = message.text;
  }

  cancelEdit() {
    this.editingMessage = null;
    this.editedText = '';
  }

  updateMessage(messageId: string) {
    if (!this.editedText.trim()) {
      return;
    }

    this.authser.EditMessage(messageId, this.editedText).subscribe({
      next: (updatedMessage) => {
        // ✅ Update the local messages array
        console.log('update', updatedMessage);
        const index = this.messages.findIndex((m) => m._id === messageId);
        if (index !== -1) {
          this.messages[index].text = this.editedText;
        }

        // ✅ Emit socket event for real-time update
        this.socketService.emit('message:edit', {
          messageId: messageId,
          newText: this.editedText,
          toUserId: this.selectedUser.userId._id,
          fromUserId: this.currentUser._id,
        });

        this.cancelEdit(); // Reset edit state
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      },
    });
  }

  startRecording(): void {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.isRecording = true;
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.audioUrl = URL.createObjectURL(audioBlob);
          this.cdr.detectChanges(); // Trigger change detection
        };

        this.mediaRecorder.start();
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }

  // Method to stop recording
  stopRecording(): void {
    if (this.mediaRecorder) {
      this.isRecording = false;
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  // Method to clear the audio recording
  clearAudioRecording(): void {
    this.audioUrl = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  // Utility method to clear input fields after sending a message
  private clearInputs(): void {
    this.message = '';
    this.selectedFile = null;
    this.scrollToBottom(); // Scroll to the latest message
  }

  isImageFile(fileUrl: string): boolean {
    return /\.(jpg|png|avif)$/i.test(fileUrl); // ✅ Case-insensitive regex check
  }

  sanitizeMessage(text: string | undefined | null): any {
    if (!text) {
      return ''; // Return an empty string if text is null or undefined
    }

    const linkifiedText = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(linkifiedText);
  }

  participantprofilr(userId: string) {
    const diaref = this.Dialog.open(ParticipantprofileComponent, {
      width: '100%',
      maxWidth: '600px',
      height: '100%',
      position: { right: '0' },
      data: { userId: userId },
      panelClass: 'custom-dialog-container',
    });

    diaref.afterClosed().subscribe((result) => {
      console.log('result', result);
    });
  }


  blockUser(userId: string) {
    if (!userId) return;

    this.authser.blockUser(userId).subscribe(
      (response) => {
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
        this.fetchBlockedUsers(); // Refresh the blocked users list
      },
      (error) => {
        console.error('Error blocking user:', error);
        this.snackBar.open(
          error?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      }
    );
  }

  // Unblock a user
  unblockUser(userId: string) {
    if (!userId) return;

    this.authser.unblockUser(userId).subscribe(
      (response) => {
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
        this.fetchBlockedUsers(); // Refresh the blocked users list
      },
      (error) => {
        console.error('Error unblocking user:', error);
        this.snackBar.open(
          error?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      }
    );
  }

  // Fetch blocked users
  fetchBlockedUsers() {
    this.authser.getBlockedUsers().subscribe(
      (response) => {
        this.blockedUsers = response.blockedUsers.map(
          (user: { _id: any }) => user._id
        );
        console.log('get blocked users', this.blockedUsers);
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
      }
    );
  }

  // Check if a user is blocked
  isBlocked(userId: string): boolean {
    return this.blockedUsers.includes(userId);
  }

  openVideo() {
    this.dialog.open(AudiocallcomponentComponent, {
      width: '80vw', // Set the width of the dialog
      height: '80vh', // Set the height of the dialog
      disableClose: false, // Allow closing the dialog
      data: { callType: 'video' }, // Pass any data if needed
    });
  }


  // openVideos() {
  //   this.dialog.open(VideocallComponent, {
  //     width: '80vw',
  //     height: '80vh',
  //     hasBackdrop: true,
  //     disableClose: true, // prevents closing on outside click
  //     backdropClass: 'custom-backdrop', // optional styling
  //     panelClass: 'custom-dialog-panel', // optional styling
  //   });
  // }

  openVideos() {
    window.open('/videocall', '_blank');
  }





refreshData() {
  // Example: refresh data, trigger socket, reload UI, etc.
  this.cdr.detectChanges();
}




}
