// bot.js
const schedule = require('node-schedule');
const TelegramBot = require('node-telegram-bot-api');
const pool = require('./db');
require('dotenv').config();


// polling sirf local mein, 
// production mein band
const isProduction = process.env.NODE_ENV === 'production';

const bot = new TelegramBot(
  process.env.TELEGRAM_TOKEN,
  { polling: !isProduction }  // ✅ Fix
);

// ========================
// LEAD NOTIFICATION
// ========================
async function sendLeadNotification(lead) {
  const message = `
🚨 *New Lead Alert!*

👤 *Name:* ${lead.name}
📞 *Phone:* ${lead.phone}
📧 *Email:* ${lead.email || 'Not provided'}
💰 *Budget:* ${lead.budget || 'Not mentioned'}
📍 *Source:* ${lead.source}
🆔 *Lead ID:* #${lead.id}
🕐 *Time:* ${new Date().toLocaleString('en-IN')}

_Jaldi contact karo! 🔥_
  `;

  await bot.sendMessage(process.env.CHAT_ID, message, {
    parse_mode: 'Markdown'
  });
}

schedule.scheduleJob('0 21 * * *', async () => {
  
  const today = await pool.query(
    `SELECT COUNT(*) FROM leads WHERE DATE(created_at) = CURRENT_DATE`
  );
  
  const converted = await pool.query(
    `SELECT COUNT(*) FROM leads 
     WHERE DATE(created_at) = CURRENT_DATE 
     AND status = 'converted'`
  );

  const message = `
🌙 *Daily Lead Summary*
📅 ${new Date().toLocaleDateString('en-IN')}

📥 Aaj Aaye: *${today.rows[0].count}* leads
✅ Convert Hue: *${converted.rows[0].count}*

_Kal phir mehnat karte hain! 💪_
  `;

  bot.sendMessage(process.env.CHAT_ID, message, { parse_mode: 'Markdown' });
});


// ========================
// /start COMMAND
// ========================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `
👋 *Lead Manager Bot*

Commands:
/leads - Aaj ke saare leads
/all - Total leads count
/new - New leads jinhe contact nahi kiya
/help - Help

_Powered by Your Agency_ 🚀
  `, { parse_mode: 'Markdown' });
});

// ========================
// /leads COMMAND - AAJ KE LEADS
// ========================
bot.onText(/\/leads/, async (msg) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads 
       WHERE DATE(created_at) = CURRENT_DATE
       ORDER BY created_at DESC`
    );

    if (result.rows.length === 0) {
      return bot.sendMessage(msg.chat.id, '😔 Aaj koi lead nahi aaya abhi tak.');
    }

    let message = `📋 *Aaj Ke Leads (${result.rows.length})*\n\n`;

    result.rows.forEach((lead, index) => {
      message += `${index + 1}. *${lead.name}*\n`;
      message += `   📞 ${lead.phone}\n`;
      message += `   💰 ${lead.budget || 'N/A'}\n`;
      message += `   🔖 Status: ${lead.status}\n\n`;
    });

    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });

  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Kuch error aaya: ' + error.message);
  }
});

// ========================
// /all COMMAND - TOTAL COUNT
// ========================
bot.onText(/\/all/, async (msg) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM leads');
    const newLeads = await pool.query(`SELECT COUNT(*) FROM leads WHERE status = 'new'`);
    const converted = await pool.query(`SELECT COUNT(*) FROM leads WHERE status = 'converted'`);

    const message = `
📊 *Lead Summary*

📥 Total Leads: *${total.rows[0].count}*
🔴 New (Uncontacted): *${newLeads.rows[0].count}*
✅ Converted: *${converted.rows[0].count}*
    `;

    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });

  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + error.message);
  }
});

// ========================
// /new COMMAND - SIRF NEW LEADS
// ========================
bot.onText(/\/new/, async (msg) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads WHERE status = 'new' ORDER BY created_at DESC LIMIT 5`
    );

    if (result.rows.length === 0) {
      return bot.sendMessage(msg.chat.id, '✅ Koi pending lead nahi hai!');
    }

    let message = `🔴 *New Leads (Contact Pending)*\n\n`;

    result.rows.forEach((lead) => {
      message += `🆔 #${lead.id} - *${lead.name}*\n`;
      message += `📞 ${lead.phone}\n`;
      message += `📅 ${new Date(lead.created_at).toLocaleDateString('en-IN')}\n\n`;
    });

    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });

  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + error.message);
  }
});

module.exports = { sendLeadNotification };