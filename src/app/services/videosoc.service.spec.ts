import { TestBed } from '@angular/core/testing';

import { VideosocService } from './videosoc.service';

describe('VideosocService', () => {
  let service: VideosocService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideosocService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
