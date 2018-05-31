'use strict';

module.exports = function(Site) {

  Site.sites = function(httpRequest, httpResponse, cb) {

    const Account = Site.app.models.Account;

    const userId = (typeof httpRequest.accessToken.userId === 'object')
      ? httpRequest.accessToken.userId.toString()
      : httpRequest.accessToken.userId;

    Account.findById(userId, { include: 'sites' }, (error, data) => {

      return cb(null, data.__data.sites);

    });

  };

  Site.remoteMethod('sites', {
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    returns: { arg: '', type: 'array', root: true },
    http: { path: '/sites', verb: 'get' }
  });
};
