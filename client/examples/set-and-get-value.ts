import { DatabaseClient } from "../src/index.js";

const database = new DatabaseClient('http://localhost:6969');

async function main () {
  await database.createUser('username', 'password');
  await database.login('username', 'password');
  await database.assignUserToDatabase(0);
  await database.set(0, 'key', 'value');
  const value = await database.get(0, 'key');
  console.log(value);
}

main();
