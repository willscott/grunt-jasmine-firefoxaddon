/*jslint node:true, nomen:true */
"use strict";

module.exports = function (grunt) {
  var http = require('http');
  var path = require('path');
  var fs = require('fs-extra');
  var glob = require('glob');
  var pkg = require('../package.json');
  var activeReporters = {};
 
  grunt.registerMultiTask('build-test-addon', pkg.description, function() {
    var name = this.target;
    
    var ctx = this.options({
      template: __dirname + '/../tasks/jasmine-firefoxaddon/',
      resources: undefined,
      helpers: undefined,
      timeout : 10000,
      port: 9989,
      stayOpen: false
    });

    if (!this.data.files) {
      grunt.log.error('No app target provided.');
      return false;
    }

    for (var target in this.data.files) {
      if (this.data.files.hasOwnProperty(target)) {
        ctx.target = target;
        ctx.files = this.data.files[target];
        buildSpec(ctx);
      }
    }
    
    if (!activeReporters[ctx.port]) {
      var Web = function() {
        var my = this;
        this.messages = [];
        this.ip = "";
        this.server = http.createServer(function (req, res) {
          if (req.url === '/') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end('<html>' +
                    'Hi, App should also load.' +
                    '</html>');
          } else if (req.url === '/put') {
            req.setEncoding('utf8');
            req.on('data', function(chunk) {
              my.ip += chunk;
            });
            req.on('end', function() {
              my.messages.push(JSON.parse(new Buffer(my.ip, 'base64').toString('ascii')));
              grunt.log.write('- ' + my.messages[my.messages.length - 1].fullName + '\n');
              my.ip = '';
              res.end('{}');
            });
          } else if (req.url === '/ready') {
            grunt.log.writeln('Done.');
            res.end('{}');
          }
        }).listen(ctx.port);
      };
      activeReporters[ctx.port] = new Web();
    }

    // Configure downstream jpm run to use the generated addon.
    if (!grunt.config.get('jpm')) {
      grunt.config.set('jpm', {
        options: {
          src: './.build/',
          xpi: './.build/'
        }
      });
    }
    var divider = new RegExp('^.*HERE$', 'm');
    var specfile = grunt.file.read('.build/spec.js');
    var specout = specfile.split(divider)[0];
    // Add the helpers to the spec file and copy them into addon
    grunt.file.expand(grunt.config.get('jasmine_firefoxaddon').helpers)
      .forEach(function (helper) {
        grunt.file.copy(helper, '.build/data/' + helper);
        // NOTE - hardcoding the path because self.data.url not visible in spec
        // This path is set in tasks/jasmine-firefoxaddon/package.json
        specout += '\nComponents.utils.import("' +
          'resource://jid1-mkagayemb0e5nq-at-jetpack/data/' + helper + '");';
      });
    // Add actual tests to spec file
    grunt.file.expand(grunt.config.get('jasmine_firefoxaddon').tests)
      .forEach(function (test) {
        specout += '\nrequire("../' + test + '");';
      });
    specout += specfile.split(divider)[1];
    grunt.file.write('.build/spec.js', specout);
    // Copy the source files
    grunt.file.expand(grunt.config.get('jasmine_firefoxaddon').resources)
      .forEach(function (resource) {
        grunt.file.copy(resource, '.build/data/scripts/' + resource);
      });
    return true;
  });

  grunt.config.set('build-test-addon', {
    main: {
      files: {
        '.build': [ 'spec.jsm' ]
      },
      options: {
        helper: [
          //{path: 'freedom-for-firefox.jsm', include: false},
          //{path: freedomPrefix + '/providers', name: 'providers', include: false},
          //{path: freedomPrefix + '/spec', name: 'spec', include: false}
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-jpm');
  if (!grunt.config.get('jpm')) {
    grunt.config.set('jpm', {
      options: {
        src: './.build/',
        xpi: './.build/'
      }
    });
  }
  grunt.loadNpmTasks('grunt-browserify');
  grunt.config.merge({
    browserify: {
      jasmine: {
        files: {
          '.build/data/spec.jsm': ['.build/spec.js']
        }
      }
    }
  });

  grunt.registerTask('report-tests', pkg.description, function() {
    var failures = 0;
    for (var port in activeReporters) {
      if (activeReporters[port].messages.length) {
        activeReporters[port].messages.forEach(function(msg) {
          if (!msg.fullName) {
            return;
          }
          if (msg.status === 'passed') {
            grunt.log.ok(msg.fullName, msg.status);
            if (msg.failedExpectations) {
              msg.failedExpectations.forEach(function(exp) {
                grunt.log.warn(exp.message);
              });
            }
          } else if (msg.status === 'failed') {
            grunt.log.error(msg.fullName, msg.status);
            if (msg.failedExpectations) {
              msg.failedExpectations.forEach(function(exp) {
                grunt.log.warn(exp.message);
              });
            }
            failures += 1;
          } else if (msg.status === 'pending') {
            grunt.log.write('>> ' + msg.fullName).subhead(msg.status);
          } else {
            grunt.log.warn(msg.fullName);
            console.error(msg);
            failures += 1;
          }
        });
      }
    }
    grunt.file.setBase('../');  // to delete plugin, need to cd up
    grunt.file['delete']('.build');
    if (failures) {
      return false;
    } else {
      return true;
    }
  });

  grunt.registerTask('jasmine_firefoxaddon', ['build-test-addon',
                                              'browserify:jasmine',
                                              'jpm:run',
                                              'report-tests:fromBuild']);

  function getFiles(specs) {
    var out = [];
    if (specs instanceof Array) {
      specs.forEach(function(spec) {
        out = out.concat(getFiles(spec));
      });
    } else if (specs.path) {
      out = glob.sync(specs.path).map(function(path) {
        return {
          path: path,
          include: specs.include,
          name: specs.name || path
        };
      });
    } else {
      out = glob.sync(specs);
    }
    return out;
  }
  
  function buildSpec(ctx) {
    ctx.dir = fs.mkdirpSync(ctx.target) || fs.realpathSync(ctx.target);

    var scripts = getFiles(ctx.files);
    var toLink = "";
    
    fs.mkdirpSync(ctx.dir + '/data');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      var spath = s.path || s;
      var sname = s.name || s;
      if (!s.path || s.include) {
        toLink += "underTest = self.data.url('" + sname + "');\n";
      }
      var parent = path.dirname(sname);
      fs.mkdirpSync(ctx.dir + '/data/' + parent);
      fs.copySync(spath, ctx.dir + '/data/' + sname);
    }
    toLink += "finishLoad();";
    if (ctx.stayOpen) {
      toLink += "\nstayOpen = true;";
    }
    var buffer = new Buffer(toLink);
    
    fs.copySync(ctx.template, ctx.dir);
    var fd = fs.openSync(ctx.dir + '/index.js', 'a');
    fs.writeSync(fd, buffer, 0, buffer.length, null);
    grunt.log.ok('Extension staged in ' + ctx.target);
  }
};
