const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Transaction = require('./models/Transaction.js');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ body: 'test ok' });
});

const path = require('path');
// Serve React build files (only needed for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

const port = 4040;
app.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
  console.log(` API endpoints available at http://localhost:${port}/api`);
});

app.post('/api/transaction', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const { name, description, datetime, price } = req.body;
    const transaction = await Transaction.create({
      name,
      description,
      datetime,
      price,
    });
    res.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});
//5BGBtZuFeDIqsqnA - password for database
