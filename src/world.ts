const rn = require('node-random-name');
// const models = require("./models");
import { User, Ping } from './models';
import { assert } from 'console';

class World {

  readonly users: User[] = new Array<User>();
  readonly pings: Ping[] = new Array<Ping>();

  addPing(from: string, to: string, amt: number) {
    // fyi ! throws serror if undefined
    const fromUser = this.userByName(from)!;
    const toUser = this.userByName(to)!;
    const ping = new Ping(fromUser, toUser, amt);
    this.pings.push(ping);
    return ping;
  }

  userByName(name: string): User | undefined {
    return this.users.find(x => x.name.toLowerCase() === name.toLowerCase());
  }

  constructor() {
    this.users = this.stooges();
  }

  stooges() {
    return [
      new User('Miles'),
      new User('Nico'),
      new User('Anna')
    ];
  }

  //  randomGenerate(totalUsers, totalEdges) {
  //   const users = [];
  //   for (let i = 0; i < totalUsers; i++) {
  //     let user = new User(rn({seed: Math.random()}));
  //     users[i] = user;
  //   }

  //   for (let j = 0; j < totalEdges; j++) {
  //     let userFromNum = Math.floor(Math.random() * totalUsers);
  //     let userToNum = Math.floor(Math.random() * totalUsers);
  //     if (userFromNum === userToNum) {
  //       j--;
  //       continue;
  //     }
  //     let debt = Math.floor(Math.random() * 100);
  //     users[userFromNum].oweUser(users[userToNum], debt);
  //   }
  //   return users;
  // }
}

export default World;