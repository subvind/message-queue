import { DatabaseClient } from "../src/index.js";

const database = new DatabaseClient('http://localhost:6969');

async function main() {
  console.log('Creating user or logging in...');
  await database.createUser('cacheuser', 'cachepass');

  await database.login('cacheuser', 'cachepass');
  console.log('Logged in successfully.');

  console.log('Assigning user to database 2...');
  await database.assignUserToDatabase(2);

  console.log('Testing session set operation...');
  const setResponse = await database.set(2, 'sessionkey', 'sessionvalue');
  console.log('Session set response:', setResponse);

  console.log('Testing session get operation...');
  const getResponse = await database.get(2, 'sessionkey');
  console.log('Session get response:', getResponse);

  console.log('Testing session delete operation...');
  const deleteResponse = await database.del(2, ['sessionkey']);
  console.log('Session delete response:', deleteResponse);

  console.log('Verifying session key deletion...');
  const getDeletedResponse = await database.get(2, 'sessionkey');
  console.log('Get deleted session key response:', getDeletedResponse);

  console.log('Testing session expiration...');
  await database.set(2, 'expiringkey', 'expiringvalue');
  await database.expire(2, 'expiringkey', 2);

  console.log('Waiting for 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const getExpiredResponse = await database.get(2, 'expiringkey');
  console.log('Get expired session key response:', getExpiredResponse);

  console.log('All session cache tests completed successfully.');
}

main();