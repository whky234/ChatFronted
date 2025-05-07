import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { guardGuard } from './auth/guard.guard';
import { GoogleAuthCallbackComponent } from './components/google-auth-callback/google-auth-callback.component';
import { VideocallComponent } from './videocall/videocall.component';
import { GroupcallComponent } from './groupcall/groupcall.component';

const routes: Routes = [
  { path: 'auth/google/success', component: GoogleAuthCallbackComponent },
  { path: 'videocall', component: VideocallComponent },
  { path: 'Groupcall',     canActivate: [guardGuard], component: GroupcallComponent },



  {
    path: 'signup',
    loadChildren: () => import('./Modules/signup/signup.module').then(m => m.SignupModule)
  },
  {
    path: 'verify-otp',
    loadChildren: () => import('./Modules/verify-otp/verify-otp.module').then(m => m.VerifyOtpModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./Modules/login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'kanban/:groupId',
    canActivate: [guardGuard],
    loadChildren: () => import('./Modules/task-list/task-list.module').then(m => m.TaskListModule)
  },
  {
    path: 'chat',
    canActivate: [guardGuard],
    loadChildren: () => import('./Modules/chat/chat.module').then(m => m.ChatModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./Modules/forgotpassword/forgotpassword.module').then(m => m.ForgotpasswordModule)
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./Modules/reset-password/reset-password.module').then(m => m.ResetPasswordModule)
  },
  // {
  //   path: 'message',
  //   loadChildren: () => import('./messagebox/messagebox.module').then(m => m.MessageboxModule)
  // },

  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

