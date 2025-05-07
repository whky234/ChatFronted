import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantprofileComponent } from './participantprofile.component';

describe('ParticipantprofileComponent', () => {
  let component: ParticipantprofileComponent;
  let fixture: ComponentFixture<ParticipantprofileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParticipantprofileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticipantprofileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
