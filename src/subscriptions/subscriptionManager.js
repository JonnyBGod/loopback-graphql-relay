/**
 * @deprecated since version 0.10.1
 */

const SubscriptionManager = require('graphql-subscriptions');
const _ = require('lodash');

function getOptions(model, options, args) {
  const basicOpts = {
    context: options.context,
    create: (!_.isNil(args.input.create)) ? args.input.create : false,
    update: (!_.isNil(args.input.update)) ? args.input.update : false,
    remove: (!_.isNil(args.input.remove)) ? args.input.remove : false,
    options: (!_.isNil(args.input.options)) ? args.input.options : false,
    clientSubscriptionId: (!_.isNil(args.input.clientSubscriptionId)) ? args.input.clientSubscriptionId : false,
  };

  basicOpts.model = model;

  return basicOpts;
}

module.exports = function (models, schema, pubsub) {
  const setupFunctions = {};

  _.forEach(models, (model) => {
    if (!model.shared) {
      return;
    }

    setupFunctions[model.modelName] = (options, args) => {
      const ret = {};
      ret[_.lowerCase(model.modelName)] = {
        // filter: comment => comment.repository_name === args.repoFullName,
        channelOptions: getOptions(model, options, args),
      };

      return ret;
    };
  });

  // setupFunctions maps from subscription name to a map of channel names and their filter functions
  // in this case it will subscribe to the commentAddedChannel and re-run the subscription query
  // every time a new comment is posted whose repository name matches args.repoFullName.
  return new SubscriptionManager({ schema, pubsub, setupFunctions });
};
