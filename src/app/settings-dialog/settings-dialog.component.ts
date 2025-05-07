import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { SnackbarService } from '../services/snackbar.service';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnInit {
  settings = {
    email: '',
    password: '',
  };

  activityLogs = {
    chats: ['You sent a message to John', 'Alice sent you a file', 'Group chat updated'],
    calls: ['Missed call from Alice', 'Outgoing call to Bob', 'Incoming call from Carol'],
    tasks: ['Task 1 completed', 'Task 2 pending', 'Task 3 updated'],
  };

  privacy = {
    blockUsers: false,
    hideProfileInfo: false,
  };

  blockedUsers: any[] = []; // Store blocked users

  constructor(
    private dialogRef: MatDialogRef<SettingsDialogComponent>,
    private blockUserService: AuthService,
    private profileService: ProfileService,
    private accountSettingsService: AuthService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.fetchBlockedUsers();
    this.fetchProfileVisibility();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  saveAccountSettings() {
    this.accountSettingsService.updateAccountSettings(this.settings.email, this.settings.password).subscribe(
      (response) => {
        console.log(response)
        alert('Account updated successfully');
      },
      (error) => {
        console.error('Error updating account:', error);
        alert('Failed to update account');
      }
    );
  }

  savePrivacySettings() {
    console.log('Privacy settings saved:', this.privacy);
  }

  // Fetch blocked users
  fetchBlockedUsers() {
    this.blockUserService.getBlockedUsers().subscribe(
      (response) => {
        this.blockedUsers = response.blockedUsers || []; // Adjust based on your API response
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
      }
    );
  }

  // Unblock a user
  unblockUser(userId: string) {
    this.blockUserService.unblockUser(userId).subscribe(
      (response) => {
        alert('User unblocked successfully!');
        this.fetchBlockedUsers(); // Refresh the list after unblocking
      },
      (error) => {
        console.error('Error unblocking user:', error);
      }
    );
  }

   // Fetch profile visibility status
   fetchProfileVisibility() {
    this.profileService.getProfile().subscribe(
      (profile) => {
        this.privacy.hideProfileInfo = profile.isHidden;
      },
      (error) => {
        console.error('Error fetching profile visibility:', error);
      }
    );
  }

  toggleProfileVisibility() {
    // Temporarily toggle UI immediately for instant feedback
    this.privacy.hideProfileInfo = !this.privacy.hideProfileInfo;

    // Call backend to update actual status
    this.profileService.toggleProfileVisibility().subscribe(
      (response) => {
        this.snackbarService.showSuccess(response.message); // Use snackbar for success message
      },
      (error) => {
        // Revert back on error
        this.privacy.hideProfileInfo = !this.privacy.hideProfileInfo;
        this.snackbarService.showError('Error toggling profile visibility.'); // Use snackbar for error message
        console.error('Error toggling profile visibility:', error);
      }
    );
  }

  // Manual Toggle Using Button
  toggleProfileManually() {
    this.privacy.hideProfileInfo = !this.privacy.hideProfileInfo;
    this.toggleProfileVisibility(); // Call the existing function
  }
}
