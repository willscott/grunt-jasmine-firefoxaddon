/*globals describe, it, expect*/

describe('jasmine-chromeapp', function () {
  'use strict';
  it('Runs & Reports', function () {
    expect(true).toBe(true);
  });

  it('Has helper files copied appropriately', function (done) {
    const {Cu} = require("chrome");
    try {
      var helper = self.data.url('testHelper.jsm');
      var jsm = Cu.import(helper);
      expect(jsm.test()).to.be('helper loaded');
      Cu.unload(helper);
    } catch (e) {
      console.error('Exception importing ' + underTest);
      console.error(e);
    }
  });
});
