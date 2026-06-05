// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { bot } = require('./bot');
const leadRoutes = require('./routes/leads');

const app = express();

// Middleware
app.use(cors({
  origin: '*'  // Koi bhi domain se request allow karo
}));

app.use(express.json());

// Routes
app.use('/api/leads', leadRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Lead Bot Server chal raha hai ✅' });
});


// Webhook endpoint
app.post(`/bot${process.env.TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Server start karo
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});