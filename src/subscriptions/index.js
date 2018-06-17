
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

module.exports = function index(app, schema, opts) {
  const url = app.get('url') ? app.get('url').replace(/\/$/, '').replace('http', 'ws') : `ws://${app.get('host')}:${app.get('port')}`;

  app.use(opts.graphiqlPath || '/graphiql', graphiqlExpress({
    endpointURL: opts.path || '/graphql',
    subscriptionsEndpoint: `${url}/subscriptions`,
  }));

  app.use(opts.path || '/graphql', bodyParser.json(), graphqlExpress(req => ({
    schema,
    rootValue: global,
    graphiql: false,
    context: {
      app,
      req,
    },
    tracing: !!(opts.apollo && opts.apollo.apiKey),
    cacheControl: !!(opts.apollo && opts.apollo.apiKey),
  })));

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

  return app;
};
