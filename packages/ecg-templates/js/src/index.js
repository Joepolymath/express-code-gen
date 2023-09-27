const app = require('./setup/express.js');
const logging = require('./setup/logging.js');
const database = require('./setup/database.js');

logging();
database();

module.exports = app;
