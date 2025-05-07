import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { VerifyOtpComponent } from '../../verify-otp/verify-otp.component';

const routes: Routes = [
  { path: '', component: VerifyOtpComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class VerifyOtpModule { }
