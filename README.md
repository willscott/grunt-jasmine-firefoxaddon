# grunt-jasmine-firefoxaddon

> Run jasmine specs in a Firefox Addon


Getting Started
---------------

This plugin requires Grunt ```~0.4.0```

If you haven't used Grunt before, be sure to check out the Getting Started
guide, which explains how to create your grunt file. Once you're familiar with
the process, this plugin can be installed as:

```shell
npm install grunt-jasmine-firefoxaddon --save-dev
```

Once the plugin has been installed, it may be enabled with this line of
JavaScript:
```javascript
grunt.loadNpmTasks('grunt-jasmine-firefoxaddon');
```

Jasmine Task
------------

Run this task with the ```grunt jasmine_firefoxaddon``` command.

Automatically builds and maintains the spec runner and reports results back to
the grunt console. Uses jpm provided by mozilla to run a dynamically constructed
firefox addon that runs jasmine specs by using browserify. Allows for copying
and loading of custom `.jsm` files. The addon is built in the `.buildff/` path,
and is not deleted after running so you can inspect manually (though you
probably want to add it to your .gitignore).

Note that if your addon needs to access other resources, you will need to make
the files available (e.g. with
[grunt-contrib-copy](https://www.npmjs.com/package/grunt-contrib-copy)) under
the path `.buildff/data/...` and then access them in your addon with the path
`jid1-mkagayemb0e5nq-at-jetpack/data/...` (you can also use `self.data.url(...)`
if
[the self API](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/self)
is available to you). This is due to the structure of Firefox addons - future
iterations of this tool may be able to make the process smoother.


Customize your SpecRunner
-------------------------

Use your own files in the app to customize your tests. 


### Options

#### tests
Type: `String|Array`

The spec files you want to run.

#### helpers
Type: `String|Array`

Custom JavaScript module (`.jsm`) files you wish you load into your addon during
test.

#### options.timeout
Type: `Number`
Default: `10000`

How many milliseconds to wait for the browser to start up before failing.
