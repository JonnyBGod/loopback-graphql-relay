
const _ = require('lodash');
const utils = require('./utils');

function connectionFromArray(obj, args, model) {
  const idName = (model && model.getIdName()) ? model.getIdName() : 'id';

  const res = {
    totalCount: obj.count,

    edges: _.map(obj.list, node => ({
      cursor: utils.idToCursor(node[idName]),
      node,
    })),

    list: obj.list,

    pageInfo: {
      startCursor: null,
      endCursor: null,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };

  if (obj.count > 0) {
    if (obj.list.length > 0) {
      res.pageInfo.startCursor = utils.idToCursor(obj.list[0][idName]);
      res.pageInfo.endCursor = utils.idToCursor(obj.list[obj.list.length - 1][idName]);
    }
    res.pageInfo.hasNextPage = Boolean(args.first && obj.count > args.first);
    res.pageInfo.hasPreviousPage = Boolean(args.last && obj.count > args.last);
  }

  return res;
}

function connectionFromPromisedArray(dataPromise, args) {
  return dataPromise.then(data => connectionFromArray(data, args));
}

module.exports = {
  connectionFromArray,
  connectionFromPromisedArray,
};
