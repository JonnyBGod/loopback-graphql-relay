
const _ = require('lodash');

const { GraphQLObjectType } = require('graphql');
const { getType } = require('../../types/type');
const getRemoteMethodQueries = require('./getRemoteMethodQueries');
const generateViewer = require('./viewer');

function generateModelFields(models) {
  const modelFields = {};
  _.forEach(models, (model) => {
    const fields = Object.assign(
      {},
      getRemoteMethodQueries(model),
    );

    if (_.size(fields) === 0) {
      return;
    }

    modelFields[model.modelName] = {
      resolve: () => ({}),
      type: new GraphQLObjectType({
        name: `${model.modelName}Queries`,
        description: model.modelName,
        fields,
      }),
    };
  });

  return modelFields;
}

module.exports = function index(models, options) {
  let baseFields = {
    node: getType('node'),
  };

  if (!options.disableViewer) {
    const viewer = generateViewer(models, options);

    if (viewer) {
      baseFields = {
        ...baseFields,
        viewer,
      };
    }
  }

  const fields = {
    ...baseFields,
    ...generateModelFields(models),
  };


  return new GraphQLObjectType({
    name: 'Query',
    fields,
  });
};
