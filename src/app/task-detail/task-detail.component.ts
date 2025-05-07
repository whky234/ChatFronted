import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from '../models/task';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css'
})
export class TaskDetailComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Task,
    private dialogRef: MatDialogRef<TaskDetailComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
