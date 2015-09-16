# grunt-jasmine-firefoxaddon

> Run jasmine specs in a Firefox Addon


Getting Started
---------------

This plugin requires Grunt ```^0.4.5```

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
and loading of custom `.jsm` files. The addon is built in the `.build/` path,
but is deleted after the task successfully completes. If the task fails part
way it will likely remain, and may be useful for debugging.

Note that if your addon needs to access other resources, you will need to make
the files available (e.g. with
[grunt-contrib-copy](https://www.npmjs.com/package/grunt-contrib-copy)) under
the path `.build/data/...` and then access them in your addon with the path
`resource://grunt-jasmine-firefoxaddon-runner/data/...` (you can also use
`self.data.url(...)` if
[the self API](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/self)
is available to you). This is due to the structure of Firefox addons - future
iterations of this tool may be able to make the process smoother.


Customize your SpecRunner
-------------------------

Use your own files in the app to customize your tests. For all of the below, you
can use [node globbing patterns](https://github.com/isaacs/node-glob).

### Options

#### tests
Type: `String|Array`

The spec files you want to run.

#### resources
Type: `String|Array`

Resources (.js, .json, etc.) needed for the tests (will be made available to the
addon under `data/`, but *not* automatically loaded into the addon - your tests
can pull them in as needed from
`resource://grunt-jasmine-firefoxaddon-runner/data/`). These files *can* be
`.jsm`, which would allow them to be loaded via `Components.utils.import`, or
they can be of other types (which will require different mechanisms to load,
currently left as an exercise to the user - future updates to this tool may try
to facilitate common use cases).

#### helpers
Type: `String|Array`

Custom JavaScript module (`.jsm`) files you wish you load into your addon during
test. These files *are* automatically loaded during addon setup, but *must* be
`.jsm` types (JavaScript with an `EXPORTED_SYMBOLS` array to define visibility).

#### options.timeout
Type: `Number`
Default: `10000`

How many milliseconds to wait for the browser to start up before failing.


### Issues/debugging

Ideally this runner should "just work" with your tests - however, if it doesn't
here are a few common issues and suggested approaches:

- The path where resources are (`grunt-jasmine-firefoxaddon-runner/data/...`)
may conflict with the path you need to specify if you run your tests in other
environments. In that case, you can put logic to set the Firefox-addon-specific
path in a block like `if (typeof window === 'undefined') { path = ... }` - this
assumes that `window` is defined in your other relevant environments (it isn't
within the scope of a Firefox addon).
- If you're using [freedom.js](https://github.com/freedomjs/freedom) you need
to ensure that your module actually loads and does something (e.g. emits a
message from the WebWorker to the "front-end"). If it doesn't then the test
runner may terminate prematurely and give fairly uninformative error messages
like "error loading resource" (referring usually to some part of the freedom
module). [This is an example of a minimal working freedom.js module]
(https://github.com/trevj/grunt-jasmine-firefoxaddon-test/) for this runner.

If you encounter some other problem then feel free to file an issue in this
GitHub repository.
