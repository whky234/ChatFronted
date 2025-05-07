import { Component, Inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { VideoCallService } from '../services/video-call.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-audiocallcomponent',
  templateUrl: './audiocallcomponent.component.html',
  styleUrls: ['./audiocallcomponent.component.css']
})
export class AudiocallcomponentComponent {

}
