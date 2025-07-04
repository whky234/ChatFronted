import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatwindowComponent } from './chatwindow.component';

describe('ChatwindowComponent', () => {
  let component: ChatwindowComponent;
  let fixture: ComponentFixture<ChatwindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatwindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatwindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
