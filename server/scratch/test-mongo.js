const mongoose = require('mongoose');

const uri = 'mongodb://mrmathan105_db_user:Mathan%402007@ac-txgprrc-shard-00-00.vwwf044.mongodb.net:27017,ac-txgprrc-shard-00-01.vwwf044.mongodb.net:27017,ac-txgprrc-shard-00-02.vwwf044.mongodb.net:27017/?ssl=true&replicaSet=atlas-txgprrc-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB directly...');
    await mongoose.connect(uri);
    console.log('Successfully connected!');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
