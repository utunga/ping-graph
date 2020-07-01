const rn = require("node-random-name");
//const models = require("./models");
import { User, Edge } from "./models";

class World {

  async stooges() {
    const users = new Map<number, User>();
    users[0] = new User("Curly");
    users[1] = new User("Moe");
    users[2] = new User("Larry");
    return users;
  }
  
  async emptyEdges() {
    return new Map<number, Edge>();
  }

  async randomGenerate(totalUsers, totalEdges) {
    const users = [];
    for (let i = 0; i < totalUsers; i++) {
      let user = new User(rn({seed: Math.random()}));
      users[i] = user;
    }

    for (let j = 0; j < totalEdges; j++) {
      let userFromNum = Math.floor(Math.random() * totalUsers);
      let userToNum = Math.floor(Math.random() * totalUsers);
      if (userFromNum == userToNum) {
        j--;
        continue;
      }
      let debt = Math.floor(Math.random() * 100);
      users[userFromNum].oweUser(users[userToNum], debt);
    }

    return users;
  }
}

export default World;