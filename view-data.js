const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/debtmanage')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Connection failed:', err.message));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  pan: String,
  password: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function viewData() {
  try {
    const users = await User.find({});
    console.log('\n📊 Users in MongoDB:');
    console.log('===================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Mobile: ${user.mobile}`);
      console.log(`   PAN: ${user.pan}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    console.log(`\nTotal Users: ${users.length}`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

viewData();