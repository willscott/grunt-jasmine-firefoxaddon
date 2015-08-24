/*globals describe, it, expect*/

describe('jasmine-chromeapp', function () {
  'use strict';
  it('Runs & Reports', function () {
    expect(true).toBe(true);
  });

  it('Has helper files copied appropriately', function (done) {
    // Checks to see that testHelper.jsm was loaded
    expect(test()).toBe('helper loaded');
    done();
  });
});
