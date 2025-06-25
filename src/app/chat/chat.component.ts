import { Dialog } from '@angular/cdk/dialog';
import { AuthService } from './../services/auth.service';
import { Route, Router } from '@angular/router';
import { Component, Inject } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { SocketService } from '../services/socket.service';
import { ProfileComponent } from '../profile/profile.component';
import { ViewProfileComponent } from '../view-profile/view-profile.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AichatBotComponent } from '../aichat-bot/aichat-bot.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { GroupserService } from '../services/groupser.service';
import { NotifyService } from '../services/notify.service';
import { ZoomService } from '../services/zoom.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  isopenprofile = false;
  isaddprofileadd = false;
  loggedInUsers: any[] = [];
  currentUser: any;
  showcurrentusers = false;
  getimage: any = {};  // Initialized to an empty object
  selectedParticipant=false;
  name:any
  selectedUser: any;
  activeContent: string = '';

  isnotifyopen:boolean=false

  showAiChatBot = false;

  mobileMenuOpen: boolean = false;



  selectedGroup: any;  // Property to store the selected group

isDarkmode:boolean=false

notifications: any[] = [];
personalCount: number = 0;
groupCount: number = 0;




  isSidebarOpen = false; // Default: Sidebar is closed



  constructor(private userService: AuthService, private profileser: ProfileService,private router:Router,private socketser:SocketService,private dialog:Dialog,
    private Dialog:MatDialog,private groupser:GroupserService,private notify:NotifyService,
    private zoomse:ZoomService,private socket:SocketService
  ) {
    localStorage.getItem('theme')==='dark'
    this.applytheme()
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.fetchLoggedInUsers();
    this.Getimage();
    this.loadNotificationCounts(); // Refresh counts after dialog closes


    if (this.currentUser?._id) {
      this.socketser.emit('joinRoom', this.currentUser._id);
      console.log('✅ Joined socket room for user:', this.currentUser._id);
    }

    this.listenForNotificationUpdates(); // optional if you want to react to incoming notifications
    this.loadpersonalNotification()



console.log(`${localStorage.getItem("currentUser")}`); // Clear storage)



  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }


  toggleTheme(){
    this.isDarkmode=!this.isDarkmode
    localStorage.setItem('theme',this.isDarkmode?'dark':'light');
    this.applytheme()
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen; // Toggle sidebar state
  }

  applytheme(){
    if(this.isDarkmode){
      document.body.classList.add('dark-mode')
    }
    else{
      document.body.classList.remove('dark-mode')

    }
  }



  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.

  }

  showingGroups = true;


  toggleGroups() {

    this.groupser.toggleGroups();
  }

  toggleGroupView(): void {
  this.showingGroups = !this.showingGroups;

  
 this.toggleGroups(); // Show groups
  this.toggleSidebar();
}
  showSingleParticipant(): void {
  // TODO: Replace this with logic to show a one-to-one chat or participant view
  console.log('Showing single participant view');
}

  openAiChatBot() {
    const config: MatDialogConfig = {
      width: '320px',
      height: '450px',
      position: { bottom: '0', right: '0' },
      panelClass: 'ai-chatbot-dialog'
    };

    this.dialog.open(AichatBotComponent, config);
  }





    // Handle the emitted selected group
    onGroupSelected(group: any): void {
      this.selectedGroup = group;  // Store the selected group data
      console.log('Selected Group:', this.selectedGroup);  // Log the selected group or perform actions as needed
      this.selectedUser = null;  // Reset selected group to hide group chat window

    }



  Getimage() {
     // Subscribe to profile updates
     this.profileser.profile$.subscribe((profile) => {
      if (profile) {
        this.getimage = profile;
        console.log('Profile updated:', profile);
      }
    });

    // Fetch the initial profile
    this.profileser.getProfile().subscribe();

  }

  addprofile() {
    this.isaddprofileadd = !this.isaddprofileadd;
    this.activeContent = 'profile'; // Show profile creation content

  }

  viewProfile() {
   this.router.navigate(['/chat/view'])
  }

  showpartipants() {
    this.showcurrentusers = !this.showcurrentusers;
    this.activeContent = 'exit'; // Show exit confirmation

  }

  loadCurrentUser() {
    this.userService.getCurrentUser().subscribe(
      (user) => {
        this.currentUser = user;
        console.log('aaas',this.currentUser)
      },
      (error) => console.error('Failed to load current user', error)
    );
  }



  fetchLoggedInUsers(): void {
    this.userService.getloggedinUsers().subscribe((users) => {
      this.loggedInUsers = users;
      console.log(users);
    });
  }

  onUserSelected(user: any): void {
    this.selectedUser = user;
    console.log(this.selectedUser)
    this.selectedGroup=null

  }


  logout() {
    if (this.currentUser) {
      console.log("🚪 Logging out:", this.currentUser._id);

      // Notify backend that user is offline
      this.socket.emit("user:offlines", this.currentUser._id);

      // Remove user data from local storage
      localStorage.removeItem("currentUser");

      // Reset current user
      this.currentUser = null;

      // Disconnect socket
      this.socket.disconnect();
    }

    // Call logout API
    this.userService.logout().subscribe({
      next: () => {
        console.log("Logout successful");

        // Redirect user to login page
        this.router.navigate(["/login"]).then(() => {
          window.location.reload(); // Ensure clean session
        });
      },
      error: (err) => {
        console.error("Logout failed:", err);
      },
    });
  }


  openprofileList() {
      this.dialog.open(ProfileComponent, {
        width: '800px', // Adjust size as needed
        disableClose: false,
      });
    }

    viewprofileList() {
      this.dialog.open(ViewProfileComponent, {
        width: '100%',
        maxWidth: '600px',
        height: '100%',        disableClose: false,
        panelClass: 'custom-dialog-container',

      });
    }

    listenForNotificationUpdates(): void {
      this.socketser.on('notification:group', (data) => {
        console.log('📢 Group notification received:', data);
        this.loadNotificationCounts(); // Refresh the group count
      });
    }

    loadpersonalNotification():void{
       // Listen for real-time personal notifications
  this.socketser.on('notification:new', (data) => {
    console.log('📢 Personal notification received:', data);
    this.loadNotificationCounts(); // Refresh the personal notification count
  });
    }


    loadNotificationCounts(): void {
      this.notify.getNotifications().subscribe(
        (data) => {
          this.notifications = data;
          this.personalCount = data.length; // Set count based on personal notifications
        },
        (error) => console.error('Error fetching notifications', error)
      );

      this.notify.getGroupNoify().subscribe(
        (data) => {
          this.groupCount = data.length; // Set count based on group notifications
        },
        (error) => console.error('Error fetching group notifications', error)
      );
    }

    openNotificationDialog(): void {
      const dialogRef: MatDialogRef<NotificationDialogComponent> = this.Dialog.open(NotificationDialogComponent, {
        data: { notifications: this.notifications },
        width: '500px',
      });

      dialogRef.afterClosed().subscribe(() => {
        this.loadNotificationCounts(); // Refresh counts after dialog closes
      });
    }



    openSettingsDialog() {
      this.Dialog.open(SettingsDialogComponent, {
        width: '500px',
      });
    }


    scheduleMeeting(){
      this.zoomse.createMeeting().subscribe(
        (response) => {
          console.log("Full API Response:", response); // Debugging

          if (response && response.join_url) {

            window.open(response.join_url, "_blank"); // Open Zoom meeting
          } else {
            console.error("Meeting URL is undefined or missing in response.");
          }
        },
        (error) => {
          console.error("Error creating meeting:", error);
        }
      );
    }

    openVideos() {
      window.open('/Groupcall', '_blank');
    }
}
