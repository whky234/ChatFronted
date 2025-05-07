import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupchatwindowComponent } from './groupchatwindow.component';

describe('GroupchatwindowComponent', () => {
  let component: GroupchatwindowComponent;
  let fixture: ComponentFixture<GroupchatwindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupchatwindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupchatwindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
