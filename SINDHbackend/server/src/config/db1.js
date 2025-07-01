const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const connectDB = async (retries = 5, interval = 5000) => {
  // Use mongod service name instead of mongodb
  const checkMongoService = async () => {
    try {
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('systemctl is-active mongod', (error, stdout) => {
          resolve(stdout.trim() === 'active');
        });
      });
    } catch (error) {
      return false;
    }
  };

  for (let i = 0; i < retries; i++) {
    try {
      const isMongoRunning = await checkMongoService();
      if (!isMongoRunning) {
        console.error('❌ MongoDB service (mongod) is not running');
        console.log('⚡ Attempting to start MongoDB...');
        require('child_process').execSync('sudo systemctl start mongod');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for service to start
      }

      console.log(`\n📦 MongoDB connection attempt ${i + 1} of ${retries}`);
      
      const connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
      });

      console.log('✅ MongoDB Connected Successfully');
      return connection;

    } catch (error) {
      console.error(`\n❌ Connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('\n❌ Max retries reached. Please:');
        console.error('1. Check if MongoDB is installed: sudo apt install mongodb');
        console.error('2. Start MongoDB: sudo systemctl start mongodb');
        console.error('3. Enable MongoDB: sudo systemctl enable mongodb');
        console.error('4. Check MongoDB status: sudo systemctl status mongodb\n');
        process.exit(1);
      }
      
      console.log(`\n⏳ Retrying in ${interval/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};

module.exports = connectDB;
