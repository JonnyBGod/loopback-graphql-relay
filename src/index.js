
const _ = require('lodash');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { getSchema } = require('./schema/index');
const bodyParser = require('body-parser');

const startSubscriptionServer = require('./subscriptions');
const patchChangeStream = require('./subscriptions/patchChangeStream');

module.exports = function index(app, options) {
  const models = app.models();

  _.forEach(models, (model) => {
    patchChangeStream(model);
  });

  const schema = getSchema(models, options);

  const url = app.get('url') ? app.get('url').replace(/\/$/, '').replace('http', 'ws') : `ws://${app.get('host')}:${app.get('port')}`;

  app.use(options.path || '/graphql', bodyParser.json(), graphqlExpress(req => ({
    schema,
    rootValue: global,
    graphiql: false,
    context: {
      app,
      req,
    },
    tracing: true,
    cacheControl: true,
  })));

  app.use(options.graphiqlPath || '/graphiql', graphiqlExpress({
    endpointURL: options.path || '/graphql',
    subscriptionsEndpoint: `${url}/subscriptions`,
  }));

  try {
    startSubscriptionServer(app, schema, options);
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.error(ex);
  }
};
