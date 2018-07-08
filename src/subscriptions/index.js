
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

const bodyParser = require('body-parser');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const { createServer } = require('http');
const https = require('https');
const fs = require('fs');

module.exports = function (app, schema, opts) {
  const subscriptionOpts = opts.subscriptionServer || {};
  const WS_PORT = subscriptionOpts.port || 5000;

  const validateToken = authToken => new Promise((resolve, reject) => {
    let accessToken = '';
    if (subscriptionOpts.AccessTokenModel) {
      accessToken = app.models[subscriptionOpts.AccessTokenModel];
    } else { accessToken = app.models.AccessToken; }

    accessToken.resolve(authToken, (err, token) => {
      if (token) {
        resolve();
      } else reject();
    });
  });

  function wsConnect(connectionParams) {
    if (subscriptionOpts.auth && connectionParams.authToken) {
      return validateToken(connectionParams.authToken).then(() => true).catch(() => false);
    } else if (!subscriptionOpts.auth) return true;
    return false;
  }

  app.use('/graphql', bodyParser.json(), graphqlExpress({
    schema,
  }));

  if (!subscriptionOpts.graphiqlHost) subscriptionOpts.graphiqlHost = 'localhost';
  if (subscriptionOpts.ssl) subscriptionOpts.wsEndpointURL = `wss://${subscriptionOpts.graphiqlHost}:${WS_PORT}/subscriptions`;
  else subscriptionOpts.wsEndpointURL = `ws://${subscriptionOpts.graphiqlHost}:${WS_PORT}/subscriptions`;

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: subscriptionOpts.wsEndpointURL,
  }));

  let websocketServer = '';
  if (subscriptionOpts.ssl) {
    const ssl = {
      key: fs.readFileSync(subscriptionOpts.keyPath),
      cert: fs.readFileSync(subscriptionOpts.certPath),
    };
    websocketServer = https.createServer(ssl, (request, response) => {
      response.writeHead(404);
      response.end();
    });
  } else {
    websocketServer = createServer(app);
  }

  websocketServer.listen(WS_PORT, () => {
    console.log(`Apollo Server is now running on http://localhost:${WS_PORT}`);
    // Set up the WebSocket for handling GraphQL subscriptions
    new SubscriptionServer({ // eslint-disable-line
      execute,
      subscribe,
      schema,
      onConnect: wsConnect,
    }, {
      server: websocketServer,
      path: '/subscriptions',
    });
  });

  return websocketServer;
};
