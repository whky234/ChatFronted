import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { OngoingcallComponent } from '../ongoingcall/ongoingcall.component';

@Component({
  selector: 'app-outgoing-call',
  templateUrl: './outgoing-call.component.html',
  styleUrls: ['./outgoing-call.component.css']
})
export class OutgoingCallComponent implements OnInit, OnDestroy {

  callStatus:string='ringing'
  constructor(
    public dialogRef: MatDialogRef<OutgoingCallComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private socketService: SocketService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Emit call initiation event
    this.socketService.emit('call:initiate', {
      fromUserId: this.data.fromUserId,
      toUserId: this.data.toUserId
    });
    console.log('📞 Emitting call:initiate...', this.data);

    // Listen for call response
    this.listenForCallResponse();
  }

  ngOnDestroy(): void {
    // Notify server about call end
    this.socketService.emit('call:end', {
      fromUserId: this.data.fromUserId,
      toUserId: this.data.toUserId
    });
  }

  listenForCallResponse(): void {
    this.socketService.on('call:accepted', (data: any) => {
      console.log('📩 Received call:accepted:', data);
      console.log('👉 data.toUserId:', data.toUserId);
      console.log('👉 this.data.toUserId:', this.data.toUserId);

      if (data.toUserId === this.data.toUserId) {
        console.log('✅ Condition matched, closing dialog and starting call');
        this.dialogRef.close();
        this.openOngoingCallDialog();
      } else {
        console.log('❌ Condition did not match');
      }
    });

    this.socketService.on('call:start', (data: any) => {
      console.log('🔥 Call started event received:', data);
    });


    // Handle call rejection
    this.socketService.on('call:rejected', (data: any) => {
      if (data.toUserId === this.data.fromUserId) {
        this.dialogRef.close();
      }
    });
  }

  openOngoingCallDialog(): void {
    this.dialog.open(OngoingcallComponent, {
      width: '400px',
      data: this.data
    });
  }

  cancelCall(): void {
    this.socketService.emit('call:cancel', {
      fromUserId: this.data.fromUserId,
      toUserId: this.data.toUserId
    });
    this.dialogRef.close();
  }
}
