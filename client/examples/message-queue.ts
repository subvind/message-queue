import { DatabaseClient } from "../src/index.js";

const database = new DatabaseClient('http://localhost:6969');

async function main() {
  console.log('Creating user or logging in...');
  await database.createUser('mquser', 'mqpass');

  await database.login('mquser', 'mqpass');
  console.log('Logged in successfully.');

  console.log('Assigning user to database 1...');
  await database.assignUserToDatabase(1);

  console.log('Testing rpush operation...');
  const rpushResult = await database.rpush(1, 'queue', ['message1', 'message2', 'message3']);
  console.log('RPush result:', rpushResult);

  console.log('Testing llen operation...');
  const llenResult = await database.llen(1, 'queue');
  console.log('LLen result:', llenResult);

  console.log('Testing lrange operation...');
  const lrangeResult = await database.lrange(1, 'queue', 0, -1);
  console.log('LRange result:', lrangeResult);

  console.log('Testing lpop operation...');
  const lpopResult = await database.lpop(1, 'queue');
  console.log('LPop result:', lpopResult);

  console.log('Checking queue length after lpop...');
  const llenAfterPopResult = await database.llen(1, 'queue');
  console.log('LLen after pop result:', llenAfterPopResult);

  console.log('Checking queue contents after lpop...');
  const lrangeAfterPopResult = await database.lrange(1, 'queue', 0, -1);
  console.log('LRange after pop result:', lrangeAfterPopResult);

  console.log('Cleaning up database...')
  await database.deleteDatabase(1);

  console.log('All operations completed successfully.');
}

main();