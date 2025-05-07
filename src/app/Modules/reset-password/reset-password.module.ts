import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ResetPasswordComponent } from '../../reset-password/reset-password.component';


const routes: Routes = [
  { path: '', component: ResetPasswordComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
        RouterModule.forChild(routes)
    
  ]
})
export class ResetPasswordModule { }
