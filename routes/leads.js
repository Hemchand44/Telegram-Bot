// routes/leads.js

const express = require('express');
const router = express.Router();
const { sendLeadNotification } = require('../bot');
const pool = require('../db');

// ========================
// NEW LEAD AAYA
// ========================
router.post('/new', async (req, res) => {

  const { name, phone, email, budget, source } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name aur phone required hai'
    });
  }

  try {
    // Database mein save karo
    const result = await pool.query(
      `INSERT INTO leads (name, phone, email, budget, source) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, phone, email, budget, source || 'Instagram Ad']
    );

    const savedLead = result.rows[0];

    // Telegram notification bhejo
    await sendLeadNotification(savedLead);

    res.json({
      success: true,
      message: 'Lead save ho gaya!',
      lead: savedLead
    });

  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================
// SAARE LEADS DEKHO
// ========================
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      total: result.rows.length,
      leads: result.rows
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================
// LEAD STATUS UPDATE KARO
// ========================
router.put('/status/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  // Allowed status
  const validStatus = ['new', 'contacted', 'interested', 'converted', 'rejected'];

  if (!validStatus.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status hona chahiye: ${validStatus.join(', ')}`
    });
  }

  try {
    const result = await pool.query(
      `UPDATE leads 
       SET status = $1, notes = $2 
       WHERE id = $3 
       RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead nahi mila'
      });
    }

    res.json({
      success: true,
      message: 'Status update ho gaya!',
      lead: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================
// AREY KE LEADS DEKHO
// ========================
router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads 
       WHERE DATE(created_at) = CURRENT_DATE
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      total_today: result.rows.length,
      leads: result.rows
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;