import { Component, OnInit, Optional } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { Router } from '@angular/router';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.css']
})
export class ViewProfileComponent implements OnInit {
  ison: boolean = false;
  profile: any = null; // Set to null initially to check if profile exists

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private dialog: Dialog,
        @Optional() private dialogRef?: DialogRef<ViewProfileComponent> // Use DialogRef

  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe(
      (profile) => {
        this.profile = profile && Object.keys(profile).length ? profile : null; // Check if profile has data
      },
      (error) => {
        console.error('Error loading profile:', error);
        this.profile = null; // Ensure it's null in case of an error
      }
    );
  }

  openedit(): void {
    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '800px',
      data: this.profile, // Pass current profile data
      disableClose: false,
    });

    // Reload user profile after closing the dialog
    dialogRef.closed.subscribe(() => {
      this.loadUserProfile();
    });
  }

  CloseDialog(){
    this.dialogRef?.close()
  }
}
