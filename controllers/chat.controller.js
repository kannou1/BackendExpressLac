// backend/controllers/chat.controller.js
const axios = require('axios');
const Conversation = require('../models/conversation'); // your conversation schema

exports.chat = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'Missing fields' });

    // 1️⃣ Call the AI service
    const aiResponse = await axios.post('http://localhost:7000/chat', {
      message
    });

    const answer = aiResponse.data.answer || aiResponse.data; // depending on your ai-service response

    // 2️⃣ Save conversation in DB
    await Conversation.create({
      userId,
      message,
      response: answer,
      createdAt: new Date()
    });

    // 3️⃣ Return AI response to frontend
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
