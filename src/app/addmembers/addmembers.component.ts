import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-addmembers',
  templateUrl: './addmembers.component.html',
  styleUrl: './addmembers.component.css'
})
export class AddmembersComponent {
  selectedMembers: string[] = [];
  users: any[] = []; // Store fetched users

  constructor(
    public dialogRef: MatDialogRef<AddmembersComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { groupId: string, users: any[] }
  ) {
    this.users = data.users; // Receive users from parent component
    console.log('Users received in dialog:', this.users); // ✅ Check if users are available
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    this.dialogRef.close(this.selectedMembers);
  }

  
}
