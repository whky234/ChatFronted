import { Component, Inject } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';
import { SnackbarService } from '../services/snackbar.service';

@Component({
  selector: 'app-participantprofile',
  templateUrl: './participantprofile.component.html',
  styleUrls: ['./participantprofile.component.css'],
  animations: [
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '300ms ease-in',
          style({ transform: 'translateX(0)', opacity: 1 })
        )
      ]),
      transition(':leave', [
        animate(
          '300ms ease-out',
          style({ transform: 'translateX(100%)', opacity: 0 })
        )
      ])
    ])
  ]
})
export class ParticipantprofileComponent {
  participantProfile: any; // Store the participant profile data
  isLoading: boolean = true; // Show loader until data is fetched
  errorMessage: string | null = null;

  constructor(
    private profileser: ProfileService,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    private dialogrref: MatDialogRef<ParticipantprofileComponent>,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadprofile(this.data.userId);

    // Subscribe to profile updates
    this.profileser.participantProfile$.subscribe((updatedProfile) => {
      if (updatedProfile && updatedProfile._id === this.data.userId) {
        this.participantProfile = updatedProfile;
      }
    });
  }

  loadprofile(userId: string) {
    this.profileser.getParticipantProfile(userId).subscribe({
      next: (profile) => {
        if (profile.isHidden) {
          this.errorMessage = 'This profile is hidden.';
          this.snackbarService.showError(this.errorMessage); // Show snackbar for hidden profile
          this.isLoading = false;
          return;
        }
        this.participantProfile = profile;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch profile:', err);
        this.errorMessage = err?.error?.message;
        this.snackbarService.showError(this.errorMessage || 'Failed to load profile.'); // Show snackbar for error
        this.isLoading = false;
      }
    });
  }

  CloseDialog(){
    this.dialogrref.close()
  }



}
