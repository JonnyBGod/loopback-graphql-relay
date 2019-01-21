
const _ = require('lodash');
const waterfall = require('async/waterfall');

const buildFilter = require('./buildFilter');

function getCount(model, obj, args) {
  return model.count(args.where);
}

function getFirst(model, obj, args) {
  const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';

  return model.findOne({
    order: idName + (args.before ? ' DESC' : ' ASC'),
    where: args.where,
  })
    .then(res => (res || {}));
}

function findOne(model, obj, args) {
  const id = obj ? obj[model.getIdName()] : args.id;
  return (id) ? model.findById(id) : null;
}

function getList(model, obj, args) {
  return model.find(buildFilter(model, args));
}

function findAll(model, obj, args) {
  const response = {
    args,
    count: undefined,
    first: undefined,
    list: undefined,
  };
  return getCount(model, obj, args, undefined)
    .then((count) => {
      response.count = count;
      return getFirst(model, obj, args);
    })
    .then((first) => {
      response.first = first;
      return getList(model, obj, Object.assign({}, args, { count: response.count }));
    })
    .then((list) => {
      response.list = list;
      return response;
    });
}

function findAllRelated(model, obj, method, args) {
  const response = {
    args,
    count: undefined,
    first: undefined,
    list: undefined,
  };

  return new Promise((resolve, reject) => {
    waterfall([
      (callback) => {
        obj[`__count__${method}`](args.filter && args.filter.where, callback);
      },
      (count, callback) => {
        response.count = count;

        const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';
        obj[`__findOne__${method}`]({
          order: args.order || (idName + (args.before ? ' DESC' : ' ASC')),
          where: args.filter && args.filter.where,
        }, callback);
      },
      (first, callback) => {
        response.first = first;
        obj[`__get__${method}`](buildFilter(model, Object.assign({}, args, { count: response.count })), callback);
      },
    ], (err, list) => {
      if (err) {
        return reject(err);
      }
      response.list = list;
      return resolve(response);
    });
  });
}

function findAllViaThrough(rel, obj, args) {
  const response = {
    args,
    count: undefined,
    first: undefined,
    list: undefined,
  };

  return new Promise((resolve, reject) => {
    waterfall([
      (callback) => {
        obj[`__count__${rel.name}`](args.where, callback);
      },
      (count, callback) => {
        response.count = count;

        const idName = (rel.modelTo.getIdName && rel.modelTo.getIdName()) ? rel.modelTo.getIdName() : 'id';
        obj[`__findOne__${rel.name}`]({
          order: idName + (args.before ? ' DESC' : ' ASC'),
          where: args.where,
        }, callback);
      },
      (first, callback) => {
        response.first = first;
        obj[`__get__${rel.name}`](buildFilter(rel.modelTo, Object.assign({}, args, { count: response.count })), callback);
      },
    ], (err, list) => {
      if (err) {
        return reject(err);
      }
      response.list = list;
      return resolve(response);
    });
  });
}

function findRelatedMany(rel, obj, args, context) {
  if (rel.modelThrough) {
    return findAllViaThrough(rel, obj, args, context);
  }

  let andArray = []
  if(args.where && Object.keys(args.where).length > 0) {
    for(let i = 0; i < Object.keys(args.where).length; i++) {
      Object.keys(args.where)[i]
      andArray.push({
        [Object.keys(args.where)[i]]: args.where[Object.keys(args.where)[i]]
      })
    }
  }

  if (_.isArray(obj[rel.keyFrom])) {
    andArray.push({
      [rel.keyTo]: { inq: obj[rel.keyFrom] },
    });
  } else {
    andArray.push({
      [rel.keyTo]: obj[rel.keyFrom],
    });
  }
  
  args.where = {and: andArray}

  return findAll(rel.modelTo, obj, args, context);
}

function findRelatedOne(rel, obj, args, context) {
  if (_.isArray(obj[rel.keyFrom])) {
    return Promise.resolve([]);
  }
  args = {
    [rel.keyTo]: obj[rel.keyFrom],
  };
  return findOne(rel.modelTo, null, args, context);
}

module.exports = {
  findAll,
  findOne,
  findRelatedMany,
  findRelatedOne,
  findAllRelated,
};
