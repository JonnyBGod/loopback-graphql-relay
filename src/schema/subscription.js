
const _ = require('lodash');
const { GraphQLObjectType } = require('graphql');
const { getType } = require('../types/type');
const subWithPayload = require('../subscriptions/subscriptionWithPayload');

function addModel(model) {
  const fields = {};
  const modelName = `${model.modelName}`;

  const outputFields = {
    obj: {
      type: getType(modelName),
      resolve: o => o,
    },
  };

  const subscriptionWithPayload = subWithPayload({
    modelName,
    outputFields,
    model,
  });

  fields[modelName] = subscriptionWithPayload;

  return fields;
}

module.exports = function (models) {
  const fields = {};
  _.forEach(models, (model) => {
    if (!model.shared) {
      return;
    }

    Object.assign(fields, addModel(model));
  });

  return new GraphQLObjectType({
    name: 'Subscription',
    fields,
  });
};
