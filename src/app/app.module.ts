import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { GoogleAuthCallbackComponent } from './components/google-auth-callback/google-auth-callback.component';
import { UserlistComponent } from './userlist/userlist.component';
import { ProfileComponent } from './profile/profile.component';
import { MessageboxComponent } from './messagebox/messagebox.component';
import { ChatwindowComponent } from './chatwindow/chatwindow.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { InterceptorService } from './services/interceptor.service';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { EditprofileComponent } from './editprofile/editprofile.component';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { CreateGroupComponent } from './create-group/create-group.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ParticipantprofileComponent } from './participantprofile/participantprofile.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ConnectService } from './services/connect.service';
import { AuthService } from './services/auth.service';
import { AudiocallcomponentComponent } from './audiocallcomponent/audiocallcomponent.component';
import { VideocallComponent } from './videocall/videocall.component';
import { AichatBotComponent } from './aichat-bot/aichat-bot.component';
import { NotificationDialogComponent } from './notification-dialog/notification-dialog.component';
import { MatListModule } from '@angular/material/list';
import { SettingsDialogComponent } from './settings-dialog/settings-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { GroupchatwindowComponent } from './groupchatwindow/groupchatwindow.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AddmembersComponent } from './addmembers/addmembers.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ViewgroupdetailComponent } from './viewgroupdetail/viewgroupdetail.component';
import { OutgoingCallComponent } from './outgoing-call/outgoing-call.component';
import { OngoingcallComponent } from './ongoingcall/ongoingcall.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { GroupcallComponent } from './groupcall/groupcall.component';
import { SnackbarService } from './services/snackbar.service';



@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    LoginComponent,
    ChatComponent,
    VerifyOtpComponent,
    ForgotpasswordComponent,
    ResetPasswordComponent,
    GoogleAuthCallbackComponent,
    UserlistComponent,
    ProfileComponent,  // ✅ Ensure this is declared
    MessageboxComponent,
    ChatwindowComponent,
    ViewProfileComponent,
    EditprofileComponent,
    TaskFormComponent,
    TaskListComponent,
    TaskDetailComponent,
    CreateGroupComponent,
    ParticipantprofileComponent,
    AudiocallcomponentComponent,
    VideocallComponent,
    AichatBotComponent,
    NotificationDialogComponent,
    SettingsDialogComponent,
    GroupchatwindowComponent,
    AddmembersComponent,
    ViewgroupdetailComponent,
    OutgoingCallComponent,
    OngoingcallComponent,
    GroupcallComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSnackBarModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatTooltipModule,
    MatRippleModule,
    MatToolbarModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDialogModule,  // ✅ Keep only one import
    MatListModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DragDropModule,
    MatIconButton,
    MatCardModule,
    MatButtonToggleModule



  ],
  providers: [
    provideHttpClient(),
    provideAnimationsAsync(),
    ConnectService,
    AuthService,
    MatDatepickerModule,
    MatNativeDateModule,
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
