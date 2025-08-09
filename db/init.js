const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database('./productivity.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Read and execute SQL initialization script
const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

db.exec(initSQL, (err) => {
    if (err) {
        console.error('Error initializing database:', err.message);
    } else {
        console.log('Database initialized successfully!');
        console.log('Tables created: users, tasks');
    }
    
    // Close database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}); 