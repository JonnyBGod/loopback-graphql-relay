
const _ = require('lodash');

const {
  mutationWithClientMutationId,
} = require('graphql-relay');

const promisify = require('promisify-node');
const { connectionFromPromisedArray } = require('graphql-relay');

const utils = require('../utils');
// const { getType } = require('../../types/type');

const allowedVerbs = ['post', 'del', 'put', 'patch', 'all'];

module.exports = function getRemoteMethodMutations(model) {
  const hooks = {};

  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().forEach((method) => {
      if (method.shared && method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {
        if (!utils.isRemoteMethodAllowed(method, allowedVerbs)) {
          return;
        }

        // TODO: Add support for static methods
        if (method.isStatic === false) {
          return;
        }

        const typeObj = utils.getRemoteMethodOutput(method);
        const acceptingParams = utils.getRemoteMethodInput(method, typeObj.list);
        const hookName = utils.getRemoteMethodQueryName(model, method);

        hooks[hookName] = mutationWithClientMutationId({
          name: hookName,
          description: method.description,
          meta: { relation: true },
          inputFields: acceptingParams,
          outputFields: {
            obj: {
              type: typeObj.type,
              resolve: o => o,
            },
          },
          mutateAndGetPayload: (args) => {
            const params = [];

            _.forEach(acceptingParams, (param, name) => {
              params.push(args[name]);
            });
            const wrap = promisify(model[method.name]);

            if (typeObj.list) {
              return connectionFromPromisedArray(wrap.apply(model, params), args, model);
            }

            // HACK to support mutation for loopback methods that do not return anything
            if (!method.returns || !method.returns.length) {
              return wrap.apply(model, params).then(response => (response || {}));
            }

            return wrap.apply(model, params);
          },
        });
      }
    });
  }

  return hooks;
};
