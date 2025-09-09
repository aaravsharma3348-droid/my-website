const mongoose = require('mongoose');

// Database configuration options
const dbConfig = {
  // Local MongoDB
  local: 'mongodb://localhost:27017/debtmanage',
  
  // MongoDB Atlas (replace with your connection string)
  atlas: 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/debtmanage?retryWrites=true&w=majority',
  
  // Connection options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

// Connect to MongoDB
async function connectDB(connectionType = 'local') {
  try {
    const connectionString = dbConfig[connectionType];
    await mongoose.connect(connectionString, dbConfig.options);
    
    console.log(`✅ Connected to MongoDB (${connectionType})`);
    console.log(`Database: ${mongoose.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB, dbConfig };