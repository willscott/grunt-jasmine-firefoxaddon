/*jslint node:true*/

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '!tasks/build-test-addon.js',
        '!tasks/**/index.js',
        '!tasks/**/spec.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    jasmine_firefoxaddon: {
      tests: ['test/selftest.js'],
      helpers: ['test/testHelper.jsm']
    },

    bump: {
      options: {
        files: ['package.json'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    },

    'npm-publish': {
      options: {
        // list of tasks that are required before publishing
        requires: [],
        // if the workspace is dirty, abort publishing
        // (to avoid publishing local changes)
        abortIfDirty: true
      }
    },

    prompt: {
      tagMessage: {
        options: {
          questions: [
            {
              config: 'bump.options.tagMessage',
              type: 'input',
              message: 'Enter a git tag message:',
              default: 'v%VERSION%'
            }
          ]
        }
      }
    },

    clean: ['.build/']
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-npm');
  grunt.loadNpmTasks('grunt-prompt');

  grunt.registerTask('test', ['jshint', 'jasmine_firefoxaddon']);
  grunt.registerTask('default', ['test']);
  grunt.registerTask('release', function(arg) {
    if (arguments.length === 0) {
      arg = 'patch';
    }
    grunt.task.run([
      'test',
      'prompt:tagMessage',
      'bump:' + arg,
      'npm-publish'
    ]);
  });
};
