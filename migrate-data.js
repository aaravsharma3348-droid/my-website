const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/debtmanage')
  .then(() => console.log('✅ MongoDB connected for migration'))
  .catch(err => console.log('❌ MongoDB connection failed:', err.message));

// User Schema (same as server.js)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  pan: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Open SQLite database
const db = new sqlite3.Database('users.db');

// Migration function
async function migrateData() {
  try {
    // Clear existing MongoDB data
    await User.deleteMany({});
    console.log('🧹 Cleared existing MongoDB data');

    // Get all users from SQLite
    db.all('SELECT * FROM users', async (err, rows) => {
      if (err) {
        console.error('❌ Error reading SQLite:', err.message);
        return;
      }

      console.log(`📦 Found ${rows.length} users in SQLite`);

      // Insert each user into MongoDB
      for (const row of rows) {
        try {
          const user = new User({
            name: row.name,
            email: row.email,
            mobile: row.mobile,
            pan: row.pan,
            password: row.password // Already hashed from SQLite
          });

          await user.save();
          console.log(`✅ Migrated user: ${row.email}`);
        } catch (error) {
          console.log(`❌ Failed to migrate ${row.email}:`, error.message);
        }
      }

      console.log('🎉 Migration completed!');
      
      // Verify migration
      const count = await User.countDocuments();
      console.log(`📊 Total users in MongoDB: ${count}`);
      
      db.close();
      mongoose.connection.close();
    });

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

// Run migration
migrateData();