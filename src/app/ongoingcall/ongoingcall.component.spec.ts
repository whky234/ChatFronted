import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OngoingcallComponent } from './ongoingcall.component';

describe('OngoingcallComponent', () => {
  let component: OngoingcallComponent;
  let fixture: ComponentFixture<OngoingcallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OngoingcallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OngoingcallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
