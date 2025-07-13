import { UserService } from '../../../src/dao/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });
});
