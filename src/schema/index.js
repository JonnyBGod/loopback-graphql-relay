
const { GraphQLSchema } = require('graphql');
const getQuery = require('./query');
const getMutation = require('./mutation');
const getSubscription = require('./subscription');
const getTypes = require('../types');

function getSchema(models, options) {
  getTypes(models);

  const items = {
    query: getQuery(models, options),
    mutation: getMutation(models),
  };

  if (options && options.subscriptionServer &&
      options.subscriptionServer.disable !== true) {
    items.subscription = getSubscription(models);
  }

  const schema = new GraphQLSchema(items);

  return schema;
}

module.exports = {
  getSchema,
};
