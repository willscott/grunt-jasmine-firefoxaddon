/*globals require,console,setTimeout:true,setInterval:true,clearTimeout:true,
  clearInterval:true,atob:true,btoa:true,jasmine:true */

var setTimeout = require("sdk/timers").setTimeout,
    setInterval = require("sdk/timers").setInterval,
    clearTimeout = require("sdk/timers").clearTimeout,
    clearInterval = require("sdk/timers").clearInterval;

var Cu = require("chrome").Cu;

var atob = Cu['import']("resource://gre/modules/Services.jsm", {}).atob,
  btoa = Cu['import']("resource://gre/modules/Services.jsm", {}).btoa;

var self = require("sdk/self");
var request = require("sdk/request").Request;

// Load Jasmine
var jasmineRequire = require('./jasmine-core/jasmine');
jasmine = jasmineRequire.core(jasmineRequire);

var theGlobal = {
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

jasmine.getGlobal = function(g) {
  return g;
}.bind({}, theGlobal);

var env = jasmine.getEnv({
  global: theGlobal
});
var jasmineInterface = jasmineRequire.interface(jasmine, env);

// Jasmine interface (like describe) need to be on the global scope.
// Only way I can find to do that is set them as raw symbols.
for (var property in jasmineInterface) {
  eval(property + " = jasmineInterface['" + property + "'];");
}

var tests = [],
  reports = [],
  reportPort = 9979;

var testsFinished = function (result) {
  'use strict';
  var req = request({
    url: 'http://localhost:9989/put',
    content: btoa(JSON.stringify(result)),
    overrideMimeType: "text/plain; charset=latin1",
    onComplete: function (response) {
      if (response.indexOf('kill') > -1) {
        var system = require("sdk/system");
        system.exit(0);
      }
    }
  });
  req.post();
};

var register = function (specfile) {
  'use strict';
  tests.push(specfile);
};

var runTests = function () {
  tests.forEach(function(test) {
    console.log('Executing: ' + test);
    // Doesn't work yet, jasmine not in the scope of loaded test
    require(test);
  });
};

var finishLoad = function (port) {
  'use strict';
  reportPort = port;

  var req = request({
    url: 'http://localhost:' + port + '/ready',
    overrideMimeType: "text/plain; charset=latin1",
    onComplete: function (response) {
      console.info('Reported Addon Startup.');
    }
  });
  req.get();
  runTests();
};
