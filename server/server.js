'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');

const app = loopback();
module.exports = app;

app.use(loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me',
}));

app.start = function() {
  // start the web server
  return app.listen(() => {
    app.emit('started');
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, (err) => {
  if (err) { throw err; }

  // start the server if `$ node server.js`
  if (require.main === module)        { app.start(); }
});
