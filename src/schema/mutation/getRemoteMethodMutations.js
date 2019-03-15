
const _ = require('lodash');

const {
  mutationWithClientMutationId,
} = require('graphql-relay');

const promisify = require('promisify-node');
const { connectionFromPromisedArray } = require('graphql-relay');

const checkAccess = require('../acl');
const utils = require('../utils');

const allowedVerbs = ['post', 'del', 'put', 'patch', 'all'];

async function resolveHasMany(instance, values, model, relation) {
  const proms = [];
  const relationModel = relation.modelTo;
  for (const value of values) {
    const where = {
      [relation.keyTo]: instance[model.definition.idName() || 'id'],
    };
    if (value[relation.modelTo.definition.idName() || 'id']) {
      where[relation.modelTo.definition.idName() || 'id'] = value[relation.modelTo.definition.idName() || 'id'];
    }
    proms.push(relationModel.upsertWithWhere(where, value));
  }
  await Promise.all(proms);
}

async function resolveHasManyThrough(instance, values, relation) {
  const proms = [];
  for (const value of values) {
    if (value[relation.modelTo.definition.idName() || 'id']) {
      proms.push(instance[`__link__${relation.name}`](value.id));
    } else {
      proms.push(instance[relation.name].create(value));
    }
  }
  await Promise.all(proms);
}

async function resolveRelation(instance, values, model, relation) {
  const relationValues = values[relation.name];
  if (!relationValues) {
    return;
  }
  if (relation.type === 'hasMany' && !relation.modelThrough) {
    await resolveHasMany(instance, relationValues, model, relation);
  } else if (relation.type === 'hasMany' && relation.modelThrough) {
    await resolveHasManyThrough(instance, relationValues, relation);
  }
}

module.exports = function getRemoteMethodMutations(model) {
  const hooks = {};
  // console.log(model.app.remotes().execHooks)
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
        // console.log(model.app.remotes())
        const typeObj = utils.getRemoteMethodOutput(method);
        const acceptingParams = utils.getRemoteMethodInput(method, typeObj.list);
        const hookName = utils.getRemoteMethodQueryName(model, method);
        // console.log(hookName)

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
          mutateAndGetPayload: (args, context) => {
            const params = [];

            _.forEach(acceptingParams, (param, name) => {
              params.push(args[name]);
            });

            context.args = args;
            const modelId = args && args.data && args.data.id ? args.data.id : args.id;

            return checkAccess(context, model, method, modelId, args).then(async () => {
              const beforeErr = await utils.execHooks(model.app, model, args.data, 'before', method, context);
              if (beforeErr) {
                return Promise.reject(beforeErr);
              }

              const wrap = promisify(model[method.name]);

              let result;
              if (typeObj.list) {
                result = await connectionFromPromisedArray(wrap.apply(model, params), args, model);
              } else if (!method.returns || !method.returns.length) {
                // HACK to support mutation for loopback methods that do not return anything
                result = await wrap.apply(model, params).then(response => (response || {}));
              } else {
                result = await wrap.apply(model, params);

                if (method.name === 'create' || method.name === 'update') {
                  const relationProms = [];
                  for (const key of Object.keys(model.relations)) {
                    const relation = model.relations[key];
                    relationProms.push(resolveRelation(result, params[0], model, relation));
                  }
                  await Promise.all(relationProms);
                }
              }

              context.result = result;

              const afterErr = await utils.execHooks(model.app, model, args.data, 'after', method, context);
              if (afterErr) {
                return Promise.reject(afterErr);
              }

              return Promise.resolve(result);
            });
          },
        });
      }
    });
  }

  return hooks;
};
