const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('📡 Port:', mongoose.connection.port);

  // Test creating a simple document
  const testSchema = new mongoose.Schema({ test: String });
  const TestModel = mongoose.model('Test', testSchema);

  return TestModel.create({ test: 'connection test' });
})
.then((doc) => {
  console.log('✅ Test document created:', doc._id);
  return mongoose.connection.close();
})
.then(() => {
  console.log('✅ Connection closed successfully');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Connection failed:');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);

  if (error.message.includes('IP')) {
    console.log('\n💡 Solution: Add your IP to MongoDB Atlas whitelist');
    console.log('   1. Go to MongoDB Atlas → Network Access');
    console.log('   2. Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
  }

  if (error.message.includes('authentication')) {
    console.log('\n💡 Solution: Check username/password in connection string');
  }

  process.exit(1);
});