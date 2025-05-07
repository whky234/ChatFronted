import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  taskForm: FormGroup;
  groupMembers: any[];
  currentUserId: string;
  groupId: string;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskservice: TaskService
  ) {
    console.log("Received Data:", data);  // ✅ Log received data for debugging

    this.groupMembers = data.groupMembers;
    this.currentUserId = data.currentUserId;
    this.groupId = data.groupId;

    this.taskForm = this.fb.group({
      title: [data.task?.title || '', Validators.required],
      description: [data.task?.description || ''],
      assignedTo: [data.task?.assignedTo?.map((assignee: any) => assignee.userId) || [], Validators.required],
      deadline: [data.task?.deadline || '', Validators.required],
      createdBy: [this.currentUserId]
    });
  }

  submit(): void {
    if (this.taskForm.valid) {
      const formData = this.taskForm.value;

      console.log("🟢 Raw formData before formatting:", formData);

      if (!formData.assignedTo || formData.assignedTo.length === 0) {
        console.error("❌ assignedTo is empty! Ensure users are selected.");
        return;
      }

      const formattedData = {
        ...formData,
        taskId: this.data.task?._id || null,  // ✅ Include taskId when editing
        groupId: this.groupId,  // ✅ Ensure groupId is included
        createdBy: this.currentUserId,  // ✅ Ensure createdBy (userId) is included
        assignedTo: formData.assignedTo.map((userId: string) => ({ userId: userId.toString() })),  // ✅ Ensure userId is string
      };

      console.log("✅ Formatted Task Data before sending:", formattedData);

      if (formattedData.taskId) {
        // Update task
        this.taskservice.updateTask(this.groupId, this.currentUserId, formattedData).subscribe({
          next: (response) => {
            console.log('Task updated successfully:', response);
            this.dialogRef.close(response);
          },
          error: (err) => {
            console.error('Failed to update task:', err);
          },
        });
      } else {
        // Create new task
        this.dialogRef.close(formattedData);
      }
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  disablePastDates = (date: Date | null): boolean => {
    if (!date) return false; // Prevents error if date is null
    const today = new Date();

    // Set to the start of the day (removing time part)
    today.setHours(0, 0, 0, 0);

    // Return true if the date is after today (future dates only)
    return date > today;
  };

}
