import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotifyService } from '../services/notify.service';
import { io, Socket } from 'socket.io-client';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrl: './notification-dialog.component.css'
})
export class NotificationDialogComponent {

  notifications: any[] = [];
  groupNotifications: any[] = [];

  personalCount: number = 0; // Counter for personal notifications
  groupCount: number = 0; // Counter for group notifications
  senderDetails: any[] = []; // Array to store sender details separately

  private socket!: Socket;
  selectedUser: any;

  constructor(
    private dialogRef: MatDialogRef<NotificationDialogComponent>,
    private router:Router,
    private notificationService: NotifyService,
    @Inject(MAT_DIALOG_DATA) public data: { notifications: any[] } = { notifications: [] }
  ) {
    this.socket = io('http://localhost:3000'); // Direct socket.io-client connection
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.loadGroupNotifications();

    // Listen for personal notifications
    this.socket.on('notification:new', (notification: any) => {
      this.notifications.unshift(notification);
      this.personalCount++; // Increase personal notification count
    });

    // Listen for group notifications
    this.socket.on('new_notification', (notification: any) => {
      this.groupNotifications.unshift(notification);
      this.groupCount++; // Increase group notification count
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe(
      (data) => {
        this.notifications = data;
        this.personalCount = data.length; // Set initial count based on fetched notifications

        // Extract sender details into a separate array
        this.senderDetails = data.map(notification => notification.senderId)
          .filter(sender => sender !== null); // Ensure sender is not null

        console.log('Sender Details:', this.senderDetails);
      },
      (error) => console.error('Error fetching notifications', error)
    );
  }

  loadGroupNotifications(): void {
    this.notificationService.getGroupNoify().subscribe(
      (data) => {
        this.groupNotifications = data;
        this.groupCount = data.length; // Set initial count based on fetched notifications
      },
      (error) => console.error('Error fetching group notifications', error)
    );
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(
      () => {
        this.notifications.forEach(notification => notification.isRead = true);
        this.groupNotifications.forEach(notification => notification.isRead = true);
        this.personalCount = 0;
        this.groupCount = 0;

        this.loadNotifications();
        this.loadGroupNotifications();
      },
      (error) => console.error('Error marking notifications as read', error)
    );
  }

  // Reset notification count when tab is clicked
  resetPersonalCount(): void {
    this.personalCount = 0;
  }

  resetGroupCount(): void {
    this.groupCount = 0;
  }

  closeDialog() {
    this.dialogRef.close();
  }


}
