const Conversation = require("../models/Conversation");
const { askAI } = require("../services/aiClient");
const Exam = require("../models/examenSchema");
const Certification = require("../models/certificationSchema");

exports.chat = async (req, res) => {
  const user = req.user;
  const { message } = req.body;

  let answer = null;
  let systemPrompt = "";

  // 1️⃣ User data questions
  if (message.toLowerCase().includes("next exam")) {
    const exam = await Exam.findOne({ user: user._id }).sort("date");
    systemPrompt = `User exam data: ${JSON.stringify(exam)}`;
  }

  // 2️⃣ Certification questions
  if (message.toLowerCase().includes("ejpt")) {
    const cert = await Certification.findOne({ name: /ejpt/i });
    systemPrompt = `
OFFICIAL DATA:
${JSON.stringify(cert, null, 2)}
Add study plan and tips.
`;
  }

  // 3️⃣ Call AI
  answer = await askAI(systemPrompt, message);

  // 4️⃣ Fallback if AI down
  if (!answer) {
    answer = "AI service unavailable. Showing raw data instead.";
  }

  // 5️⃣ Save conversation
  let convo = await Conversation.findOne({ user: user._id });
  if (!convo) convo = new Conversation({ user: user._id, messages: [] });

  convo.messages.push(
    { role: "user", content: message },
    { role: "assistant", content: answer }
  );

  await convo.save();

  res.json({ answer });
};
