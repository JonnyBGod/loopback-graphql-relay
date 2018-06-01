
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

module.exports = function index(app, schema, opts) {
  const PORT = 3000;
  const url = app.get('url') ? app.get('url').replace(/\/$/, '').replace('http', 'ws') : `ws://${app.get('host')}:${app.get('port')}`;

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `${url}/subscriptions`,
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
    // eslint-disable-next-line no-console
    console.log(`GraphQL server running on port ${PORT}.`);
  });

  const subscriptionOpts = opts.subscriptionServer || {};

  const disable = subscriptionOpts.disable || false;

  if (disable === true) {
    return undefined;
  }

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
  app.on('started', (lbServer) => {
    SubscriptionServer.create({
      schema, execute, subscribe, onConnect: wsConnect,
    }, { server: lbServer, path: opts.path || '/graphql' });
  });

  return server;
};
