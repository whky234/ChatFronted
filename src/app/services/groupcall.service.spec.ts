import { TestBed } from '@angular/core/testing';

import { GroupcallService } from './groupcall.service';

describe('GroupcallService', () => {
  let service: GroupcallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupcallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
