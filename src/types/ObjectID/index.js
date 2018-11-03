const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { ObjectID } = require('bson-objectid');

module.exports = new GraphQLScalarType({
  name: 'ObjectID',
  description:
    'The `ObjectID` scalar type represents a [`BSON`](https://en.wikipedia.org/wiki/BSON) ID commonly used in `mongodb`.',
  serialize(_id) {
    if (_id instanceof ObjectID) {
      return _id.toHexString();
    } else if (typeof _id === 'string') {
      return _id;
    }
    throw new Error(`${Object.getPrototypeOf(_id).constructor.name} not convertible to `);
  },
  parseValue(_id) {
    if (typeof _id === 'string') {
      return ObjectID.createFromHexString(_id);
    }
    throw new Error(`${typeof _id} not convertible to ObjectID`);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ObjectID.createFromHexString(ast.value);
    }
    throw new Error(`${ast.kind} not convertible to ObjectID`);
  },
});
