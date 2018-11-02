
const _ = require('lodash');
const { ApolloServer } = require('apollo-server-express');
const { getSchema } = require('./schema/index');
const { execute, subscribe } = require('graphql');
const http = require('http');

const patchChangeStream = require('./subscriptions/patchChangeStream');

module.exports = function index(app, options) {
  const models = app.models();

  if (!options.subscriptionServer) {
    options.subscriptionServer = {};
  }

  if (options.subscriptionServer.disabled !== true) {
    _.forEach(models, (model) => {
      patchChangeStream(model);
    });
  }

  const schema = getSchema(models, options);

  const validateToken = authToken => new Promise((resolve, reject) => {
    let accessToken = '';
    if (options.subscriptionServer.AccessTokenModel) {
      accessToken = app.models[options.subscriptionServer.AccessTokenModel];
    } else {
      accessToken = app.models.AccessToken;
    }

    accessToken.resolve(authToken, (err, token) => {
      if (token) {
        resolve();
      } else reject(err);
    });
  });

  function wsConnect(connectionParams) {
    if (options.subscriptionServer.auth && connectionParams.authToken) {
      return validateToken(connectionParams.authToken).then(() => true).catch(() => false);
    } else if (!options.subscriptionServer.auth) return true;
    return false;
  }

  app.apollo = new ApolloServer({
    schema,
    context: ({ req, connection }) => ({ app, connection, req }),
    tracing: true,
    cacheControl: { defaultMaxAge: 5 },
    // persistedQueries: {
    //   cache: new MemcachedCache(
    //     ['memcached-server-1', 'memcached-server-2', 'memcached-server-3'],
    //     { retries: 10, retry: 10000 }, // Options
    //   ),
    // },
    engine: options.apiKey || app.get('apolloEngineKey') ? {
      apiKey: options.apiKey || app.get('apolloEngineKey'),
    } : false,
    subscriptions: options.subscriptionServer.disabled !== true ? {
      execute,
      subscribe,
      onConnect: wsConnect,
      path: options.path || '/graphql',
    } : false,
  });
  app.apollo.applyMiddleware({ app });

  if (options.subscriptionServer.disabled !== true) {
    const subsServer = http.createServer(app);
    app.apollo.installSubscriptionHandlers(subsServer);
    app.listen = function listen(port, cb) {
      if (typeof port === 'function' && typeof cb === 'undefined') {
        cb = port;
        port = app.get('port');
      }
      return subsServer.listen(port, cb);
    };
  }
};
