
const { GraphQLFloat, GraphQLNonNull, GraphQLInputObjectType } = require('graphql');

const InputType = new GraphQLInputObjectType({
  name: 'GeoPointInput',
  fields: {
    lat: { type: new GraphQLNonNull(GraphQLFloat) },
    lng: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

module.exports = InputType;
