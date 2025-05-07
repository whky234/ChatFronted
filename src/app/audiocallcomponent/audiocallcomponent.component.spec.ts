import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudiocallcomponentComponent } from './audiocallcomponent.component';

describe('AudiocallcomponentComponent', () => {
  let component: AudiocallcomponentComponent;
  let fixture: ComponentFixture<AudiocallcomponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudiocallcomponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudiocallcomponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
