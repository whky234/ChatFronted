import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConnectService {

  constructor() { }

  isOnline(): boolean {
    return navigator.onLine; // Returns true if online, false otherwise
  }
}
