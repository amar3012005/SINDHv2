
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { db } = require('../src/config/firebase');
const Worker = require('../src/models/Worker');
const Employer = require('../src/models/Employer');
const Job = require('../src/models/Job');
const JobApplication = require('../src/models/JobApplication');

// Helper function to recursively convert ObjectIds to strings and handle Date objects
function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return obj;

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  // Handle Mongoose/MongoDB ObjectId
  if (obj._bsontype === 'ObjectID' || (obj.constructor && obj.constructor.name === 'ObjectId')) {
    return obj.toString();
  }

  // Handle Date objects (Firestore supports native Dates)
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Objects
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal Mongoose fields
      if (key === '_v' || key === '__v') continue;
      sanitized[key] = sanitizeForFirestore(value);
    }
    return sanitized;
  }

  return obj;
}

async function migrate() {
  try {
    console.log('🚀 Starting migration from MongoDB to Firestore...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (!db) {
      throw new Error('Firestore not initialized. Check your serviceAccountKey.json');
    }

    // 1. Migrate Workers to 'users' collection with role 'worker'
    console.log('📦 Migrating Workers...');
    const workers = await Worker.find({});
    for (const worker of workers) {
      const data = worker.toObject();
      const id = data._id.toString();
      delete data._id;
      
      const sanitizedData = sanitizeForFirestore(data);
      
      await db.collection('users').doc(id).set({
        ...sanitizedData,
        type: 'worker',
        role: 'worker',
        migratedAt: new Date()
      }, { merge: true });
    }
    console.log(`✅ Migrated ${workers.length} workers`);

    // 2. Migrate Employers to 'users' collection with role 'employer'
    console.log('📦 Migrating Employers...');
    const employers = await Employer.find({});
    for (const employer of employers) {
      const data = employer.toObject();
      const id = data._id.toString();
      delete data._id;
      
      const sanitizedData = sanitizeForFirestore(data);
      
      await db.collection('users').doc(id).set({
        ...sanitizedData,
        type: 'employer',
        role: 'employer',
        migratedAt: new Date()
      }, { merge: true });
    }
    console.log(`✅ Migrated ${employers.length} employers`);

    // 3. Migrate Jobs
    console.log('📦 Migrating Jobs...');
    const jobs = await Job.find({});
    for (const job of jobs) {
      const data = job.toObject();
      const id = data._id.toString();
      delete data._id;
      
      const sanitizedData = sanitizeForFirestore(data);
      
      await db.collection('jobs').doc(id).set({
        ...sanitizedData,
        createdAt: sanitizedData.createdAt || new Date(),
        migratedAt: new Date()
      }, { merge: true });
    }
    console.log(`✅ Migrated ${jobs.length} jobs`);

    // 4. Migrate Job Applications
    console.log('📦 Migrating Applications...');
    const applications = await JobApplication.find({});
    for (const app of applications) {
      const data = app.toObject();
      const id = data._id.toString();
      delete data._id;
      
      const sanitizedData = sanitizeForFirestore(data);

      await db.collection('applications').doc(id).set({
        ...sanitizedData,
        appliedAt: sanitizedData.createdAt || sanitizedData.appliedAt || new Date(),
        migratedAt: new Date()
      }, { merge: true });
    }
    console.log(`✅ Migrated ${applications.length} applications`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

