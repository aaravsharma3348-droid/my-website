const sqlite3 = require('sqlite3').verbose();

// Open database
const db = new sqlite3.Database('users.db');

// Check if users table exists and show all users
db.all('SELECT * FROM users', (err, rows) => {
  if (err) {
    console.error('Error reading database:', err.message);
  } else {
    console.log('Users in database:');
    console.log(rows);
    console.log(`Total users: ${rows.length}`);
  }
  db.close();
});