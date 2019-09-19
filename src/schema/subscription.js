const _ = require('lodash');
const { GraphQLObjectType } = require('graphql');
const subWithPayload = require('../subscriptions/subscriptionWithPayload');

function addModel(model, options) {
  const fields = {};
  const modelName = `${model.modelName}`;

  const subscriptionWithPayload = subWithPayload({
    modelName,
    model,
    options,
  });

  fields[modelName] = subscriptionWithPayload;

  return fields;
}

module.exports = function subscriptions(models, options) {
  const fields = {};
  _.forEach(models.filter(m => typeof m.config === 'undefined' || m.config.public), (model) => {
    if (!model.shared) {
      return;
    }

    Object.assign(fields, addModel(model, options));
  });

  return new GraphQLObjectType({
    name: options.subscriptionServer.typeName || 'Subscription',
    fields,
  });
};
