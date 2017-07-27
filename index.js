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

    function __getAllProperties(o, arr) {
      var functions = Object.getOwnPropertyNames(o);
      for (var i = 0; i < functions.length; i++) {
        var v = functions[i];
        if (arr.indexOf(v) == -1) {
          arr.push(v);
        }
      }

      var po = Object.getPrototypeOf(o)
      if (po && typeof po !== 'Object') {
        __getAllProperties(po, arr)
      }

      return arr;
    }
    // Get the class prototype methods
    // var functions = Object.getOwnPropertyNames(target.prototype)

    var functions = __getAllProperties(target.prototype, [])

    // functions = Object.keys(target.prototype);
    var middleware = target.middleware || context.middleware;
    if (middleware) router.use(middleware);

    if (~functions.indexOf('load')) {
      router.param(idKey, function (req, res, next, id) {
        target.prototype.load.call(context, req, id).then(function(data) {
          req['entity'] = data;
          next();
        }, function(err) {
          var httpResponseCode = err.httpResponseCode || 500;
          res.status(httpResponseCode).send({message: err.message, status: httpResponseCode});
          // res.status(500).send({message: err.message}) //, stack: err.stack});
        })
        // target.prototype.load.call(context, req, id, function (err, data) {
        //   if (err) return res.status(404).send(err);
        //   req[idKey] = data;
        //   next();
        // });
      });
    }

    for (index in functions) {
      key = functions[index];
      fn = map[key] || key;
      if (target.prototype[key].routeMethod != null) {
        url = target.prototype[key].routeUrl;
        method = target.prototype[key].routeMethod;
      } else if (typeof router[fn] === 'function') {
        // url = ~keyed.indexOf(key) ? '/:' + idKey : '/';
        url = ~keyed.indexOf(key) ? '/:id' : '/';
        method = fn;
      } else continue;

      // Hook it up!
      // router[method](url, target.prototype[key].bind(context));


      __setUpRoute(target, router, method, url, key, context);
    }

    return router;
  };
}

function __setUpRoute(target, router, method, url, key, context) {
  router[method](url, function(req, res, next) {
    target.prototype[key].call(context, req).then(function(data) {
      try {
        data = data || {};
        var httpResponseCode = 200;

        if ((data && data.httpResponseCode)) {
          httpResponseCode = data.httpResponseCode;
          delete data.httpResponseCode;
        }

        res.status(httpResponseCode).json(data);
      } catch(err) {
        res.status(500).send({message: err.message}) //, stack: err.stack});
      }
    }, function(err) {
        var httpResponseCode = err.httpResponseCode || 500;
        res.status(httpResponseCode).send({message: err.message, status: httpResponseCode});
      // res.status(500).send({message: err.message}) //, stack: err.stack});
    })
  })
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
