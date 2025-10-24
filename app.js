var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const http = require('http'); //1 importation du module http

require('dotenv').config();

const { connectToMongoDB } = require('./db/db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/usersRouter');
const classeRoutes = require('./routes/classeRoutes');
const coursRoutes = require('./routes/coursRoutes');
const edtRoutes = require('./routes/emploiDuTempsRoutes');
const examenRoutes = require('./routes/examenRoutes');
const noteRoutes = require('./routes/noteRoutes');
const presenceRoutes = require('./routes/presenceRoutes');
const demandeRoutes = require('./routes/demandeRoutes');
const stageRequestRoutes = require('./routes/stageRequestRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');



var app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/index', indexRouter);
app.use('/users', usersRouter);
app.use('/classes', classeRoutes);
app.use('/cours', coursRoutes);
app.use('/emploi', edtRoutes);
app.use('/examen', examenRoutes);
app.use('/note', noteRoutes);
app.use('/presence', presenceRoutes);
app.use('/demande', demandeRoutes);
app.use('/stageRequest', stageRequestRoutes);
app.use('/message', messageRoutes);
app.use('/notification', notificationRoutes);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500)
  res.json('error');
});

const server = http.createServer(app); //2 creation du serveur

//3 le serveur ecoute sur le port 5000
server.listen(process.env.Port, () => {
  connectToMongoDB();
  console.log('Server is running on port 5000');
});