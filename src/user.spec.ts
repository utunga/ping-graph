import { User } from './models';

describe('User', () => {
    it('should log when  debt added', () => {
        const user = new User(0);
        const otherUser = new User(1);
        spyOn(console, 'log');

        user.oweUser(otherUser, 10);

        expect(console.log).toHaveBeenCalled();
    });
});
