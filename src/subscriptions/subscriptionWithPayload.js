
const _ = require('lodash');
const { MQTTPubSub } = require('@blueeast/graphql-mqtt-subscriptions');
const { withFilter } = require('graphql-subscriptions');
const { getType } = require('../types/type');

const {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
} = require('graphql');

const loopbackPubSub = new MQTTPubSub();

function resolveMaybeThunk(maybeThunk) {
  return typeof maybeThunk === 'function' ? maybeThunk() : maybeThunk;
}

function defaultGetPayload(obj) {
  return (obj && obj.object) ? obj.object : null;
}

module.exports = function subscriptionWithPayload({ modelName, subscribeAndGetPayload = defaultGetPayload, model }) {
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
    resolve(payload, args, context, info) {
      const clientSubscriptionId = (payload) ? payload.subscriptionId : null;

      const object = (payload) ? payload.object : null;
      let where = null;
      let type = null;
      let target = null;
      if (object) {
        where = (payload) ? payload.object.where : null;
        type = (payload) ? payload.object.type : null;
        target = (payload) ? payload.object.target : null;
      }

      return Promise.resolve(subscribeAndGetPayload(payload, args, context, info)).then(resPayload => (
        {
          clientSubscriptionId, where, type, target, object: resPayload.data,
        }
      ));
    },
    subscribe: withFilter((payload, variables) => loopbackPubSub.asyncIterator(model, variables.input), () => true),
  };
};
