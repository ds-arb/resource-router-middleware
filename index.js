'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.resource = resource;
exports.route = route;

var _express = require('express');

var keyed = ['get', 'read', 'put', 'patch', 'update', 'del', 'delete'];
exports.keyed = keyed;
var map = { index: 'get', list: 'get', read: 'get', create: 'post', update: 'put', modify: 'patch' };

function resource(idKey) {
  return function (target) {
    var context = new target();

    var router = (0, _express.Router)();
    var index = undefined,
        key = undefined,
        fn = undefined,
        url = undefined,
        method = undefined;

    // Get the class prototype methods
    var functions = Object.getOwnPropertyNames(target.prototype);

    if (target.middleware) router.use(target.middleware);

    if (~functions.indexOf('load')) {
      router.param(idKey, function (req, res, next, id) {
        target.prototype.load.call(context, req, id, function (err, data) {
          if (err) return res.status(404).send(err);
          req[idKey] = data;
          next();
        });
      });
    }

    for (index in functions) {
      key = functions[index];
      fn = map[key] || key;
      if (target.prototype[key].routeMethod != null) {
        url = target.prototype[key].routeUrl;
        method = target.prototype[key].routeMethod;
      } else if (typeof router[fn] === 'function') {
        url = ~keyed.indexOf(key) ? '/:' + idKey : '/';
        method = fn;
      } else continue;

      // Hook it up!
      router[method](url, target.prototype[key].bind(context));
    }

    return router;
  };
}

function route(method, url) {
  return function (target, key, descriptor) {
    descriptor.value.routeMethod = method;
    descriptor.value.routeUrl = url;
  };
}

// Shorthand for various methods
route.get = route.bind(route, 'get');
route.post = route.bind(route, 'post');
route.patch = route.bind(route, 'patch');
route['delete'] = route.bind(route, 'delete');
