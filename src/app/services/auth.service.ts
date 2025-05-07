import { formatDate } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // ✅ Correct way to import


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  // Signup with OTP request
  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, userData);
  }

  // Verify OTP
  verifyOTP(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }


  // Login
  login(credentials: any): Observable<any> {


    return this.http.post(`${this.apiUrl}/login`, credentials,).pipe(
      tap((response: any) => {
        if (response.token) {
          // Store token in local storage
          localStorage.setItem('jwt', response.token);
          console.log('Token stored:', response.token);
        }
      })
    );
  }

  // Logout
  logout(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        // Remove token from local storage
        localStorage.removeItem('jwt');
        localStorage.removeItem("currentUser");

        this.router.navigate(['/login']); // Redirect to login page
      })
    );
  }


  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt'); // Check for token in local storage

  }

  // Get the current user's token
  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true; // If no token, consider it expired

    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true; // If token is invalid, consider it expired
    }
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  // Google login
  googleLogin() {
    window.location.href = `${this.apiUrl}/google`;
  }

  handleGoogleRedirect() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('jwt', token);
        this.router.navigate(['/chat']);
      }
    });
  }

  // Get logged-in users excluding current user
  getloggedinUsers(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.get(`${this.apiUrl}/users`, { headers });
  }

  // Get the current user
  getCurrentUser(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.get(`${this.apiUrl}/current-user`, { headers });
  }

  // Get the current user's ID from the backend
  getCurrentUserId() {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.get<any>(`${this.apiUrl}/current-user`, { headers }).pipe(
      tap((response) => {
        return response._id; // Assuming the response contains '_id' field
      })
    ).toPromise();
  }


  // Fetch messages
  getMessages(userId: string): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.error('No token found');
      return new Observable(); // Prevent making request if no token
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const params = new HttpParams().set('userId', userId);

    return this.http.get<any>(`${this.apiUrl}/chat/messages`, { headers, params });
  }

// Send a message
sendMessage(formData: FormData): Observable<any> {
  const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  return this.http.post(`${this.apiUrl}/chat/send-message`, formData, { headers });
}



// Fetch online users
getOnlineUsers(): Observable<any> {
  const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  return this.http.get(`${this.apiUrl}/chat/online-users`, { headers });
}


getUserById(userId: string) {
  return this.http.get(`${this.apiUrl}/users/${userId}`);
}


// Delete Message for Me (Soft Delete)
deleteMessageForMe(messageId: string): Observable<any> {
  const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` ,
  'Content-Type': 'application/json'  // Ensure content type is JSON

});

  return this.http.delete(`${this.apiUrl}/chat/deleteforme/`, { headers,
    body:{messageId}
   });
}

deleteMessageForEveryone(messageId: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.getToken()}`,
    'Content-Type': 'application/json'  // Ensure content type is JSON
  });

  return this.http.delete(`${this.apiUrl}/chat/deleteforeveryone`, {
    headers,
    body: { messageId },  // Send messageId in request body
  });
}

EditMessage(messageId: string, newText: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.getToken()}`,
    'Content-Type': 'application/json',
  });

  return this.http.put(`${this.apiUrl}/chat/updatemessages`,
    { messageId, text: newText }, // ✅ Send new text in request body
    { headers }
  );



}






blockUser(userId: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.getToken()}`,
    'Content-Type': 'application/json',
  });
  return this.http.post(`${this.apiUrl}/block`, { userIdToBlock: userId },{headers});
}

// Unblock a user
unblockUser(userId: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.getToken()}`,
    'Content-Type': 'application/json',
  });
  return this.http.post(`${this.apiUrl}/unblock`, { userIdToUnblock: userId },{headers});
}

  // Get blocked users
  getBlockedUsers(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http.get(`${this.apiUrl}/blocked-users`,{headers});
  }









addChatUser(name: string, email: string): Observable<any> {
  const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });

  return this.http.post(`${this.apiUrl}/add`, { name, email },{headers});
}

// Fetch chat users
fetchChatUsers(): Observable<any> {
  const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });

  return this.http.get(`${this.apiUrl}/getUser`,{headers});
}

updateAccountSettings(email: string, password: string): Observable<any> {
  const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });

  return this.http.put(`${this.apiUrl}/account-settings`, { email, password }, { headers });
}

}
