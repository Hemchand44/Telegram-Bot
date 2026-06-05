const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { bot } = require('./bot');
const leadRoutes = require('./routes/leads');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/leads', leadRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Lead Bot Server chal raha hai ✅' });
});

// Webhook endpoint
app.post(`/bot${process.env.TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Webhook automatically set karo server start hone pe
  const RENDER_URL = process.env.RENDER_URL;
  if (RENDER_URL) {
    await bot.setWebHook(
      `${RENDER_URL}/bot${process.env.TELEGRAM_TOKEN}`
    );
    console.log('✅ Webhook set ho gaya!');
  }
});