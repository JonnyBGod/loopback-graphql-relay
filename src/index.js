
const _ = require('lodash');
const { Engine } = require('apollo-engine');
const { getSchema } = require('./schema/index');
const startSubscriptionServer = require('./subscriptions');
const patchChangeStream = require('./subscriptions/patchChangeStream');

const { graphqlExpress } = require('apollo-server-express');
const bodyParser = require('body-parser');


module.exports = function (app, options) {
  const models = app.models();

  _.forEach(models, (model) => {
    patchChangeStream(model);
  });

  const schema = getSchema(models, options);
  const { apollo } = options;
  const path = options.path || '/graphql';

  app.use(path, bodyParser.json(), graphqlExpress(req => ({
    schema,
    context: { app, req },
    tracing: true,
    cacheControl: true,
  })));


  if (apollo) {
    if (!apollo.apiKey) {
      throw new Error('Apollo engine api key is not defined');
    }

    const engine = new Engine({
      apiKey: apollo.apiKey,
    });

    engine.listen({
      port: apollo.graphqlPort || 2000,
      expressApp: app,
    });

    // const engine = new Engine({
    //   engineConfig: {
    //     apiKey: apollo.apiKey,
    //     logging: {
    //       level: apollo.debugLevel || 'DEBUG',
    //       // DEBUG, INFO, WARN or ERROR
    //     },
    //   },
    //   graphqlPort: apollo.graphqlPort || 2000,
    //   endpoint: path || '/graphql',
    //   dumpTraffic: true,
    // });
    //
    // engine.start();
    //
    // app.use(engine.expressMiddleware());
  }

  try {
    startSubscriptionServer(app, schema, options);
  } catch (ex) {
    console.log(ex);
  }
};
