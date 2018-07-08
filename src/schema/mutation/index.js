
const _ = require('lodash');
const { GraphQLObjectType } = require('graphql');

const getRemoteMethods = require('./getRemoteMethodMutations');

module.exports = function (models) {
  const modelFields = {};
  _.forEach(models, (model) => {
    const fields = Object.assign({}, getRemoteMethods(model));

    if (_.size(fields) === 0) {
      return;
    }

    modelFields[model.modelName] = {
      resolve: () => ({}),
      type: new GraphQLObjectType({
        name: `${model.modelName}Mutations`,
        description: model.modelName,
        fields,
      }),
    };
  });

  return new GraphQLObjectType({
    name: 'Mutation',
    fields: modelFields,
  });
};
