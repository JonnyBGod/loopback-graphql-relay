
const _ = require('lodash');

const promisify = require('promisify-node');
const utils = require('../utils');
const { connectionFromPromisedArray } = require('../../db/resolveConnection');

const checkAccess = require('../acl');

const allowedVerbs = ['get', 'head'];
const defaultFindMethods = ['find'];

module.exports = function getRemoteMethodQueries(model) {
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

        hooks[hookName] = {
          name: hookName,
          description: method.description,
          meta: { relation: true },
          args: acceptingParams,
          type: typeObj.type,
          resolve: (__, args, context) => {
            let params = [];

            _.forEach(acceptingParams, (param, name) => {
              params.push(args[name]);
            });

            context.args = args;

            return checkAccess(context, model, method, args && args.id, args).then(async () => {
              const beforeErr = await utils.execHooks(model.app, model, args.data, 'before', method, context);
              if (beforeErr) {
                return Promise.reject(beforeErr);
              }

              const wrap = promisify(model[method.name]);
              let result;

              if (typeObj.list) {
                if (defaultFindMethods.indexOf(method.name) !== -1 || method.returns[0].type.indexOf('any') !== -1) {
                  params = [];
                  _.forEach(method.accepts, (accept) => {
                    params.push(args[accept.arg]);
                  });
                }

                result = await connectionFromPromisedArray(wrap.apply(model, params), args, model);
              } else {
                result = await wrap.apply(model, params);
              }

              context.result = result;

              const afterErr = await utils.execHooks(model.app, model, args.data, 'after', method, context);
              if (afterErr) {
                return Promise.reject(afterErr);
              }

              return result;
            });
          },
        };
      }
    });
  }

  return hooks;
};
