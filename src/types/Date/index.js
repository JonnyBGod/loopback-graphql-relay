
const { GraphQLScalarType } = require('graphql');
const { GraphQLError } = require('graphql/error');
const { Kind } = require('graphql/language');

function coerceDate(value) {
  if (!(value instanceof Date)) value = new Date(value);
  if (isNaN(value.getTime())) throw new Error('Field error: value is an invalid Date');
  return value.toISOString();
}

module.exports = new GraphQLScalarType({
  name: 'Date',
  description: 'Date',
  serialize: coerceDate,
  parseValue: coerceDate,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Query error: Can only parse strings to dates but got a: ${ast.kind}`, [ast]);
    }
    const result = new Date(ast.value);
    if (isNaN(result.getTime())) {
      throw new GraphQLError(`Query error: Invalid date ${ast.value}`, [ast]);
    }
    if (ast.value !== result.toJSON() && ast.value !== result.toUTCString() && ast.value !== result.toString()) {
      throw new GraphQLError(`Query error: Invalid date format ${
        ast.value
      } , only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ or UTC or local UTC`, [ast]);
    }
    return result;
  },
});
