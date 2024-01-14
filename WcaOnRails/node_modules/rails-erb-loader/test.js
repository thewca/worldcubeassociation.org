var MemoryFS = require('memory-fs')
var path = require('path')
var webpack = require('webpack')
var defaults = require('lodash.defaults')

var fs = new MemoryFS()

function compile (config, callback) {
  config.runner = config.runner || 'ruby'
  config.engine = config.engine || 'erb'

  var compiler = webpack({
    entry: './test/erb/' + config.file,
    module: {
      loaders: [
        {
          test: /\.erb$/,
          loader: './index',
          options: defaults({}, config, {
            dependenciesRoot: './test/dependencies',
            timeoutMs: 2000
          })
        }
      ]
    },
    output: {
      filename: './output.js'
    }
  })
  compiler.outputFileSystem = fs
  compiler.run(callback)
}

function compile2 (config, done, successCallback) {
  compile(config, function (error, stats) {
    if (error) {
      fail(error)
      done()
    } else {
      successCallback(stats)
    }
  })
}

function readOutput () {
  var fileContent = fs.readFileSync(path.resolve(__dirname, './output.js'))
  return fileContent.toString()
}

function expectInOutput (str) {
  expect(readOutput()).toEqual(expect.stringContaining(str))
}

test('loads a simple file', function (done) {
  compile2({ file: 'simple.js.erb' }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expectInOutput("var helloWorld = 'Hello World'")
    done()
  })
})

test('loads with erb', function (done) {
  compile2({ file: 'engine.js.erb', engine: 'erb' }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expectInOutput("var engine = 'erb'")
    done()
  })
})

test('loads with erubis', function (done) {
  compile2({ file: 'engine.js.erb', engine: 'erubis' }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expectInOutput("var engine = 'erubis'")
    done()
  })
})

test('loads with erubi', function (done) {
  compile2({ file: 'engine.js.erb', engine: 'erubi' }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expectInOutput("var engine = 'erubi'")
    done()
  })
})

test('loads through a Rails-like runner', function (done) {
  compile2({ file: 'runner.js.erb', runner: './test/runner' }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expectInOutput("var env = 'test'")
    done()
  })
})

test('loads with env specified in option', function (done) {
  compile2({ file: 'runner.js.erb', runner: './test/runner', env: {ENV: 'custom'} }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expectInOutput("var env = 'custom'")
    done()
  })
})

test('does not error with large files', function (done) {
  compile2({ file: 'giant.js.erb' }, done, function (stats) {
    expect(stats.compilation.errors).toEqual([])
    expect(readOutput()).toMatch(/var bigData = 'a{204740}'/)
    done()
  })
})

test('times out with error (timeoutMs: 1000)', function (done) {
  compile2({ file: 'sleep.js.erb', timeoutMs: 1000 }, done, function (stats) {
    expect(stats.compilation.errors.length).toEqual(1)
    expect(stats.compilation.errors[0].message).toMatch(
      'rails-erb-loader took longer than the specified 1000ms timeout'
    )
    done()
  })
})

test('times out with error (DEPRECATED timeout: 1)', function (done) {
  compile2({ file: 'sleep.js.erb', timeout: 1, timeoutMs: null }, done, function (stats) {
    expect(stats.compilation.errors[0].message).toMatch(
      'rails-erb-loader took longer than the specified 1000ms timeout'
    )
    done()
  })
})

test('fails when both timeout and timeoutMs are set', function (done) {
  compile2({ file: 'sleep.js.erb', timeout: 1, timeoutMs: 1000 }, done, function (stats) {
    expect(stats.compilation.errors[0].message).toMatch(
      'TypeError: Both options `timeout` and `timeoutMs` were set'
    )
    done()
  })
})

test.skip('loads single file dependencies in dev', function (done) {
  var prevEnv = process.env.NODE_ENV
  compile2({ file: 'dependencies.js.erb' }, done, function (stats) {
    process.env.NODE_ENV = 'development'
    expect(stats.compilation.errors).toEqual([])

    // TODO: Check that dependencies/dependency.rb and dependencies/dependency/version.rb
    // are being watched

    done()
  })
  process.env.NODE_ENV = prevEnv
})

test.skip('loads directory dependencies in dev', function (done) {
  var prevEnv = process.env.NODE_ENV
  compile2({ file: 'dependencies-all.js.erb' }, done, function (stats) {
    process.env.NODE_ENV = 'development'
    expect(stats.compilation.errors).toEqual([])

    // TODO: Check that the whole dependencies tree is being watched

    done()
  })
  process.env.NODE_ENV = prevEnv
})
