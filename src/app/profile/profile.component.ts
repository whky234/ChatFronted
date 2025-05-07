import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../services/profile.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  profileImagePreview: string | ArrayBuffer | null = null;
  profile: any = {};

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    @Optional() private dialogRef?: DialogRef<ProfileComponent>,
    @Optional() @Inject(DIALOG_DATA) public profileData?: any
  ) {
    this.profileForm = this.fb.group({
      bio: [''],
      description: [''],
      contactNumber: [''],
      websiteLinks: [''],
      profileImage: [null],
      isPrivate: [false],
      isHidden: [false],
    });
  }

  ngOnInit(): void {
    if (this.profileData) {
      this.profileForm.patchValue({
        bio: this.profileData.bio || '',
        description: this.profileData.description || '',
        contactNumber: this.profileData.contactNumber || '',
        websiteLinks: this.profileData.websiteLinks
          ? this.profileData.websiteLinks.join(', ')
          : '',
        isHidden: this.profileData.isHidden || false,
      });

      if (this.profileData.profileImage) {
        this.profileImagePreview = `http://localhost:3000/uploads/profile/${this.profileData.profileImage}`;
      }
    }
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe(
      (profile) => {
        this.profile = profile;
        this.profileForm.patchValue({
          bio: profile.bio || '',
          description: profile.description || '',
          contactNumber: profile.contactNumber || '',
          websiteLinks: profile.websiteLinks
            ? profile.websiteLinks.join(', ')
            : '',
          isHidden: profile.isHidden || false,
        });

        if (profile.profileImage) {
          this.profileImagePreview = `http://localhost:3000/uploads/profile/${profile.profileImage}`;
        }
      },
      (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Failed to load profile', 'Close', {
          duration: 3000,
        });
      }
    );
  }

  closeDialog(): void {
    this.profileForm.reset();
    this.profileImagePreview = null;
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files![0];
    if (file) {
      this.profileForm.patchValue({ profileImage: file });
      this.profileForm.get('profileImage')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.profileImagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    const formData = new FormData();
    Object.keys(this.profileForm.value).forEach((key) => {
      const value = this.profileForm.value[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (this.profile && this.profile.id) {
      this.profileService.updateProfile(formData).subscribe(
        (response) => {
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
          });

          this.profileForm.reset(); // ✅ Clear form
          this.profileImagePreview = null; // ✅ Clear image

          if (this.dialogRef) {
            this.dialogRef.close();
          }
        },
        (error) => {
          console.error('Error updating profile:', error);
          this.snackBar.open('Failed to update profile', 'Close', {
            duration: 3000,
          });
        }
      );
    } else {
      this.profileService.saveProfile(formData).subscribe(
        (response) => {
          this.snackBar.open('Profile created successfully!', 'Close', {
            duration: 3000,
          });

          this.profileForm.reset(); // ✅ Clear form
          this.profileImagePreview = null; // ✅ Clear image

          if (this.dialogRef) {
            this.dialogRef.close();
          }
        },
        (error) => {
          console.error('Error creating profile:', error);
          if (error.status === 400 && error.error.message === 'Profile already exists') {
            this.snackBar.open('Profile already exists. Updating instead...', 'Close', { duration: 3000 });

            this.profileService.updateProfile(formData).subscribe(
              (response) => {
                this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });

                this.profileForm.reset(); // ✅ Clear form
                this.profileImagePreview = null; // ✅ Clear image

                if (this.dialogRef) {
                  this.dialogRef.close();
                }
              },
              (updateError) => {
                console.error('Error updating after profile exists error:', updateError);
                this.snackBar.open('Failed to update profile.', 'Close', { duration: 3000 });
              }
            );
          } else {
            this.snackBar.open('Failed to create profile', 'Close', { duration: 3000 });
          }
        }
      );
    }
  }
}
