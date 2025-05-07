import { GroupsocketService } from './../services/groupsocket.service';
import { Router } from '@angular/router';
import { GroupserService } from './../services/groupser.service';
import { AuthService } from './../services/auth.service';
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskService } from '../services/task.service';
import { AddmembersComponent } from '../addmembers/addmembers.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ViewgroupdetailComponent } from '../viewgroupdetail/viewgroupdetail.component';
import { SocketService } from '../services/socket.service';
import { BehaviorSubject, take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-groupchatwindow',
  templateUrl: './groupchatwindow.component.html',
  styleUrls: ['./groupchatwindow.component.css'],
})
export class GroupchatwindowComponent implements OnInit, OnDestroy {
  @Input() group: any; // Group data passed from parent
  @Input() currentUser: any; // Current user details
  messages: any[] = []; // Group messages
  messageText: string = ''; // Text input for the message
  groupMembers: any[] = []; // Group members
  typingIndicator: boolean = false; // Typing indicator state
  isSending: boolean = false; // Loading state for sending messages
  private messagePollingInterval: any; // Interval for polling new messages
  availableUsers: any[] = []; // Available users to select from
  @Input() message: any;
  rawFileUrl!: string; // For download

  isRecording: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  audioUrl: string | null = null;

  editingMessage: any = null;
  editedText: string = '';
  selectedGroupId: string | null = null;
  messagesSubject = new BehaviorSubject<any[]>([]); // ✅ Use BehaviorSubject for live updates

  @ViewChild('chatContainer') chatContainer!: ElementRef; // For detecting scroll events
  isTyping = false;
  typingTimeout: any;
  typingUsers: string[] = [];

  isSearching: boolean = false;
  searchQuery: string = '';
  filteredMessages: any[] = []; // This stores the filtered messages
  @ViewChild('chatWindow') chatWindow!: ElementRef;
  showScrollButton = false;
  emojis: any[] = [];
  limitedEmojis: any[] = [];
  isprogress: boolean = false;
  selectemoji: boolean = false;



  safeFileUrl!: SafeResourceUrl;
  constructor(
    private groupserService: GroupserService,
    private Dialog: MatDialog,
    private taskser: TaskService,
    private sanitizer: DomSanitizer,
    private authser: AuthService,
    private cdr: ChangeDetectorRef,
    private socketService: GroupsocketService, // <-- Inject WebSocket Service
    private socketser: SocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeChat();
    this.fetchUsers();
    console.log('name', this.currentUser._id);

    if (this.group && this.currentUser) {
      this.socketService.joinGroup(this.group._id, this.currentUser._id);
    }

    this.socketService.on('connect', () => {
      console.log('✅ Frontend: Connected to socket server');
    });

    this.socketService.on('disconnect', () => {
      console.log('❌ Frontend: Disconnected from socket server');
    });

    console.log('🔄 Frontend: Listening for real-time message updates...');

    // Listen for message deletion
    this.socketService.on('group:message:deleted', ({ messageId }) => {
      console.log('📢 Real-time: Message deleted:', messageId);
      this.messages = this.messages.filter((msg) => msg._id !== messageId);
    });

    // Listen for message edits
    this.socketService.on('group:message:updated', ({ messageId, newText }) => {
      console.log(
        '📢 Real-time: Message edited:',
        messageId,
        'New text:',
        newText
      );
      const index = this.messages.findIndex((m) => m._id === messageId);
      if (index !== -1) {
        this.messages[index].text = newText;
        this.messages[index].edited = true;
      }
    });

    this.socketService.on('group:typing', (data) => {
      if (!this.typingUsers.includes(data.username)) {
        this.typingUsers.push(data.username);
      }
    });

    this.socketService.on('group:stopTyping', (data) => {
      console.log('Stop typing received for:', data.username);

      this.typingUsers = this.typingUsers.filter(
        (user) => user !== data.username
      );
    });
  }

  ngOnDestroy(): void {
    if (this.group && this.currentUser) {
      this.socketService.leaveGroup(this.group._id, this.currentUser.id);
    }
    clearInterval(this.messagePollingInterval); // ✅ Stop polling when component is destroyed
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    this.chatWindow.nativeElement.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.chatWindow.nativeElement;
      this.showScrollButton = scrollHeight - scrollTop - clientHeight > 100;
    });
  }

  /**
   * Detects when the group input changes and reloads messages.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group'] && changes['group'].currentValue) {
      console.log('Group changed:', this.group);

      this.clearOldMessages(); // ✅ Clear old messages
      // this.loadMessages();
      this.startMessagePolling();

      if (this.message?.fileUrl?.endsWith('.pdf')) {
        this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.message.fileUrl
        );
        this.rawFileUrl = this.message.fileUrl; // Keep original URL for download
      }
    }
  }

  filterMessages(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredMessages = [...this.messages]; // Show all messages if search is empty
    } else {
      this.filteredMessages = this.messages.filter(
        (message) => message.text && message.text.toLowerCase().includes(query)
      );
    }
  }

  toggleSearch(): void {
    this.isSearching = !this.isSearching;
    this.searchQuery = ''; // Clear search when closing
    if (!this.isSearching) {
      this.filteredMessages = this.messages; // Reset messages when search closes
    }
  }

  removeMessageFromUI(messageId: string) {
    this.messages = this.messages.filter((msg) => msg._id !== messageId);
  }

  private initializeChat(): void {
    console.log('Group data:', this.group);
    console.log('Current user:', this.currentUser);

    this.loadMessages();
    this.groupMembers = this.group.members; // Assuming group members are preloaded in the group data
  }
  /**
   * Clear previous messages before switching to a new group.
   */
  private clearOldMessages(): void {
    this.messages = [];
    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval); // ✅ Stop old polling instance
    }
  }

  /**
   * Fetch group messages from the service.
   */
  loadMessages(): void {
    if (!this.group || !this.group._id) {
      console.warn('No group selected.');
      return;
    }

    this.messages = []; // ✅ Clear messages before fetching new ones
    this.groupserService.getGroupMessages(this.group._id).subscribe({
      next: (messages) => {
        const BASE_URL = 'http://localhost:3000'; // Ensure trailing slash

        this.messages = messages.map((message: any) => ({
          ...message,
          type:
            message.sender._id === this.currentUser._id ? 'sent' : 'received',
          receiverNames: message.receivers.map((r: any) => r.name).join(', '),

          // ✅ Construct file URLs correctly
          fileUrl: message.fileUrl ? `${BASE_URL}${message.fileUrl}` : null,
          audioUrl: message.audioUrl ? `${BASE_URL}${message.audioUrl}` : null,
          seenBy: message.seenBy || [], // ✅ Include seenBy array
        }));
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },    });
  }

  /**
   * Poll for new messages from the current group only.
   */
  startMessagePolling(): void {
    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval); // ✅ Stop polling when switching groups
    }

    this.messagePollingInterval = setInterval(() => {
      if (!this.group || !this.group._id) return;

      this.groupserService.getGroupMessages(this.group._id).subscribe({
        next: (newMessages) => {
          const BASE_URL = 'http://localhost:3000';

          const lastMessageTime = this.messages.length
            ? new Date(this.messages[this.messages.length - 1].time).getTime()
            : 0;

          const filteredMessages = newMessages
            .filter(
              (msg: any) => new Date(msg.time).getTime() > lastMessageTime
            )
            .map((msg: any) => ({
              ...msg,
              type:
                msg.sender._id === this.currentUser._id ? 'sent' : 'received',
              fileUrl: msg.fileUrl ? `${BASE_URL}${msg.fileUrl}` : null,
              audioUrl: msg.audioUrl ? `${BASE_URL}${msg.audioUrl}` : null,
              seenBy: msg.seenBy || [], // ✅ Ensure seenBy updates
            }));

          if (filteredMessages.length > 0) {
            this.messages.push(...filteredMessages);
          }
        },
        error: (err) => {
          console.error('Failed to get message:', err);
          this.snackBar.open(
            err?.error?.message || 'Failed to block user.',
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            }
          );
        },      });
    }, 1000); // ✅ Polling every 5 seconds
  }

  listenForMessages(): void {
    this.socketService.onNewMessage().subscribe((message: any) => {
      console.log('New WebSocket message:', message);
      this.messages.push({
        sender: message.sender,
        text: message.message,
        type: message.sender._id === this.currentUser._id ? 'sent' : 'received',
        time: new Date().toISOString(),
      });
    });
  }

  /**
   * Send a message to the group.
   */
  sendMessage(): void {
    if (!this.messageText.trim()) {
      return; // Prevent sending empty messages
    }

    this.isSending = true; // Lock UI while sending

    const messageData = {
      groupId: this.group._id,
      senderId: this.currentUser._id,
      text: this.messageText,
      time: new Date().toISOString(),
    };

    this.groupserService.sendMessageToGroup(messageData).subscribe({
      next: (response) => {
        console.log('✅ Message sent:', response);

        if (response?.message) {
          const message = response.message;
          message.type =
            message.sender._id === this.currentUser._id ? 'sent' : 'received';

          this.messages.push(message);

          // ✅ Emit message via socket for real-time delivery
          // this.socketser.emit('group:message:send', {
          //   groupId: message.group,             // or message.groupId
          //   userId: this.currentUser._id,
          //   message: message.text
          // });
        }

        this.messageText = ''; // ✅ Clear input field
      },
      error: (err) => {
        console.error('❌ Failed to send message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to send message.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },
      complete: () => (this.isSending = false), // ✅ Unlock UI
    });
  }


scrollToBottom(): void {
  try {
    this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
  } catch (err) {
    console.error('Scroll error:', err);
  }}

  /**
   * Handle file upload and send as a message.
   */
  handleFileUpload(event: any): void {
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupId', this.group._id);
    formData.append('senderId', this.currentUser._id);

    // Check if the file type is valid before sending
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/avif',
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/zip', // ZIP file
      'application/x-zip-compressed', // Alternative ZIP MIME type
      'multipart/x-zip', // Alternative ZIP MIME type
      'application/x-compressed', // Alternative ZIP MIME type    'audio/mpeg', // .mp3
      'audio/wav',
      'audio/ogg',
      'video/mp4',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.showErrorSnackbar('Invalid file type. Please select a valid file.');
      return;
    }

    this.groupserService.sendMessageToGroup(formData).subscribe({
      next: (response) => {
        console.log('File sent:', response);

        if (response?.message) {
          const BASE_URL = 'http://localhost:3000';

          const fileMessage = response.message;
          fileMessage.type =
            fileMessage.sender._id === this.currentUser._id
              ? 'sent'
              : 'received';

          // ✅ Attach file URL if it's a valid file message
          if (fileMessage.fileUrl) {
            fileMessage.fileUrl = `${BASE_URL}${fileMessage.fileUrl}`;
          }
          if (fileMessage.audioName) {
            fileMessage.audioUrl = `${BASE_URL}${fileMessage.fileUrl}`;
          }

          this.messages.push(fileMessage);
        }
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },
    });
  }

  // ✅ Show error messages in a Snackbar
  private showErrorSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
  }

  isZipFile(fileUrl: string | null | undefined): boolean {
    return fileUrl ? fileUrl.toLowerCase().endsWith('.zip') : false;
  }

  deleteMessageForMe(messageId: string): void {
    this.groupserService.DeletForEM(messageId).subscribe({
      next: (res) => {
        this.messages = this.messages.filter((msg) => msg._id !== messageId); // Remove message from UI
        console.log(res);
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },    });
  }

  deleteMessageForEveryone(messageId: string): void {
    this.groupserService.deleteMessageForEveryone(messageId).subscribe({
      next: () => {
        // Emit delete event to backend
        this.socketService.emit('group:message:delete', {
          messageId,
          userId: this.currentUser._id,
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
            verticalPosition: 'top'
          }
        );
      },
    });
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

    this.groupserService.EditMessage(messageId, this.editedText).subscribe({
      next: (updatedMessage) => {
        // Emit edit event to backend socket server
        this.socketService.emit('group:message:edit', {
          messageId,
          userId: this.currentUser._id,
          newText: this.editedText,
        });
        // ✅ Update the local messages array

        const index = this.messages.findIndex((m) => m._id === messageId);
        if (index !== -1) {
          this.messages[index].text = this.editedText;
        }

        this.cancelEdit(); // Reset edit state
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        this.snackBar.open(
          err?.error?.message || 'Failed to block user.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },
    });
  }


  getEmoji() {
    this.isprogress = true;

    const emojiList = [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
      '😋', '😎', '😍', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩',
      '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
      '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤',
      '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹', '😖', '😞',
      '😟', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥺'
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

  onTyping() {
    if (!this.isTyping) {
      this.isTyping = true;

      this.authser
        .getCurrentUser()
        .pipe(take(1))
        .subscribe((user) => {
          if (!user || !user.name) {
            console.error('Error: currentUser is undefined or missing name.');
            return;
          }

          this.currentUser = user;
          this.socketService.emit('group:typing', {
            groupId: this.group._id,
            userId: user._id,
            username: user.name,
          });

          console.log('Typing event emitted:', user.name);
        });
    }

    // Reset timeout each time user types
    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      if (this.isTyping) {
        this.isTyping = false;

        this.authser
          .getCurrentUser()
          .pipe(take(1))
          .subscribe((user) => {
            if (!user) {
              console.error(
                'Error: currentUser is undefined when stopping typing.'
              );
              return;
            }

            this.socketService.emit('group:stopTyping', {
              groupId: this.group._id,
              userId: user._id,
              username: user.name,
            });

            console.log('Stop typing event emitted:', user.name);
          });
      }
    }, 2000); // Stops typing after 2 seconds of inactivity
  }

  openCreateTask(): void {
    const dialogRef = this.Dialog.open(TaskFormComponent, {
      width: '600px',
      data: {
        groupId: this.group._id, // Pass group ID
        currentUserId: this.currentUser._id, // Pass current user ID for assigning tasks
        groupMembers: this.groupMembers, // Pass group members
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Creating task with data:', result);
        if (result.taskId) {
          // Update existing task
          this.taskser.updateTask(this.group._id, this.currentUser._id, result).subscribe({
            next: (response) => {
              console.log('Task updated successfully:', response);
              this.snackBar.open(
                'Task updated successfully!',
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'right',
                  verticalPosition: 'top',
                }
              );
            },
            error: (err) => {
              console.error('Failed to update task:', err);
              this.snackBar.open(
                err?.error?.message || 'Failed to update task.',
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'right',
                  verticalPosition: 'top',
                }
              );
            },
          });
        } else {
          // Create new task
          this.taskser.createTask(this.group._id, result).subscribe({
            next: (response) => {
              console.log('Task created successfully:', response);
              this.snackBar.open(
                response.message || 'Task created successfully!',
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'right',
                  verticalPosition: 'top',
                }
              );
            },
            error: (err) => {
              console.error('Failed to create task:', err);
              this.snackBar.open(
                err?.error?.message || 'Failed to create task.',
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
      }
    });
  }

  fetchUsers() {
    this.authser.fetchChatUsers().subscribe({
      next: (response) => {
        console.log('Chat Users Response:', response);
        this.availableUsers = response.chatUsers.map((user: any) => ({
          userId: user.userId, // Ensure this is correct
          name: user.name,
        }));
        console.log('fetch chat user', this.availableUsers);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });
  }

  openTaskList() {
    if (!this.group || !this.group._id) {
      console.warn('No group selected.');
      return;
    }

    // Open the Kanban board in a new tab
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/kanban', this.group._id])
    );
    window.open(url, '_blank');
  }

  leaveGroup(groupId: string) {
    this.groupserService.LeaveGroup(groupId).subscribe(
      (res) => {
        console.log('✅ Left group:', res);

        // Emit real-time update to notify other members
        this.socketService.emit('group:member:left', {
          groupId,
          userId: this.currentUser._id, // Ensure you get the logged-in user ID
        });
      },
      (error) => {
        console.error('❌ Error leaving group:', error);
      }
    );
  }

  openAddMembersDialog() {
    this.fetchUsers();
    setTimeout(() => {
      console.log('Available users:', this.availableUsers);

      const dialogRef = this.Dialog.open(AddmembersComponent, {
        width: '400px',
        data: { groupId: this.group._id, users: this.availableUsers },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.length > 0) {
          console.log('Members added:', result);

          this.groupserService.addMembers(this.group._id, result).subscribe({
            next: (res) => {
              console.log('Members successfully added:', res);

              // ✅ Emit socket event after successfully adding members
              this.socketService.emit('group:addMembers', {
                groupId: this.group._id,
                newMembers: result,
                adminId: this.currentUser._id,
              });
            },
            error: (err) => console.error('Error adding members:', err),
          });
        }
      });
    }, 500);
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

  sendAudioMessage(): void {
    if (this.audioUrl && this.audioChunks.length > 0) {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
      const audioFile = new File([audioBlob], 'recording.wav', {
        type: 'audio/wav',
      });

      const formData = new FormData();
      formData.append('groupId', this.group._id); // Append group ID
      formData.append('senderId', this.currentUser.id); // Append sender ID
      formData.append('file', audioFile); // Append the audio file
      formData.append('text', 'Audio messages');

      this.groupserService.sendMessageToGroup(formData).subscribe({
        next: (response) => {
          console.log('Audio message sent:', response);

          if (response?.message) {
            const BASE_URL = 'http://localhost:3000';

            const audioMessage = response.message;
            audioMessage.type =
              audioMessage.sender._id === this.currentUser.id
                ? 'sent'
                : 'received';

            // Attach audio URL if it's a valid audio message
            if (audioMessage.audioUrl) {
              audioMessage.audioUrl = `${BASE_URL}${audioMessage.audioUrl}`;
            }

            this.messages.push(audioMessage); // Add the audio message to the messages array
          }

          this.clearAudioRecording(); // Clear the recording after sending
        },
        error: (err) => {
          console.error('Failed to send audio message:', err);
        },
      });
    }
  }

  // Method to clear the audio recording
  clearAudioRecording(): void {
    this.audioUrl = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.cdr.detectChanges(); // Trigger change detection
  }

  openViewGroupDetail(groupId: string) {
    // Check if group is defined
    if (!this.group || this.group.id !== groupId) {
      console.error('Group not found');
      return;
    }

    // Open the dialog with the correct group details
    const dialogRef = this.Dialog.open(ViewgroupdetailComponent, {
      width: '800px',
      data: {
        groupId: this.group._id,
        admin: this.group.admin?.name || 'Unknown',
        adminId: this.group.admin?._id,
        groupMembers: this.group.members || [],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Group Detail Dialog Closed', result);
    });
  }

  openVideos() {
    window.open('/Groupcall', '_blank');
  }
}
