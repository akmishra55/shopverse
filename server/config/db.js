
const mongoose = require('mongoose');

async function connectDB(retries = 5) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`MongoDB attempt ${i}/${retries} failed: ${err.message}`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

module.exports = connectDB;
