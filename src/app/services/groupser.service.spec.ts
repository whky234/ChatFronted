import { TestBed } from '@angular/core/testing';

import { GroupserService } from './groupser.service';

describe('GroupserService', () => {
  let service: GroupserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
