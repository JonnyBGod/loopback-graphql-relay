module.exports = function checkAccess(context, model, method, modelId) {
  return new Promise((resolve, reject) => {
    const modelSettings = model.settings || {};
    let errStatusCode = modelSettings.aclErrorStatus || context.app.get('aclErrorStatus') || 401;
    if (!context.accessToken) {
      errStatusCode = 401;
    }

    if (model.checkAccess) {
      model.checkAccess(
        context.accessToken,
        modelId,
        method,
        // ctx,
        (err, allowed) => {
          if (err) {
            reject(err);
          } else if (allowed) {
            resolve();
          } else {
            const messages = {
              403: {
                message: 'Access Denied',
                code: 'ACCESS_DENIED',
              },
              404: {
                message: (`could not find ${model.name} with id ${modelId}`),
                code: 'MODEL_NOT_FOUND',
              },
              401: {
                message: 'Authorization Required',
                code: 'AUTHORIZATION_REQUIRED',
              },
            };

            const e = new Error(messages[errStatusCode].message || messages[403].message);
            e.statusCode = errStatusCode;
            e.code = messages[errStatusCode].code || messages[403].code;
            reject(e);
          }
        },
      );
    } else {
      resolve();
    }
  });
};
