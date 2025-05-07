import { TestBed } from '@angular/core/testing';

import { FireNotiService } from './fire-noti.service';

describe('FireNotiService', () => {
  let service: FireNotiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FireNotiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
