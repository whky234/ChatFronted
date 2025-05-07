import { GroupsocketService } from './../services/groupsocket.service';
import { Dialog } from '@angular/cdk/dialog';
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  HostListener,
  NgZone,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { CreateGroupComponent } from '../create-group/create-group.component';
import { GroupserService } from '../services/groupser.service';
import { io, Socket } from 'socket.io-client';
import { MatDialog } from '@angular/material/dialog';
import { AddmembersComponent } from '../addmembers/addmembers.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.css'],
})
export class UserlistComponent implements OnInit {
  [x: string]: any;

  loggedInUsers: any[] = []; // All users fetched from the server
  filteredUsers: any[] = []; // Filtered users based on search input
  filteredGroups: any[] = [];
  groups: any[] = []; // List of groups the user belongs to
  @Output() userSelected = new EventEmitter<any>();
  @Output() groupSelected = new EventEmitter<any>(); // Emit event when group is selected
  selectedUserProfile: any = null;
  showParticipants = true; // Initial visibility of the list
  isMobileView: boolean = window.innerWidth <= 768; // Detect mobile view
  isSearching: boolean = false; // Search input visibility toggle
  searchQuery: string = ''; // Holds the search input

  currentuser: any;
  chatUsers: any[] = []; // Chat user list
  newName: string = ''; // Input for adding a new user
  newEmail: string = ''; // Input for adding a new user
  socket!: Socket;
  token: any;

  availableUsers: any[] = []; // Available users to select from
  groupName: string = ''; // Group name
  participants: string[] = []; // Array to store selected participants (user IDs)
  groupDescription: string = ''; // Group description
  groupImage: string | ArrayBuffer | null = null; // Group image (as base64 or URL)
  onlineUsers = new Map<string, boolean>(); // Track user online/offline status

  showGroups = false;

  constructor(
    private userService: AuthService,
    private proser: ProfileService,
    private dialog: Dialog,
    private groupser: GroupserService,
    private ngZone: NgZone, // Inject NgZone,
    private groupService: GroupserService,
    private socketServces: GroupsocketService,
    private authser: AuthService,
    private cdr: ChangeDetectorRef,
    private Dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeSocketConnection();
    this.loadChatUsers();
    this.loadUserGroups();
    console.log('Groups:', this.groups); // Debugging the groups list

    this.groupService.showGroups$.subscribe((show) => {
      this.showGroups = show;
    });

    // Handle user going offline when the tab/browser closes

    this.getcurrent();


    this.fetchchat();

    this.socketServces.listen('group:member:left').subscribe((update: any) => {
      console.log('📡 Group list received group:member:left event:', update);

      const groupIndex = this.groups.findIndex(
        (group) => group._id === update.groupId
      );
      if (groupIndex !== -1) {
        // ✅ Remove the member from the group list
        this.groups[groupIndex].members = this.groups[
          groupIndex
        ].members.filter(
          (member: { _id: string }) => member._id !== update.userId
        );

        // ✅ If admin was reassigned, update it
        if (update.admin) {
          this.groups[groupIndex].admin = update.admin;
        }

        this.cdr.detectChanges(); // 🔄 Update UI dynamically
      }
    });

    this.socketServces
      .listen('group:deleted')
      .subscribe((deletedGroup: any) => {
        console.log(
          '📡 Group list received group:deleted event:',
          deletedGroup
        );

        this.groups = this.groups.filter(
          (group) => group._id !== deletedGroup.groupId
        );
        this.cdr.detectChanges();
      });

       // Subscribe to profile updates
    this.proser.profile$.subscribe((updatedProfile) => {
      if (updatedProfile) {
        const userIndex = this.chatUsers.findIndex(
          (user) => user.userId._id === updatedProfile._id
        );
        if (userIndex !== -1) {
          this.chatUsers[userIndex].profileImage =
            updatedProfile.profileImage || 'assets/images/placeholder-profile.png';
        }
      }
    });

  }

  ngOnChanges(changes: SimpleChanges): void {
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.
  }

  filterChatUsers(): void {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.filteredUsers = []; // Show nothing when no search is active
      return;
    }

    this.filteredUsers = this.chatUsers.filter((user) =>
      user.userId?.name?.toLowerCase().includes(query)
    );
    this.filteredGroups = this.groups.filter((group) =>
      group.name.toLowerCase().includes(query)
    );
  }

  getcurrent() {
    this.userService.getCurrentUser().subscribe((user) => {
      if (user && user._id) {
        this.currentuser = user._id;
        console.log('✅ Current User:', this.currentuser);
        localStorage.setItem('currentUser', this.currentuser); // Store user ID

        // this.socket.emit('user:online', this.currentuser); // Notify backend
      } else {
        console.error('❌ User data is invalid:', user);
      }
    });
  }
  /**
   * Initialize WebSocket connection
   */
  initializeSocketConnection(): void {
    this.socket = io('http://localhost:3000'); // Update with your backend URL

    // Listen for new group creation
    this.socket.on('group:created', (group) => {
      console.log('New group created:', group);
      this.groups.push(group);
      this.loadUserGroups(); // Refresh groups list
    });

    // Retrieve stored user ID from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentuser = storedUser;
      console.log(
        '🔄 Re-emitting user online (from storage):',
        this.currentuser
      );
      this.socket.emit('user:onlines', this.currentuser);
    }

    // Fetch online users when reconnected
    this.socket.on('connect', () => {
      if (this.currentuser) {
        console.log('✅ Reconnected, setting user online:', this.currentuser);
        this.socket.emit('user:onlines', this.currentuser);
        this.socket.emit('fetch:onlineUsers'); // Request latest online users
      }
    });

    // Update online users list
    this.socket.on(
      'user:statuss',
      (data: { userId: string; isOnline: boolean }) => {
        if (data.userId) {
          this.onlineUsers.set(data.userId, data.isOnline);
          this.cdr.detectChanges();
        }
      }
    );

    // Get online users after refresh
    this.socket.on('onlineUsers:list', (users: string[]) => {
      this.onlineUsers.clear();
      users.forEach((userId) => this.onlineUsers.set(userId, true));
      this.cdr.detectChanges();
    });

    // Handle tab/browser close
    window.addEventListener('beforeunload', () => {
      if (this.currentuser) {
        console.log('❌ User going offline:', this.currentuser);
        this.socket.emit('user:offlines', this.currentuser);
      }
    });
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.get(userId) || false;
  }
  /**
   * Load chat users
   */
  loadChatUsers(): void {
    this.userService.fetchChatUsers().subscribe(
      (response) => {
        this.chatUsers = response.chatUsers.map((user: any) => ({
          ...user,
          profileImage: 'assets/images/placeholder-profile.png', // Default profile image
        }));

        // Fetch profile images for each user
        this.chatUsers.forEach((user, index) => {
          this.proser.getParticipantProfile(user.userId._id).subscribe(
            (profile) => {
              this.chatUsers[index].profileImage =
                profile?.profileImage || 'assets/images/placeholder-profile.png';
            },
            (error) => {
              console.error(
                `Error fetching profile for user ${user.userId._id}:`,
                error
              );
            }
          );
        });

        console.log(this.chatUsers);
      },
      (error) => {
        console.error('Error fetching chat users:', error);
      }
    );
  }

  fetchchat(): void {
    this.userService.fetchChatUsers().subscribe((res) => {
      this.availableUsers = res.chatUsers;
      console.log('load chat', this.availableUsers);
    });
  }

  gettoken() {
    this.token = this.userService.getToken();
  }

  /**
   * Load groups for the current user
   */
  loadUserGroups(): void {
    this.groupser.fetchgroupusers().subscribe(
      (response) => {
        this.groups = response.groups;
        console.log('Fetched groups:', this.groups);

        setTimeout(() => {
          this.groups.forEach((group) => {
            this.socket.emit('group:list:fetch', group._id); // Request group details
          });
        }, 500); // Small delay to ensure updates
      },
      (error) => {
        console.error('Error fetching user groups:', error);
      }
    );
  }

  /**
   * Join a group
   */
  joinGroup(groupId: string): void {
    if (!this.socket) return;

    this.socketServces.joinGroupRoom(groupId, this.currentuser);
    console.log(`Request sent to join group ${groupId}`);

    this.socket.on('group:member:status', (data) => {
      console.log(
        `User ${this.currentuser} is now ${data.status} in group ${groupId}`
      );
    });
  }

  /**
   * Add a new user to the chat list
   */
  addUserToChat(): void {
    if ( !this.newEmail) {
      this.snackBar.open('email are required!', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.userService.addChatUser(this.newName, this.newEmail).subscribe(
      (response) => {
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
        });
        this.loadChatUsers(); // Refresh the chat list
      },
      (error) => {
        console.error('Error adding user to chat list:', error);
        this.snackBar.open(
          error?.error?.message || 'Failed to add user.',
          'Close',
          {
            duration: 3000,
          }
        );
      }
    );
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView) {
      this.showParticipants = true;
    }
  }

  selectUser(user: any): void {
    this.userSelected.emit(user);
    if (this.isMobileView) {
      this.showParticipants = false;
    }
  }

  /**
   * Select a group and join it
   */
  selectGroup(group: any): void {
    this.groupSelected.emit(group);

    // Join the selected group via WebSocket
    this.joinGroup(group._id);

    if (this.isMobileView) {
      this.showParticipants = false;
    }

    this.loadUserGroups()
  }

  toggleParticipants(): void {
    this.showParticipants = !this.showParticipants;
  }

  onSearch(): void {
    this.isSearching = !this.isSearching; // Toggle search input visibility
    if (!this.isSearching) {
      this.searchQuery = '';
      this.filteredUsers = this.loggedInUsers; // Reset the list
    }
  }

  opengroup(): void {
    this.dialog.open(CreateGroupComponent, {
      width: '400px', // Adjust size as needed
      disableClose: false,
    });
  }

  // Handle image selection and convert to base64
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.groupImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  createGroup() {
    if (!this.groupName || this.participants.length === 0) {
      this.snackBar.open('Please provide a group name and add participants.', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    const groupData = {
      name: this.groupName,
      description: this.groupDescription,
      image: this.groupImage,
      members: this.participants,
      admin: this.currentuser,
    };

    console.log('Creating group with data:', groupData);

    this.groupService.createGroup(groupData).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.resetForm();
        this.loadUserGroups();

        console.log('📡 Attempting to emit group:create...', groupData);
        this.socket.emit('group:create', groupData);
        console.log('✅ Event emitted!');
      },
      error: (err) => {
        console.error('Error creating group:', err);
        this.snackBar.open(err.error?.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
    });
  }


  // Reset form fields
  resetForm() {
    this.groupName = '';
    this.groupDescription = '';
    this.groupImage = null;
    this.participants = [];
  }

  leaveGroup(groupId: string) {
    this.groupService.LeaveGroup(groupId).subscribe(
      (res) => {
        console.log('✅ Left group:', res);

        // Emit real-time update to notify other members
        this.socketServces.emit('group:leave', {
          groupId,
          userId: this.currentuser, // Ensure you get the logged-in user ID
        });

        // Update UI instantly
        this.groups = this.groups.filter((group) => group._id !== groupId);
      },
      (error) => {
        console.error('❌ Error leaving group:', error);
      }
    );
  }

  leaveGroupAndNotify(groupId: string, userId: string): void {
    this.groupser.LeaveGroup(groupId).subscribe(
      (res) => {
        console.log('✅ Left group:', res);

        // Emit real-time update to notify ViewgroupdetailComponent
        this.memberLeft(groupId, userId);
      },
      (error) => {
        console.error('❌ Error leaving group:', error);
      }
    );
  }

  openAddMembersDialog() {
    this.fetchchat();
    setTimeout(() => {
      console.log('Available users:', this.availableUsers);

      const dialogRef = this.Dialog.open(AddmembersComponent, {
        width: '400px',
        data: { groupId: this.groups, users: this.availableUsers },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.length > 0) {
          console.log('Members added:', result);

          this.groupService.addMembers(this.groups, result).subscribe({
            next: (res) => {
              console.log('Members successfully added:', res);

              // ✅ Emit socket event after successfully adding members
              this.socket.emit('group:addMembers', {
                groupId: this.groups,
                newMembers: result,
                adminId: this.currentuser._id,
              });
            },
            error: (err) => console.error('Error adding members:', err),
          });
        }
      });
    }, 500);
  }

  memberLeft(groupId: string, userId: string): void {
    this.socket.emit('group:member:left', { groupId, userId });
  }

  addMembersAndNotify(groupId: string, newMembers: any[]): void {
    this.groupser.addMembers(groupId, newMembers).subscribe(
      (res) => {
        console.log('✅ Members added successfully:', res);

        // Emit real-time update to notify ViewgroupdetailComponent
        this.socket.emit('group:member:added', {
          groupId,
          updatedMembers: res.updatedMembers, // Ensure this contains the updated list of members
        });

        // Update the UI instantly
        const groupIndex = this.groups.findIndex((group) => group._id === groupId);
        if (groupIndex !== -1) {
          this.groups[groupIndex].members = res.updatedMembers;
          this.cdr.detectChanges(); // Trigger UI update
        }
      },
      (error) => {
        console.error('❌ Error adding members:', error);
      }
    );
  }

  createGroupAndNotify(): void {
    if (!this.groupName || this.participants.length === 0) {
      this.snackBar.open('Please provide a group name and add participants.', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      return;
    }

    const groupData = {
      name: this.groupName,
      description: this.groupDescription,
      image: this.groupImage,
      members: this.participants,
      admin: this.currentuser,
    };

    console.log('Creating group with data:', groupData);

    this.groupser.createGroup(groupData).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
        this.resetForm();
        this.loadUserGroups();

        // Emit real-time update to notify other components
        this.socket.emit('group:created', {
          groupId: response.group._id,
          groupDetails: response.group,
        });

        console.log('✅ Group created and event emitted:', response.group);
      },
      error: (err) => {
        console.error('Error creating group:', err);
        this.snackBar.open(err.error?.message || 'Failed to create group.', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
    });
  }
}
