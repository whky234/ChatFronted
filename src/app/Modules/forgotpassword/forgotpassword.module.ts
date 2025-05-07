import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForgotpasswordComponent } from '../../forgotpassword/forgotpassword.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: ForgotpasswordComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)

  ]
})
export class ForgotpasswordModule { }
