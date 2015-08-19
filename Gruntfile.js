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
      tests: ['test/selftest.js']
    },
    clean: ['spec.jsm', '.build/']
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['jshint', 'jasmine_firefoxaddon']);
  grunt.registerTask('default', ['test']);
};
