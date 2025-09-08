// MongoDB initialization script
// This script runs when the MongoDB container is first created

// Switch to the money_tracker database
db = db.getSiblingDB('money_tracker');

// Create a collection with some initial data (optional)
db.transactions.insertMany([
  {
    name: "Initial Setup",
    description: "Database initialization",
    price: 0,
    datetime: new Date(),
  }
]);

// Create indexes for better performance
db.transactions.createIndex({ "datetime": -1 });
db.transactions.createIndex({ "price": -1 });

print('Database initialized successfully');
