import { Component } from '@angular/core';
import { ChatbotService } from '../services/chatbot.service';

@Component({
  selector: 'app-aichat-bot',
  templateUrl: './aichat-bot.component.html',
  styleUrls: ['./aichat-bot.component.css']
})
export class AichatBotComponent {
  messages: { sender: 'user' | 'bot'; text: string }[] = [];
  userMessage: string = '';
  isLoading: boolean = false; // Show typing indicator

  constructor(private chatService: ChatbotService) {}

  sendMessage() {
    if (this.userMessage.trim()) {
      this.messages.push({ sender: 'user', text: this.userMessage });
      this.isLoading = true;

      this.chatService.sendMessage(this.userMessage).subscribe(
        (response) => {
          this.messages.push({ sender: 'bot', text: response.formatreply });
          this.isLoading = false;
        },
        (error) => {
          this.messages.push({ sender: 'bot', text: "Error getting response." });
          this.isLoading = false;
        }
      );

      this.userMessage = '';
    }
  }

  closeChatBot() {
    this.messages = [];
  }
}
