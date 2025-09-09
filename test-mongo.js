const mongoose = require('mongoose');

// Test MongoDB connection
async function testConnection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/debtmanage', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.log('2. Start MongoDB service');
    console.log('3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
  }
}

testConnection();