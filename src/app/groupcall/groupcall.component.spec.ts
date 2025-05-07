import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupcallComponent } from './groupcall.component';

describe('GroupcallComponent', () => {
  let component: GroupcallComponent;
  let fixture: ComponentFixture<GroupcallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupcallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupcallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
