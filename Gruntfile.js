/*jslint node:true*/

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '!tasks/**/lib/main.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jasmine_firefoxaddon: {
      selftest: {
        src: ['test/*.js', 'test/*.jsm'],
        options: {
          paths: 'test/selftest.js'
        }
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['jshint', 'jasmine_firefoxaddon']);
};
