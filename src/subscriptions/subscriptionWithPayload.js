const _ = require('lodash');
const { withFilter } = require('apollo-server-express');
const applyFilter = require('loopback-filters');
const { getType } = require('../types/type');
const checkAccess = require('../schema/acl');

const utils = require('../db/utils');

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
  const idName = (model && typeof model.getIdName !== 'undefined') ? model.getIdName() : 'id';
  const method = model.sharedClass.methods().filter(m => m.name === 'findOne');

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
      { target: { type: getType('ID') } },
      { cursor: { type: getType('String') } },
      { clientSubscriptionId: { type: getType('Int') } },
    ),
  });

  return {
    type: outputType,
    args: {
      input: { type: new GraphQLNonNull(inputType) },
    },
    resolve(payload, args) {
      return Promise.resolve(Object.assign({}, payload, {
        cursor: utils.idToCursor(payload.object[idName]),
        clientSubscriptionId: args.input.clientSubscriptionId,
      }));
    },
    subscribe: withFilter(
      () => options.subscriptionServer.pubsub.asyncIterator(model.name),
      (payload, variables, context) => new Promise((resolve) => {
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
          const filtered = applyFilter([payload.object], variables.input.options);
          return resolve(filtered.length > 0);
        }
        return resolve(true);
      }).then(() => checkAccess(context, model, method[0], payload.object && payload.object.id, payload.object).then(() => true)),
    ),
  };
};
