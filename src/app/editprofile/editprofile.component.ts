import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-editprofile',
  templateUrl: './editprofile.component.html',
  styleUrls: ['./editprofile.component.css']
})
export class EditprofileComponent implements OnInit {
  emojis: any[] = [];
  limitedEmojis: any[] = [];
  selectedEmoji: string = ''; // Add the selected emoji property

  constructor(private socket: SocketService) {}

  ngOnInit(): void {
    
  }

  // Method to update selected emoji
  emojiSelected(emoji: string): void {
    this.selectedEmoji = emoji; // Set the selected emoji
  }
}
