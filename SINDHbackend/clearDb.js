const { MongoClient } = require('mongodb');

async function clearDatabase() {
    const url = 'mongodb://127.0.0.1:27017';
    const dbName = 'sindh';
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        
        // Clear all collections
        await db.collection('workers').deleteMany({});
        await db.collection('employers').deleteMany({});
        await db.collection('jobs').deleteMany({});

        console.log('All collections cleared successfully');
    } catch (error) {
        console.error('Error clearing database:', error);
    } finally {
        await client.close();
        console.log('Database connection closed');
    }
}

clearDatabase(); 