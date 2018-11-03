const _ = require('lodash');
const { withFilter } = require('apollo-server-express');
const applyFilter = require('loopback-filters');
const { getType } = require('../types/type');

const {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
} = require('graphql');

function resolveMaybeThunk(maybeThunk) {
  return typeof maybeThunk === 'function' ? maybeThunk() : maybeThunk;
}


module.exports = function subscriptionWithPayload({
  modelName,
  model,
  options,
}) {
  const inputType = new GraphQLInputObjectType({
    name: `${modelName}SubscriptionInput`,
    fields: () => Object.assign(
      { options: { type: getType('JSON') } },
      { create: { type: getType('Boolean') } },
      { update: { type: getType('Boolean') } },
      { remove: { type: getType('Boolean') } },
      { clientSubscriptionId: { type: getType('Int') } },
    ),
  });

  const outputFields = {};
  const modelFieldName = _.camelCase(_.lowerCase(modelName));
  outputFields[modelFieldName] = {
    type: getType(modelName),
    resolve: o => o.object,
  };

  const outputType = new GraphQLObjectType({
    name: `${modelName}SubscriptionPayload`,
    fields: () => Object.assign(
      {},
      resolveMaybeThunk(outputFields),
      { where: { type: getType('JSON') } },
      { type: { type: getType('String') } },
      { target: { type: getType('String') } },
      { clientSubscriptionId: { type: getType('Int') } },
    ),
  });

  return {
    type: outputType,
    args: {
      input: { type: new GraphQLNonNull(inputType) },
    },
    resolve(payload, args) {
      return Promise.resolve({
        clientSubscriptionId: args.input.clientSubscriptionId,
        where: payload.where,
        type: payload.type,
        target: payload.target,
        object: payload.data,
      });
    },
    subscribe: withFilter(
      () => options.subscriptionServer.pubsub.asyncIterator(model.name),
      (payload, variables) => new Promise((resolve) => {
        if (variables.create && payload.type !== 'create') {
          return resolve(false);
        }
        if (variables.update && payload.type !== 'update') {
          return resolve(false);
        }
        if (variables.remove && payload.type !== 'remove') {
          return resolve(false);
        }

        if (variables.input && variables.input.options) {
          const filtered = applyFilter([payload.data], variables.input.options);
          return resolve(filtered.length > 0);
        }
        return resolve(true);
      }),
    ),
  };
};
