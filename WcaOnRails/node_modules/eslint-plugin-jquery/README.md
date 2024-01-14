# eslint-plugin-jquery

Disallow jQuery functions with native equivalents.

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm install eslint --save-dev
```

Next, install `eslint-plugin-jquery`:

```
$ npm install eslint-plugin-jquery --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-jquery` globally.

## Usage

Add `jquery` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix.

You can either enable individual rules as follows:
```json
{
  "plugins": [
    "jquery"
  ],
  "rules": {
    "jquery/no-ajax": 2,
    "jquery/no-ajax-events": 2,
    "jquery/no-animate": 2,
    "jquery/no-attr": 2,
    "jquery/no-bind": 2,
    "jquery/no-class": 2,
    "jquery/no-clone": 2,
    "jquery/no-closest": 2,
    "jquery/no-css": 2,
    "jquery/no-data": 2,
    "jquery/no-deferred": 2,
    "jquery/no-delegate": 2,
    "jquery/no-each": 2,
    "jquery/no-extend": 2,
    "jquery/no-fade": 2,
    "jquery/no-filter": 2,
    "jquery/no-find": 2,
    "jquery/no-global-eval": 2,
    "jquery/no-grep": 2,
    "jquery/no-has": 2,
    "jquery/no-hide": 2,
    "jquery/no-html": 2,
    "jquery/no-in-array": 2,
    "jquery/no-is-array": 2,
    "jquery/no-is-function": 2,
    "jquery/no-is": 2,
    "jquery/no-load": 2,
    "jquery/no-map": 2,
    "jquery/no-merge": 2,
    "jquery/no-param": 2,
    "jquery/no-parent": 2,
    "jquery/no-parents": 2,
    "jquery/no-parse-html": 2,
    "jquery/no-prop": 2,
    "jquery/no-proxy": 2,
    "jquery/no-ready": 2,
    "jquery/no-serialize": 2,
    "jquery/no-show": 2,
    "jquery/no-size": 2,
    "jquery/no-sizzle": 2,
    "jquery/no-slide": 2,
    "jquery/no-submit": 2,
    "jquery/no-text": 2,
    "jquery/no-toggle": 2,
    "jquery/no-trigger": 2,
    "jquery/no-trim": 2,
    "jquery/no-val": 2,
    "jquery/no-when": 2,
    "jquery/no-wrap": 2
  }
}
```

Or you can use the full set of rules:
```json
{
  "plugins": [
    "jquery"
  ],
  "extends": [
    "plugin:jquery/deprecated"
  ]
}
```

Or a subset:
```json
{
  "plugins": [
    "jquery"
  ],
  "extends": [
    "plugin:jquery/slim"
  ]
}
```
The `slim` set uses the following rules: `jquery/no-ajax`, `jquery/no-animate`, `jquery/no-fade`, `jquery/no-hide`, `jquery/no-load`, `jquery/no-param`, `jquery/no-serialize`, `jquery/no-show`, `jquery/no-slide`, `jquery/no-toggle`.


## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
