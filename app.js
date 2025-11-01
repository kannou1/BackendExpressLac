// ===========================================================
// 🌐 app.js — Serveur Express + Socket.IO (temps réel)
// ===========================================================

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { connectToMongoDB } = require('./db/db');

// === Importation des routes ===
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/usersRouter');
const classeRoutes = require('./routes/classeRoutes');
const coursRoutes = require('./routes/coursRoutes');
const edtRoutes = require('./routes/emploiDuTempsRoutes');
const examenRoutes = require('./routes/examenRoutes');
const noteRoutes = require('./routes/noteRoutes');
const presenceRoutes = require('./routes/presenceRoutes');
const demandeRoutes = require('./routes/demandeRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// === Initialisation de l’app Express ===
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// === Montage des routes ===
app.use('/index', indexRouter);
app.use('/users', usersRouter);
app.use('/classes', classeRoutes);
app.use('/cours', coursRoutes);
app.use('/emploi', edtRoutes);
app.use('/examen', examenRoutes);
app.use('/note', noteRoutes);
app.use('/presence', presenceRoutes);
app.use('/demande', demandeRoutes);
app.use('/message', messageRoutes);
app.use('/notification', notificationRoutes);

// === Gestion des erreurs ===
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({ message: err.message });
});

// === Création du serveur HTTP ===
const server = http.createServer(app);

// ===========================================================
// 🔥 Configuration Socket.IO
// ===========================================================
const io = new Server(server, {
  cors: {
    origin: "*", // à restreindre en production
    methods: ["GET", "POST"],
  },
});

// ✅ Rendre Socket.IO accessible globalement
app.set("io", io);

// ===========================================================
// 🔌 Logique Socket.IO (Messages + Notifications temps réel)
// ===========================================================
io.on('connection', (socket) => {
  console.log('🟢 Nouvelle connexion socket:', socket.id);

  // Lorsqu’un utilisateur rejoint sa room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 Utilisateur ${userId} a rejoint sa room.`);
  });

  // === 💬 Message temps réel ===
  socket.on('sendMessage', (data) => {
    console.log('📩 Nouveau message reçu via Socket:', data);

    // Envoi du message au destinataire
    io.to(data.receiverId).emit('receiveMessage', {
      senderId: data.senderId,
      text: data.text,
      date: new Date(),
    });
  });

  // === 🔔 Notification temps réel ===
  socket.on('sendNotification', (notif) => {
    console.log('🔔 Nouvelle notification envoyée:', notif);

    io.to(notif.userId).emit('receiveNotification', {
      message: notif.message,
      type: notif.type || "systeme",
      date: new Date(),
    });
  });

  // === Déconnexion ===
  socket.on('disconnect', () => {
    console.log('🔴 Déconnexion socket:', socket.id);
  });
});

// ===========================================================
// 🚀 Lancement du serveur
// ===========================================================
server.listen(process.env.PORT || 5000, () => {
  connectToMongoDB();
  console.log('✅ Serveur HTTP & Socket.IO lancé sur le port 5000');
});
module.exports.io = io;
