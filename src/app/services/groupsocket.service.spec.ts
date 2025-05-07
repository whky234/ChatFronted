import { TestBed } from '@angular/core/testing';

import { GroupsocketService } from './groupsocket.service';

describe('GroupsocketService', () => {
  let service: GroupsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
