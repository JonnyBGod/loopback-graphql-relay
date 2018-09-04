
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');


module.exports = function index(app, schema, opts) {
  const subscriptionOpts = opts.subscriptionServer || {};

  app.use('/graphql', bodyParser.json(), graphqlExpress({
    schema,
  }));

  if (!subscriptionOpts.graphiqlHost) subscriptionOpts.graphiqlHost = 'localhost';
  if (subscriptionOpts.ssl) subscriptionOpts.wsEndpointURL = `wss://${subscriptionOpts.graphiqlHost}:${WS_PORT}/subscriptions`;
  else subscriptionOpts.wsEndpointURL = `ws://${subscriptionOpts.graphiqlHost}:${WS_PORT}/subscriptions`;

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
      schema,
      execute,
      subscribe,
      onConnect: wsConnect,
    }, { server: lbServer, path: opts.path || '/graphql' });
  });

  return app;
};
