import { SocketService } from './socket.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { GroupsocketService } from './groupsocket.service';


@Injectable({
  providedIn: 'root'
})
export class GroupserService {

  private apiUrl = 'http://localhost:3000/api/groups'; // Adjust base URL as needed
  private baseusrl = 'http://localhost:3000/api'; // Adjust base URL as needed
  private selectedGroupId = new BehaviorSubject<string | null>(null);
  selectedGroupId$ = this.selectedGroupId.asObservable();

  private showGroups = new BehaviorSubject<boolean>(false);
  showGroups$ = this.showGroups.asObservable();

  constructor(private http: HttpClient,private authser:AuthService,private SocketService:GroupsocketService) {}
  toggleGroups() {
    this.showGroups.next(!this.showGroups.value);
  }

  // Create a new group
  createGroup(groupData: { name: string }): Observable<any> {
      const headers = new HttpHeaders({
          Authorization: `Bearer ${this.authser.getToken()}`
        });
    return this.http.post(`${this.apiUrl}/create`, groupData,{headers});
  }

  addMembers(groupId: any, members: string[]): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authser.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/add-members`, { groupId, newMembers: members }, { headers });
  }


  fetchgroupusers(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authser.getToken()}`
    });
    console.log(headers)
    return this.http.get(`${this.apiUrl}/fetchgroupusers`,{headers});
  }

  LeaveGroup(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authser.getToken()}`,
    });

    return this.http.delete(`${this.apiUrl}/leavegroup/${groupId}`, { headers });
  }

   // ✅ Get Group Details by Group ID
  getGroupDetails(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/group/${groupId}`);
  }

  // Switch admin
  switchAdmin(groupId: string, newAdminId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authser.getToken()}`
    });
    return this.http.post(`${this.apiUrl}/switch-admin`, { groupId, newAdminId },{headers});
  }

  // Send message to a group
  sendMessageToGroup(data:any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authser.getToken()}`
    });
    return this.http.post(`${this.baseusrl}/group-messages/send`, data,{headers});
  }

  // Get messages of a group
  getGroupMessages(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authser.getToken()}`
    });
    return this.http.get(`${this.baseusrl}/group-messages/messages?groupId=${groupId}`,{headers});
  }

  deleteMessageForEveryone(messageId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authser.getToken()}`,
      'Content-Type': 'application/json'  // Ensure content type is JSON
    });

    return this.http.delete(`${this.baseusrl}/group-messages/Deleteforevery`, {
      headers,
      body: { messageId },  // Send messageId in request body
    });
  }

  DeletForEM(messageId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authser.getToken()}`,
      'Content-Type': 'application/json'  // Ensure content type is JSON
    });

    return this.http.delete(`${this.baseusrl}/group-messages/Deleteforme`, {
      headers,
      body: { messageId },  // Send messageId in request body
    });
  }

  EditMessage(messageId: string, newText: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authser.getToken()}`,
      'Content-Type': 'application/json',
    });

    return this.http.put(`${this.baseusrl}/group-messages/EditMessage`,
      { messageId, text: newText }, // ✅ Send new text in request body
      { headers }
    );
  }

  markMessageAsSeen(messageId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authser.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http.post(`${this.baseusrl}/group-messages/mark-seen`, { messageId },{ headers });
  }








}
