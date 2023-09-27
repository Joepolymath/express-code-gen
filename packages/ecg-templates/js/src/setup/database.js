const mongoose = require('mongoose');
const Bluebird = require('bluebird');

const { DBURL } = require('../config/env.js');

const database = () => {
  let db;

  mongoose.Promise = Bluebird;

  const options = {
    useNewUrlParser: true,
    socketTimeoutMS: 0,
    keepAlive: true,
  };

  mongoose.connect(DBURL, options);
  db = mongoose.connection;
  db.on('error', (err) => {
    console.error('Error connecting to database.', err);
  });
  db.once('connected', () => {
    console.log('Database Connection is Successful');
  });
  db.once('disconnected', () => {
    console.info('Database Disconnected');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close((err) => {
      console.info('Database Connection Closed Due to App Termination');
      process.exit(err ? 1 : 0);
    });
  });
};

module.exports = database;
