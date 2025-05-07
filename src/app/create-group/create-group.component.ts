import { Component, OnInit } from '@angular/core';
import { GroupserService } from '../services/groupser.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css'],
})
export class CreateGroupComponent implements OnInit {
  availableUsers: any[] = []; // Available users to select from
  groupName: string = ''; // Group name
  participants: string[] = []; // Array to store selected participants (user IDs)
  groupDescription: string = ''; // Group description
  groupImage: string | ArrayBuffer | null = null; // Group image (as base64 or URL)

  constructor(private groupService: GroupserService, private authService: AuthService) {}

  ngOnInit(): void {
    this.fetchUsers(); // Fetch available users when the component loads
  }

  // Fetch users that can be added to the group
  fetchUsers() {
    this.authService.fetchChatUsers().subscribe({
      next: (response) => {
        console.log('Chat Users Response:', response);
        this.availableUsers = response.chatUsers.map((user: any) => ({
          name: user.name,
          userId: user.userId, // Ensure this is correct
        }));
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
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

  // Create group logic
  createGroup() {
    if (!this.groupName || this.participants.length === 0) {
      alert('Please provide a group name and add participants.');
      return;
    }

    const groupData = {
      name: this.groupName,
      description: this.groupDescription,
      image: this.groupImage, // Include group image
      members: this.participants,
    };

    console.log('Creating group with data:', groupData); // Debugging

    this.groupService.createGroup(groupData).subscribe({
      next: (response) => {
        alert('Group created successfully!');
        // Reset form after successful group creation
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating group:', err);
        alert('Error creating group. Please try again later.');
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
}
