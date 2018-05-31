
const { createServer } = require('http');
const https = require('https');
const fs = require('fs');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

module.exports = function (app, schema, opts) {
  const PORT = 3000;

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
  }));

  app.use('/graphql', bodyParser.json(), graphqlExpress(req => ({
    schema,
    rootValue: global,
    graphiql: false,
    context: {
      app,
      req,
    },
  })));

  const server = createServer(app);
  server.listen(PORT, () => {
    SubscriptionServer.create(
      { execute, subscribe, schema },
      { server, path: '/subscriptions' },
    );
    console.log(`GraphQL server running on port ${PORT}.`);
  });

  const subscriptionOpts = opts.subscriptionServer || {};

  const disable = subscriptionOpts.disable || false;

  if (disable === true) {
    return undefined;
  }

  const WS_PORT = subscriptionOpts.port || 5000;
  // const options = subscriptionOpts.options || {};
  // const socketOptions = subscriptionOpts.socketOptions || {};

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
    websocketServer = createServer((request, response) => {
      response.writeHead(404);
      response.end();
    });
  }

  websocketServer.listen(WS_PORT, () => console.log(`Websocket Server is now running on http(s)://localhost:${WS_PORT}`));

  const validateToken = authToken => new Promise((resolve, reject) => {
    let accessToken = '';
    if (subscriptionOpts.AccessTokenModel) { accessToken = app.models[subscriptionOpts.AccessTokenModel]; } else { accessToken = app.models.AccessToken; }

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

  SubscriptionServer.create({
    schema, execute, subscribe, onConnect: wsConnect,
  }, { server: websocketServer, path: '/' });

  return server;
};
