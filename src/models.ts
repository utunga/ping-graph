
function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2);
}

class Ping {
  id: string;
  constructor(public from: User, public to: User, public amt: number) {
    this.id = generateRandomString(4);
  }
}

class User {
  id: string;
  constructor(public name: string) {
    this.id = generateRandomString(4);
  }
}



export { User, Ping};