/*globals describe, it, expect*/

describe('jasmine-chromeapp', function () {
  'use strict';
  it('Runs & Reports', function () {
    expect(true).toBe(true);
  });

  it('Copies resource files', function () {
    var datapath = 'resource://grunt-jasmine-firefoxaddon-runner/data/';
    Components.utils.import(datapath + 'test/resource1.jsm');
    Components.utils.import(datapath + 'test/resource2.jsm');
    expect(resource1).toBe('Loaded first resource file');
    expect(resource2).toBe('Loaded second resource file');
  });

  it('Has helper files copied appropriately', function () {
    // Checks to see that testHelper.jsm was loaded
    expect(test()).toBe('helper loaded');
  });
});
