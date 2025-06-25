import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CdkDragDrop,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { Task } from '../models/task';
import { TaskService } from '../services/task.service';
import { SocketService } from '../services/socket.service';
import { AuthService } from '../services/auth.service';
import { GroupserService } from '../services/groupser.service';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent {
  tasks: Task[] = [];
  pendingTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  inReviewTasks: Task[] = [];
  completedTasks: Task[] = [];

  groupId: string = '';
  groupMembers: any[] = [];
  currentuser: any;
  searchQuery: string = '';
  searchTerm: string = '';


  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private socketser: SocketService,
    private authser: AuthService,
    private snackbar: MatSnackBar,
    private groupser: GroupserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authser.getCurrentUser().subscribe((user: any) => {
      this.currentuser = user._id;
    });

    this.route.paramMap.subscribe((params) => {
      this.groupId = params.get('groupId') || '';
      if (this.groupId) {
        this.loadTasks();
        this.loadGroupDetails();
      }
    });

    this.socketser.on(
      'taskUpdated',
      (data: { taskId: string; status: string; groupId: string }) => {
        if (data.groupId !== this.groupId) return;

        this.tasks = this.tasks.map((task) => {
          if (task._id === data.taskId) {
            task.assignedTo = task.assignedTo.map((assignee) =>
              assignee.userId?._id === this.currentuser
                ? { ...assignee, status: data.status }
                : assignee
            );
            task.status = data.status;
          }
          return task;
        });

        this.categorizeTasks();
      }
    );

    // Subscribe to real-time task updates from TaskService
    this.taskService.tasks$.subscribe((updatedTasks) => {
      this.tasks = updatedTasks;
      this.categorizeTasks();
    });
  }

  loadTasks() {
    this.taskService.getGroupTasks(this.groupId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.categorizeTasks();
      },
      error: (err) => console.error('Error fetching group tasks:', err),
    });
  }

  loadGroupDetails() {
    this.groupser.getGroupDetails(this.groupId).subscribe((group) => {
      this.groupMembers = group.members;
    });
  }


  get filteredPendingTasks() {
    return this.pendingTasks.filter(task =>
      task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredInProgressTasks() {
    return this.inProgressTasks.filter(task =>
      task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredInReviewTasks() {
    return this.inReviewTasks.filter(task =>
      task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredCompletedTasks() {
    return this.completedTasks.filter(task =>
      task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  categorizeTasks(): void {
    this.pendingTasks = [];
    this.inProgressTasks = [];
    this.inReviewTasks = [];
    this.completedTasks = [];

    this.tasks.forEach((task) => {
      const hasInProgress = task.assignedTo.some(
        (a) => a.status === 'in-progress'
      );
      const hasInReview = task.assignedTo.some(
        (a) => a.status === 'in-review'
      );
      const allCompleted = task.assignedTo.every(
        (a) => a.status === 'completed'
      );

      if (allCompleted) {
        this.completedTasks.push(task);
      } else if (hasInReview) {
        this.inReviewTasks.push(task);
      } else if (hasInProgress) {
        this.inProgressTasks.push(task);
      } else {
        this.pendingTasks.push(task);
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: string) {
    const task = event.previousContainer.data[event.previousIndex];
    if (!task) return;

    const userId = this.currentuser;
    const isCreator = task.createdBy?._id === userId;
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const isOverdue = deadline ? deadline < now : false;

    if (isOverdue) {
      this.snackbar.open('Cannot move overdue tasks!', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    console.log('Task:', task);
    console.log('New Status:', newStatus);

    if (
      task.status === 'in-review' &&
      newStatus !== 'completed' &&
      !isCreator
    ) {
      this.snackbar.open(
        "Only the creator can move 'In-Review' tasks to 'Completed'!",
        'Close',
        { duration: 3000, panelClass: 'error-snackbar' }
      );
      return;
    }

    // Update UI optimistically
    task.status = newStatus;
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update backend
    this.updateStatus(task._id, userId, newStatus);
  }

  updateStatus(taskId: string, userId: string, status: string): void {
    this.taskService
      .updateTaskStatus(this.groupId, taskId, userId, status)
      .subscribe({
        next: (res) => {
          this.tasks = this.tasks.map((task) => {
            if (task._id === taskId) {
              task.assignedTo = task.assignedTo.map((assignee) =>
                assignee.userId?._id === userId
                  ? { ...assignee, status }
                  : assignee
              );
              task.status = status;
            }
            return task;
          });

          this.categorizeTasks();

          this.socketser.emit('taskUpdated', {
            taskId,
            status,
            groupId: this.groupId,
          });

          this.snackbar.open(res?.message || 'Task status updated!', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar',
          });
        },
        error: (err) => {
          this.snackbar.open(
            err?.error?.message || 'Status update failed!',
            'Close',
            { duration: 3000, panelClass: 'error-snackbar' }
          );
          this.loadTasks(); // fallback reload
        },
      });
  }

  isAssignedToCurrentUser(task: Task): boolean {
    const assignedUser = task.assignedTo.find(
      (a) => a.userId?._id === this.currentuser
    );
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const now = new Date();
    const isOverdue = deadline ? deadline < now : false;

    if (isOverdue) return false;

    if (
      assignedUser &&
      assignedUser.status !== 'completed' &&
      assignedUser.status !== 'in-review'
    ) {
      return true;
    }

    if (
      task.createdBy?._id === this.currentuser &&
      assignedUser?.status === 'in-review'
    ) {
      return true;
    }

    return false;
  }

  getAssignedToNames(task: Task): string {
    return Array.isArray(task.assignedTo)
      ? task.assignedTo.map((a) => a.userId?.name || 'Unknown').join(', ')
      : 'Unassigned';
  }

  uploadFile(event: Event, taskId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.taskService.uploadFile(taskId, this.groupId, formData).subscribe({
      next: () => {
        this.snackbar.open('File uploaded!', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.loadTasks();
      },
      error: () => {
        this.snackbar.open('Upload failed!', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  editTask(task: Task): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      data: {
        task,
        groupId: this.groupId,
        groupMembers: this.groupMembers,
        currentUserId: this.currentuser,
      },
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadTasks();
      }
    });
  }

  deleteTask(taskId: string): void {
    this.taskService
      .deleteTask(this.groupId, taskId, this.currentuser)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.tasks = this.tasks.filter((task) => task._id !== taskId);
          this.categorizeTasks();
          this.snackbar.open(
            res?.message || 'Task deleted successfully!',
            'Close',
            {
              duration: 3000,
              panelClass: 'success-snackbar',
            }
          );
        },
        error: (err) => {
          console.error('Error deleting task:', err);
          const errorMessage =
            err?.error?.message || 'Failed to delete task. Please try again.';
          this.snackbar.open(errorMessage, 'Close', {
            duration: 3000,
            panelClass: 'error-snackbar',
          });
        },
      });
  }
}


