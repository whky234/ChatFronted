import { Component, HostListener, Inject, Input } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SocketService } from './services/socket.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FireNotiService } from './fire-noti.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'chat_app';
  loggedInUsers: any[] = []; // All users fetched from the server
  userId:string=''
  selectedUser: any;


  // @Input() selectedUser: any;
    currentUser: any;

  constructor(private authser:AuthService,private SocketService: SocketService, private dialog: MatDialog,

  ){

  }

  ngOnInit(): void {




    this.authser.getCurrentUser().subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.SocketService.emit('joinRoom', this.currentUser._id);
        this.SocketService.emit("register_user", this.currentUser._id);
        // this.SocketService.emit('user:online', this.currentUser._id);


        console.log(`🔵 User joined socket room: ${this.currentUser._id}`);
        console.log(`🔵 emit: ${this.currentUser._id}`);

      }
    });







  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
  }






  fetchlogingusers(){
    this.authser.getloggedinUsers().subscribe((users) => {
      this.userId=users?._id
      console.log(this.userId)
      console.log('Fetched Logged-In Users:', users);


    });
  }



}
