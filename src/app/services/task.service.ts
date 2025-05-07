import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Task } from '../models/task';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/grouptask'; // Adjust the URL according to your backend

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient,private authser:AuthService) {}

  // ✅ Create a new task in a group
createTask(groupId: string, task: Task): Observable<any> {
  const token = this.authser.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const payload = {
    groupId,
    title: task.title,
    description: task.description,
    assignedTo: task.assignedTo,  // ✅ Fix this if necessary
    deadline: task.deadline,
    createdBy: task.createdBy
  };
  return this.http.post(`${this.apiUrl}/tasks`, payload, { headers });
}

  // Update the status of a task
  updateTaskStatus(groupId: string, taskId: string, userId: string, status: string): Observable<any> {
    const token = this.authser.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const payload = { groupId, taskId,userId, status };
    return this.http.put(`${this.apiUrl}/tasks/status`, payload,{headers});
  }

  // Get all tasks of a specific group
  getGroupTasks(groupId: string): Observable<Task[]> {
    const token = this.authser.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Task[]>(`${this.apiUrl}/tasks?groupId=${groupId}`,{headers});

  }

  updateTask(groupId: string, userId: string, task: Task): Observable<Task[]> {
    const token = this.authser.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Ensure groupId and userId are included in the request payload

    return this.http.put<Task[]>(`${this.apiUrl}/edittask`,  {
      taskId: task._id,  // ✅ Ensure taskId is sent
    ...task,
    groupId,
    userId
    }, { headers }).pipe(
      tap((updatedTasks) => {
        this.notifyTaskUpdate(updatedTasks); // Emit updated tasks
      })
    );
  }

  uploadFile(taskId: string,groupId:string, formData: FormData) {
    const token = this.authser.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/${groupId}/tasks/${taskId}/upload`, formData,{headers});
  }


  deleteTask(groupId: string, taskId: string, userId: string): Observable<any> {
    const token = this.authser.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.apiUrl}/deletetask`, {
      headers,
      body: { groupId, taskId, userId }, // Include userId in the request body
    }).pipe(
      tap(() => {
        // Optionally fetch updated tasks after deletion
        this.getGroupTasks(groupId).subscribe((tasks) => {
          this.notifyTaskUpdate(tasks);
        });
      })
    );
  }

  // Notify components of updated tasks
  notifyTaskUpdate(tasks: Task[]) {
    this.tasksSubject.next(tasks);
  }

}
