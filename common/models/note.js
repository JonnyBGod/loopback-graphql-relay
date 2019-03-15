'use strict';

module.exports = function(Note) {
  Note.clear = () => ({
    note: {
      Content: '',
    },
    previousClear: new Date(),
  });

  Note.remoteMethod(
    'clear', {
      http: {
        path: '/clear',
        verb: 'post',
      },
      returns: [{
        arg: 'note',
        type: 'object',
      }, {
        arg: 'previousClear',
        type: 'Date',
      }],
    });

  Note.afterRemote('create', function(ctx, note, next) {
    if (ctx.result && !ctx.result.Genre) {
      ctx.result.Genre = 'injected by remote hook'
    }
    next()
  });
};
