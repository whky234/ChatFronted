import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewgroupdetailComponent } from './viewgroupdetail.component';

describe('ViewgroupdetailComponent', () => {
  let component: ViewgroupdetailComponent;
  let fixture: ComponentFixture<ViewgroupdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewgroupdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewgroupdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
