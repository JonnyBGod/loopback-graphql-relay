
const _ = require('lodash');
const { ApolloServer, PubSub } = require('apollo-server-express');
const { getSchema } = require('./schema/index');
const { execute, subscribe } = require('graphql');
const http = require('http');
const https = require('https');

const patchModelForSubscriptions = require('./subscriptions/patchModelForSubscriptions');

module.exports = function index(app, options) {
  let models = app.models();

  if (options.ignoreModels && options.ignoreModels.length > 0) {
    models = models.filter(m => options.ignoreModels.indexOf(m.modelName) === -1);
  }

  if (!options.subscriptionServer) {
    options.subscriptionServer = {};
  }

  if (options.subscriptionServer.disabled !== true) {
    options.subscriptionServer.pubsub = options.subscriptionServer.pubsub || new PubSub();

    _.forEach(
      models
        .filter(m => typeof m.getIdName !== 'undefined')
        .filter(m => typeof m.config === 'undefined' || m.config.public),
      (model) => {
        patchModelForSubscriptions(model, options);
      },
    );
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
        resolve({ accessToken: token });
      } else reject(err);
    });
  });

  function wsConnect(connectionParams) {
    if (options.subscriptionServer.auth && connectionParams.authToken) {
      return validateToken(connectionParams.authToken).catch(() => false);
    } else if (!options.subscriptionServer.auth) return true;
    return false;
  }

  const config = {
    schema,
    context: async ({ req, res, connection }) => {
      if (connection) {
        return {
          app, req, res, accessToken: connection.context.accessToken,
        };
      }
      return {
        app, req, res, accessToken: req.accessToken,
      };
    },
    tracing: true,
    cacheControl: { defaultMaxAge: 5 },
    engine: options.apiKey || app.get('apolloEngineKey') ? {
      apiKey: options.apiKey || app.get('apolloEngineKey'),
    } : false,
    subscriptions: options.subscriptionServer.disabled !== true ? {
      execute,
      subscribe,
      onConnect: wsConnect,
      path: options.path || '/graphql',
    } : false,
  };

  if (options.persistedQueries) {
    config.persistedQueries = options.persistedQueries;
  }

  app.apollo = new ApolloServer(config);
  app.apollo.applyMiddleware({ app });

  if (options.subscriptionServer.disabled !== true) {
    let subsServer;
    if (options.subscriptionServer.https) {
      subsServer = https.createServer(options.subscriptionServer.https, app);
    } else {
      subsServer = http.createServer(app);
    }
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
