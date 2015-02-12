/*globals require,console */

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

var fileDone = function (res) {
  'use strict';
  console.log('Testing Finished');
  if (pendingReports > 0) {
    onFinish = completeTesting();
  } else {
    completeTesting();
  }
};

var finishLoad = function () {
  'use strict';
  var jsm;
  try {
    jsm = Cu['import'](underTest);
  } catch (e) {
    console.error('Exception importing ' + underTest);
    console.error(e);
  }
  var symbols = jsm.EXPORTED_SYMBOLS;
  symbols.forEach(function (symbol) {
    console.log('Executing ' + underTest + ': ' + symbol);
    try {
      var retVal = jsm[symbol](testDone, fileDone);
      tests = tests.concat(retVal);
    } catch (e) {
      console.error(e);
    }
  });
};
