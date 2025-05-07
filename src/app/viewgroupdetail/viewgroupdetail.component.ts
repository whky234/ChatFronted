import { SocketService } from './../services/socket.service';
import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupsocketService } from '../services/groupsocket.service';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-viewgroupdetail',
  templateUrl: './viewgroupdetail.component.html',
  styleUrl: './viewgroupdetail.component.css'
})
export class ViewgroupdetailComponent {
  groupMembers$ = new BehaviorSubject<any[]>([]); // Ensures an initial empty array
  currentuser:any

  constructor(
    public dialogRef: MatDialogRef<ViewgroupdetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { groupId: string, admin: string,adminId:string, groupMembers: any[] },
    private groupsocket:GroupsocketService,
    private cdRef:ChangeDetectorRef,
    private authser:AuthService
  ) {
    this.groupMembers$.next(data.groupMembers || []);

  }



  ngOnInit(): void {

    this.groupsocket.listen('group:member:left').subscribe((update: any) => {
      if (update?.groupId === this.data.groupId) {
        console.log('📡 Member left event received:', update);
        this.groupMembers$.next([...update.remainingMembers]);
        if (update.admin) {
          this.data.admin = update.admin;
        }
        this.cdRef.detectChanges();
      }
    });

    console.log(this.data)

    // Listen for group deletion
    this.groupsocket.listen('group:deleted').subscribe((deletedGroup: any) => {
      if (deletedGroup?.groupId === this.data.groupId) {
        this.dialogRef.close();
      }
    });

    this.groupsocket.listen("group:member:added").subscribe((data: any) => {
      console.log("📩 ✅ Socket Event Received:", data); // 🔹 Debugging

      if (!data) {
        console.warn("⚠️ Received event but data is empty.");
        return;
      }

      if (data?.groupId === this.data.groupId) {
        console.log("✅ Members added successfully:", data.updatedMembers);

        this.groupMembers$.next([...data.updatedMembers]); // Update the observable
        this.cdRef.detectChanges(); // Force UI update
      } else {
        console.warn(`⚠️ Event received for group ${data.groupId}, but current group is ${this.data.groupId}`);
      }
    });

    // Listen for group updates
    this.groupsocket.listen('group:update').subscribe((data: any) => {
      if (data?.groupId === this.data.groupId) {
        this.groupMembers$.next([...data.updatedMembers]);
        if (data.admin) {
          this.data.admin = data.admin;
        }
        this.cdRef.detectChanges();
      }
    });

    this.groupsocket.listen('group:created').subscribe((newGroup: any) => {
      if (newGroup?.groupId) {
        console.log('📡 New group created event received:', newGroup);
        this.groupMembers$.next([...this.groupMembers$.value, ...newGroup.groupDetails.members]);
        this.cdRef.detectChanges();
      }
    });

    this.getcurrent()
  }

  getcurrent() {
    this.authser.getCurrentUser().subscribe((res) => {
      this.currentuser = res._id;

      // ✅ Emit event ONLY after `this.currentuser` is set
      console.log("✅ Current User ID:", this.currentuser);
      this.groupsocket.emit("group:join", { groupId: this.data.groupId, userId: this.currentuser });
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
  filteredMembers() {
    return this.groupMembers$.value.filter(member => member._id !== this.data.adminId);
  }
}
