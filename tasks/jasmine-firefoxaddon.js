/*jslint node:true */
'use strict';

module.exports = function (grunt) {
  var http = require('http'),
    chalk = require('chalk'),
    path = require('path'),
    async = require('async'),
    fs = require('fs-extra'),
    pkg = require('../package.json');

  var activeReporters = {};
 
  grunt.registerMultiTask('jasmine_firefoxaddon', pkg.description, function () {
    var ctx = this.options({
        template: __dirname + '/../tasks/jasmine-firefoxaddon',
        version: '2.0.0',
        outfile: '.build',
        paths: undefined,
        binary: undefined,
        keepRunner: false,
        port: 9989,
        timeout : 30000,
        flags: []
    });

    if (grunt.option('debug')) {
      grunt.log.debug(JSON.stringify(ctx));
    }

    ctx.files = this.files;
    if (!this.files) {
      grunt.log.error('No app target provided.');
      return false;
    }


    process.on('SIGINT', function () {
      cleanup(ctx);
    });
  
    grunt.config.set('jasmine_firefoxaddon_build', {
      ctx: ctx
    });
    grunt.config.set('jasmine_firefoxaddon_report', {
      ctx: ctx
    });

    grunt.task.run([
      'mozilla-addon-sdk:1_17',
      'jasmine_firefoxaddon_build',
      'mozilla-cfx:test',
      'jasmine_firefoxaddon_report'
    ]);
  });


  grunt.registerMultiTask('jasmine_firefoxaddon_build', pkg.description, function() {
    var ctx = grunt.config.get('ctx');

    buildSpec(ctx);
    
    if (!activeReporters[ctx.port]) {
      var web = function() {
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
            grunt.log.writeln('Done.')
            res.end('{}');
          }
        }).listen(ctx.port);
      };
      activeReporters[ctx.port] = new web();
    }

    // Configure downstream cfx run to use the generated addon.
    if (!grunt.config.get('mozilla-cfx')) {
      grunt.config.set('mozilla-cfx', {
        'test': {
          options: {
            'mozilla-addon-sdk': "1_17",
            extension_dir: ctx.target,
            command: "run",
            arguments: "-v"
          }
        }
      });
    }
    return true;
  });

  grunt.loadNpmTasks('grunt-mozilla-addon-sdk');
  if (!grunt.config.get('mozilla-addon-sdk')) {
    grunt.config.set('mozilla-addon-sdk', {
      '1_17': {
        options: {
          revision: "1.17"
        }
      },
      master: {
        options: {
          revision: "master",
          github: true
        }
      }
    });
  }

  grunt.registerTask('jasmine_firefoxaddon_report', pkg.description, function() {
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
    if (failures) {
      return false;
    } else {
      return true;
    }
  });
  
  function addFiles(files, to, tagFilter) {
    var tags = '';

    files.forEach(function (file) {
      file.src.forEach(function (f) {
        var dest;
        if (file.dest && grunt.file.isDir(file.dest)) {
          dest = f;
        } else {
          dest = file.dest || f;
        }
        if (grunt.file.isFile(f)) {
          if (grunt.file.isMatch(tagFilter, f)) {
            tags += "register(self.data.url('" + dest + "'));\n";
          }
          grunt.file.copy(f, to + '/data/' + dest);
        }
      });
    });

    return tags;
  }

  function buildSpec(ctx) {
    grunt.log.write('Building...');
    grunt.file.mkdir(ctx.outfile);
    var dest = ctx.outfile,
      tags = "";

    // Copy the template
    grunt.file.recurse(ctx.template, function (file, root, dir, filename) {
      grunt.file.copy(file, dest + '/' + filename);
    });
    // Copy Jasmine
    grunt.file.recurse(__dirname + '/../vendor/jasmine-core-' + ctx.version,
      function (file, root, dir, filename) {
        if (!dir) {
          dir = '';
        }
        grunt.file.copy(file, dest + '/lib/jasmine-core/' + dir + '/' + filename);
      });
    // Make a profile directory.
    grunt.file.mkdir(ctx.outfile + '/profile');

    // Copy user files.
    if (!ctx.paths) {
      ctx.paths = [];
      ctx.files.forEach(function(file) {
        ctx.paths = ctx.paths.concat(grunt.file.expand(file.src));
      });
    }
    tags += addFiles(ctx.files, dest, ctx.paths);

    tags += "finishLoad(" + ctx.port + ");";

    // Update the template with found specs.
    tags = grunt.file.read(dest + '/lib/main.js') + tags;
    grunt.file.write(dest + '/lib/main.js', tags);

    grunt.log.writeln(chalk.green('Done.'));
  }
};
