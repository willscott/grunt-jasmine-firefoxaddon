/*globals describe, it, expect*/

describe('jasmine-chromeapp', function () {
  'use strict';
  it('Runs & Reports', function () {
    expect(true).toBe(true);
  });

  it('Copies resource files', function () {
    var datapath = 'resource://jid1-mkagayemb0e5nq-at-jetpack/data/scripts/';
    Components.utils.import(datapath + 'test/resource1.js');
    Components.utils.import(datapath + 'test/resource2.js');
    expect(resource1).toBe('Loaded first resource file');
    expect(resource2).toBe('Loaded second resource file');
  });

  it('Has helper files copied appropriately', function () {
    // Checks to see that testHelper.jsm was loaded
    expect(test()).toBe('helper loaded');
  });
});
