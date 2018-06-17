
const _ = require('lodash');
const { ApolloEngine } = require('apollo-engine');
const { getSchema } = require('./schema/index');
const startSubscriptionServer = require('./subscriptions');
const patchChangeStream = require('./subscriptions/patchChangeStream');

module.exports = function index(app, options) {
  const { apollo } = options;

  if (apollo) {
    if (!apollo.apiKey) {
      throw new Error('Apollo engine api key is not defined');
    }
    const engine = new ApolloEngine({
      apiKey: apollo.apiKey,
      logging: {
        level: apollo.debugLevel || 'DEBUG',
        // DEBUG, INFO, WARN or ERROR
      },
    });

    app.on('started', () => {
      engine.listen({
        port: app.get('port'),
        expressApp: app,
        // GraphQL endpoint suffix - '/graphql' by default
        graphqlPaths: [options.path || '/graphql'],
        frontends: [{
          overrideGraphqlResponseHeaders: {
            'Access-Control-Allow-Origin': '*',
          },
        }],
        origins: [{
          supportsBatch: true,
        }],
      });
    });
  }

  const models = app.models();

  _.forEach(models, (model) => {
    patchChangeStream(model);
  });

  const schema = getSchema(models, options);

  try {
    startSubscriptionServer(app, schema, options);
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.error(ex);
  }
};
