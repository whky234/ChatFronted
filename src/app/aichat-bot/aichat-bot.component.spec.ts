import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AichatBotComponent } from './aichat-bot.component';

describe('AichatBotComponent', () => {
  let component: AichatBotComponent;
  let fixture: ComponentFixture<AichatBotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AichatBotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AichatBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
