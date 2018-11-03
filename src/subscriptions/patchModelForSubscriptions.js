module.exports = function patchModelForSubscriptions(PatchModel, options) {
  function createSubscriptionHandler(type) {
    return function (ctx, next) { // eslint-disable-line
      const { where } = ctx;
      const data = ctx.instance || ctx.data;
      let target;
      const idName = PatchModel.getIdName();

      if (data && (data[idName] || data[idName] === 0)) {
        target = data[idName];
      } else if (where && (where[idName] || where[idName] === 0)) {
        target = where[idName];
      }

      const hasTarget = target === 0 || !!target;

      const change = {
        target,
        where,
        data,
      };

      switch (type) {
        case 'save':
          if (ctx.isNewInstance === undefined) {
            change.type = hasTarget ? 'update' : 'create';
          } else {
            change.type = ctx.isNewInstance ? 'create' : 'update';
          }

          break;
        case 'delete':
          change.type = 'remove';
          break;

        default:
          break;
      }

      options.subscriptionServer.pubsub.publish(PatchModel.name, change);

      next();
    };
  }

  PatchModel.observe('after save', createSubscriptionHandler('save'));
  PatchModel.observe('after delete', createSubscriptionHandler('delete'));
};
