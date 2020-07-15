
function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2);
}

class Ping {
  constructor(public from: User, public to: User, public amt: number) {}
}

class User {
  id: string;
  constructor(public name: string) {
    this.id = generateRandomString(4);
  }
}



export { User, Ping};