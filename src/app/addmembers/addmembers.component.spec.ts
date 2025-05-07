import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddmembersComponent } from './addmembers.component';

describe('AddmembersComponent', () => {
  let component: AddmembersComponent;
  let fixture: ComponentFixture<AddmembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddmembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddmembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
