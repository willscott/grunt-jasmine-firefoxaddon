/*globals require,console,setTimeout:true,setInterval:true,clearTimeout:true,
  clearInterval:true,atob:true,btoa:true,jasmine:true */

// TODO: make it work, switch to npm-provided jasmine-core
console.log("START");
var jasmineRequire = require('jasmine-core');
console.log("JRQ");
console.dir(jasmineRequire);
jasmine = jasmineRequire.core(jasmineRequire);
console.log("WOO");
console.dir(jasmine);

var setTimeout = require("sdk/timers").setTimeout,
  setInterval = require("sdk/timers").setInterval,
  clearTimeout = require("sdk/timers").clearTimeout,
  clearInterval = require("sdk/timers").clearInterval;

var Cu = require("chrome").Cu;

var atob = Cu['import']("resource://gre/modules/Services.jsm", {}).atob,
  btoa = Cu['import']("resource://gre/modules/Services.jsm", {}).btoa;

var self = require("sdk/self");
var request = require("sdk/request").Request;


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
};
