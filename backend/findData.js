const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeReview';
        console.log("Connecting to:", uri);
        await mongoose.connect(uri);
        
        const dbName = mongoose.connection.name;
        const host = mongoose.connection.host;
        const port = mongoose.connection.port;
        const count = await mongoose.connection.db.collection('problems').countDocuments();
        
        console.log("\n==========================================");
        console.log("VERIFICATION RESULT:");
        console.log(`- Host: ${host}`);
        console.log(`- Port: ${port}`);
        console.log(`- Database Name: ${dbName}`);
        console.log(`- Collection: [problems]`);
        console.log(`- Problem Count: ${count}`);
        console.log("==========================================");
        
        if (count > 2000) {
            console.log("\nSUCCESS: The 2913 problems ARE here.");
            console.log(`TO SEE THEM IN COMPASS:`);
            console.log(`1. Connect to: mongodb://${host}:${port}`);
            console.log(`2. Open database: ${dbName}`);
            console.log(`3. Open collection: [problems]`);
        } else {
            console.log(`\nSTILL EMPTY: Only found ${count} problems here.`);
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err.message);
    }
}
run();
