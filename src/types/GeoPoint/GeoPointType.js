
const { GraphQLObjectType, GraphQLFloat, GraphQLNonNull } = require('graphql');

const Type = new GraphQLObjectType({
  name: 'GeoPoint',
  fields: {
    lat: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.lat,
    },
    lng: {
      lng: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.lng,
    },
  },
});

module.exports = Type;
