
const applyFilter = require('loopback-filters');
const { PassThrough } = require('stream');

/**
 * Default Model.createChangeStream doesn't respect the where clause.
 * This replaces the default method with a fix.
 *
 * More Info here: https://github.com/strongloop/angular-live-set/issues/11
 */
module.exports = function (PatchModel) {
  PatchModel.createChangeStream = function (options, cb) {
    /* Based on persisted-model#createChangeStream
     *
     * currentUser is being populated in server.js using tips from here:
     * https://github.com/strongloop/loopback/issues/569
     *
     * Ignoring paramter userId, and defaulting to logged in user
     * future improvement will check if user has role 'admin', and if so
     * allow the userId to not match the logged in user
     *
     */

    const idName = this.getIdName();
    const Model = this;

    let changes = new PassThrough({ objectMode: true });
    let writeable = true;

    changes.destroy = function () {
      changes.removeAllListeners('error');
      changes.removeAllListeners('end');
      writeable = false;
      changes = null;
    };

    changes.on('error', () => {
      writeable = false;
    });
    changes.on('end', () => {
      writeable = false;
    });

    process.nextTick(() => {
      cb(null, changes);
    });

    function createChangeHandler(type, option) {
      return function (ctx, next) { // eslint-disable-line
        // since it might have set to null via destroy
        if (!changes) {
          return next();
        }

        const { where } = ctx;
        const data = ctx.instance || ctx.data;

        const filtered = applyFilter([data], option);

        if (filtered.length < 1) {
          return next();
        }

        // const whereId = where && where[idName];

        // the data includes the id
        // or the where includes the id
        let target;

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

        // TODO(ritch) this is ugly... maybe a ReadableStream would be better
        if (writeable) {
          changes.write(change);
        }

        next();
      };
    }

    Model.observe('after save', createChangeHandler('save', options));
    Model.observe('after delete', createChangeHandler('delete', options));
  };
};
