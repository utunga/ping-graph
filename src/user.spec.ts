import { User, Ping } from './models';

describe('User', () => {
    it('should log when  debt added', () => {
        const user = new User('larry');
        const otherUser = new User('moe');
        spyOn(console, 'log');

        //user.oweUser(otherUser, new Ping(0, 1, 10));

        expect(console.log).toHaveBeenCalled();
    });
});
