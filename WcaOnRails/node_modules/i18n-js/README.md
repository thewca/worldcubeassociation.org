<p align="center">
  <img width="250" height="58" src="https://github.com/fnando/i18n-js/raw/main/images/i18njs.png" alt="i18n.js">
</p>

<p align="center">
  A small library to provide the <a href="https://rubygems.org/gems/i18n">i18n</a> translations on the JavaScript.
</p>

<p align="center">
  <a href="https://github.com/fnando/i18n/actions?query=workflow%3Ajs-tests"><img src="https://github.com/fnando/i18n/workflows/js-tests/badge.svg" alt="Tests"></a>
  <a href="https://www.npmjs.com/package/i18n-js"><img src="https://img.shields.io/npm/v/i18n-js/latest.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/i18n-js"><img src="https://img.shields.io/npm/dt/i18n-js.svg" alt="npm downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

## Installation

- Yarn: `yarn add i18n-js@latest`
- NPM: `npm install i18n-js@latest`

## Usage

### Setting up

First, you need to instantiate `I18n` with the translations' object, the main
class of this library.

```js
import { I18n } from "i18n-js";
import translations from "./translations.json";

const i18n = new I18n(translations);
```

The `translations` object is a direct export of translations defined by
[Ruby on Rails](https://guides.rubyonrails.org/i18n.html). To export the
translations, you can use [i18n-js](https://github.com/fnando/i18n-js), a Ruby
gem that's completely disconnected from Rails and that can be used for the
solely purpose of exporting the translations, even if your project is written in
a different language. If all you care about is some basic translation mechanism,
then you can set the object like this:

```js
const i18n = new I18n({
  en: {
    hello: "Hi!",
  },
  "pt-BR": {
    hello: "Olá!",
  },
});
```

Each root key is a different locale that may or may not have the script code.
This library also supports locales with region code, like `zh-Hant-TW`.

Once everything is set up, you can then define the locale. `en` is both the
current and default locale. To override either values, you have to use
`I18n#defaultLocale` and `I18n#locale`.

```js
i18n.defaultLocale = "pt-BR";
i18n.locale = "pt-BR";
```

#### Base translations

This library comes bundled with all base translations made available by
[rails-i18n](https://github.com/svenfuchs/rails-i18n/tree/master/rails/locale).
Base translations allow formatting date, numbers, and sentence connectors, among
other things.

To load the base translations, use something like the following:

```js
import { I18n } from "i18n-js";
import ptBR from "i18n-js/json/pt-BR.json";
import en from "i18n-js/json/en.json";

const i18n = new I18n({
  ...ptBR,
  ...en,
});
```

### Updating translation store

Updating the translation store is trivial. All you have to do is calling
`I18n#store` with the translations that need to be merged. Let's assume you've
exported all your app's translations using
[i18n-js](https://github.com/fnando/i18n-js) CLI, using a separate file for each
language, like this:

- `translations/en.json`
- `translations/pt-BR.json`

This is how you could update the store:

```js
import { I18n } from "i18n-js";
import ptBR from "translations/pt-BR.json";
import en from "translations/en.json";

const i18n = new I18n();

i18n.store(en);
i18n.store(ptBR);
```

This method will allow you to lazy load translations and them updating the store
as needed.

```js
import { I18n } from "i18n-js";

async function loadTranslations(i18n, locale) {
  const response = await fetch(`/translations/${locale}.json`);
  const translations = await response.json();

  i18n.store(translations);
}

const i18n = new I18n();
loadTranslations(i18n, "es");
```

### Events

A change event is triggered whenever `I18n#store` or `I18n#update` is called, or
when `I18n#locale`/`I18n#defaultLocale` is set. To subscribe to these changes,
use the method `I18n#onChange(i18n: I18n)`.

```js
const i18n = new I18n();
i18n.onChange(() => {
  console.log("I18n has changed!");
});
```

Every change will increment the property `I18n#version`, so you can use it as a
cache key. Also, when you subscribe to change events,
`I18n#onChange(i18n: I18n)` will return another function that can be used to
remove the event handler.

```js
useEffect(() => {
  const unsubscribe = i18n.onChange(() => {
    // do something
  });

  return unsubscribe;
}, []);

useEffect(() => {
  console.log("I18n has been updated!");
}, [i18n.version]);
```

### Translating messages

To translate messages, you have to use the `I18n#translate`, or its `I18n#t`
alias.

```js
i18n.locale = "en";
i18n.t("hello"); //=> Hi!

i18n.locale = "pt-BR";
i18n.t("hello"); //=> Olá!
```

You can also provide an array as scope. Both calls below are equivalent.

```js
i18n.t(["greetings", "hello"]);
i18n.t("greetings.hello");
```

Your translations may have dynamic values that should be interpolated. Here's a
greeting message that takes a name:

```js
const i18n = new I18n({
  en: { greetings: "Hi, %{name}!" },
  "pt-BR": { greetings: "Olá, %{name}!" },
});

i18n.t("greetings", { name: "John" });
```

If the translation is an array and the entry is a string, values will be
interpolated in a shallow way.

```js
const i18n = new I18n({
  en: { messages: ["Hello there!", "Welcome back, %{name}!"] },
});

i18n.t("messages", { name: "John" });
//=> ["Hello there!", "Welcome back, John!"]
```

You may want to override the default
[`interpolate`](https://github.com/fnando/i18n/blob/main/src/helpers/interpolate.ts)
function with your own, if for instance you want these dynamic values to be
React elements:

```jsx
const i18n = new I18n({
  en: { greetings: "Hi, %{name}!" },
  "pt-BR": { greetings: "Olá, %{name}!" },
});

i18n.interpolate = (i18n, message, options) => {
  // ...
};

return <Text>{i18n.t("greetings", { name: <BoldText>John</BoldText> })}</Text>;
```

#### Missing translations

A translation may be missing. In that case, you may set the default value that's
going to be returned.

```js
i18n.t("missing.scope", { defaultValue: "This is a default message" });
```

Default messages can also have interpolation.

```js
i18n.t("noun", { defaultValue: "I'm a {{noun}}", noun: "Mac" });
```

Alternatively, you can define a list of scopes that will be searched instead.

```js
// As a scope
i18n.t("some.missing.scope", { defaults: [{ scope: "some.existing.scope" }] });

// As a simple translation
i18n.t("some.missing.scope", { defaults: [{ message: "Some message" }] });
```

Default values must be provided as an array of objects where the key is the type
of desired translation, a `scope` or a `message`. The returned translation will
be either the first scope recognized, or the first message defined.

The translation will fall back to the `defaultValue` translation if no scope in
`defaults` matches and if no `message` default is found.

You can enable translation fallback with `I18n#enableFallback`.

```js
i18n.enableFallback = true;
```

By default missing translations will first be looked for in less specific
versions of the requested locale and if that fails by taking them from your
`I18n#defaultLocale`.

```js
// if i18n.defaultLocale = "en" and translation doesn't exist
// for i18n.locale = "de-DE" this key will be taken from "de" locale scope
// or, if that also doesn't exist, from "en" locale scope
i18n.t("some.missing.scope");
```

Custom fallback rules can also be specified for a specific language. There are
three different ways of doing it so. In any case, the locale handler must be
registered using `i18n.locales.register()`.

```js
// Using an array
i18n.locales.register("no", ["nb", "en"]);

// Using a string
i18n.locales.no.register("nb");

// Using a function.
i18n.locales.no.register((locale) => ["nb"]);
```

By default a missing translation will be displayed as
`[missing "name of scope" translation]`. You can override this behavior by
setting `i18n.missingBehavior` to `"guess"`.

```js
i18n.missingBehavior = "guess";
```

The "guess" behavior will take the last section of the scope and apply some
replace rules; camel case becomes lower case and underscores are replaced with
space. In practice, it means that a scope like
`questionnaire.whatIsYourFavorite_ChristmasPresent` becomes
`what is your favorite Christmas present`.

There's also a strategy called `error`, which will throw an exception every time
you fetch a missing translation. This is great for development. It'll even end
up on your error tracking!

```js
i18n.missingBehavior = "error";
```

To detect missing translations, you can also set
`i18n.missingTranslationPrefix`.

```js
i18n.missingTranslationPrefix = "EE: ";
```

The same `questionnaire.whatIsYourFavorite_ChristmasPresent` scope would
converted into `EE: what is your favorite Christmas present`. This is helpful if
you want to add a check to your automated tests.

If you need to specify a missing behavior just for one call, you can provide a
custom `missingBehavior` option.

```js
i18n.t("missing.key", { missingBehavior: "error" });
```

You can completely override the missing translation strategy by setting it to a
function. The following example will return `null` for every missing
translation.

```js
i18n.missingTranslation = () => null;
```

Finally, you can also create your own missing translation behavior. The example
below registers a new behavior that returns an empty string in case a
translation is missing.

```js
i18n.missingTranslation.register("empty", (i18n, scope, options) => "");
```

#### Pluralization

This library has support for pluralization and by default works with English,
and similar pluralized languages like Portuguese.

First, you have to define your translations with special keywords defined by the
pluralization handler. The default keywords are `zero`, `one`, and `other`.

```js
const i18n = new I18n({
  en: {
    inbox: {
      zero: "You have no messages",
      one: "You have one message",
      other: "You have %{count} messages",
    },
  },

  "pt-BR": {
    inbox: {
      zero: "Você não tem mensagens",
      one: "Você tem uma mensagem",
      other: "Você tem %{count} mensagens",
    },
  },
});
```

To retrieve the pluralized translation you must provide the `count` option with
a numeric value.

```js
i18n.t("inbox", { count: 0 }); //=> You have no messages
i18n.t("inbox", { count: 1 }); //=> You have one message
i18n.t("inbox", { count: 2 }); //=> You have 2 messages
```

You may need to define new rules for other languages like Russian. This can be
done by registering a handler with `i18n.pluralization.register()`. The
following example defines a Russian pluralizer.

```js
i18n.pluralization.register("ru", (_i18n, count) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let key;

  const one = mod10 === 1 && mod100 !== 11;
  const few = [2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100);
  const many =
    mod10 === 0 ||
    [5, 6, 7, 8, 9].includes(mod10) ||
    [11, 12, 13, 14].includes(mod100);

  if (one) {
    key = "one";
  } else if (few) {
    key = "few";
  } else if (many) {
    key = "many";
  } else {
    key = "other";
  }

  return [key];
});
```

You can find all rules on
[http://www.unicode.org/](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html).

You can also leverage [make-plural](https://github.com/eemeli/make-plural/),
rather than writing all your pluralization functions. For this, you must wrap
make-plural's function by using
`useMakePlural({ pluralizer, includeZero, ordinal })`:

```js
import { ru } from "make-plural";
import { useMakePlural } from "i18n-js";

i18n.pluralization.register("ru", useMakePlural({ pluralizer: ru }));
```

#### Other options

If you're providing the same scope again and again, you can reduce the
boilerplate by setting the `scope` option.

```js
const options = { scope: "activerecord.attributes.user" };

i18n.t("name", options);
i18n.t("email", options);
i18n.t("username", options);
```

### Number Formatting

Similar to Rails helpers, you can have localized number and currency formatting.

```js
i18n.l("currency", 1990.99);
// $1,990.99

i18n.l("number", 1990.99);
// 1,990.99

i18n.l("percentage", 123.45);
// 123.450%
```

To have more control over number formatting, you can use the
`I18n#numberToHuman`, `I18n#numberToPercentage`, `I18n#numberToCurrency`,
`I18n#numberToHumanSize`, `I18n#numberToDelimited` and `I18n#numberToRounded`
functions.

#### `I18n#numberToCurrency`

Formats a `number` into a currency string (e.g., $13.65). You can customize the
format in the using an `options` object.

The currency unit and number formatting of the current locale will be used
unless otherwise specified in the provided options. No currency conversion is
performed. If the user is given a way to change their locale, they will also be
able to change the relative value of the currency displayed with this helper.

##### Options

- `precision` - Sets the level of precision (defaults to 2).
- `roundMode` - Determine how rounding is performed (defaults to `default`.)
- `unit` - Sets the denomination of the currency (defaults to "$").
- `separator` - Sets the separator between the units (defaults to ".").
- `delimiter` - Sets the thousands delimiter (defaults to ",").
- `format` - Sets the format for non-negative numbers (defaults to "%u%n").
  Fields are `%u` for the currency, and `%n` for the number.
- `negativeFormat` - Sets the format for negative numbers (defaults to
  prepending a hyphen to the formatted number given by `format`). Accepts the
  same fields than `format`, except `%n` is here the absolute value of the
  number.
- `stripInsignificantZeros` - If `true` removes insignificant zeros after the
  decimal separator (defaults to `false`).
- `raise` - If `true`, raises exception for non-numeric values like NaN and
  Infinite values.

##### Examples

```js
i18n.numberToCurrency(1234567890.5);
// => "$1,234,567,890.50"

i18n.numberToCurrency(1234567890.506);
// => "$1,234,567,890.51"

i18n.numberToCurrency(1234567890.506, { precision: 3 });
// => "$1,234,567,890.506"

i18n.numberToCurrency("123a456");
// => "$123a456"

i18n.numberToCurrency("123a456", { raise: true });
// => raises exception ("123a456" is not a valid numeric value)

i18n.numberToCurrency(-0.456789, { precision: 0 });
// => "$0"

i18n.numberToCurrency(-1234567890.5, { negativeFormat: "(%u%n)" });
// => "($1,234,567,890.50)"

i18n.numberToCurrency(1234567890.5, {
  unit: "&pound;",
  separator: ",",
  delimiter: "",
});
// => "&pound;1234567890,50"

i18n.numberToCurrency(1234567890.5, {
  unit: "&pound;",
  separator: ",",
  delimiter: "",
  format: "%n %u",
});
// => "1234567890,50 &pound;"

i18n.numberToCurrency(1234567890.5, { stripInsignificantZeros: true });
// => "$1,234,567,890.5"

i18n.numberToCurrency(1234567890.5, { precision: 0, roundMode: "up" });
// => "$1,234,567,891"
```

#### `I18n#numberToPercentage`

Formats a `number` as a percentage string (e.g., 65%). You can customize the
format in the `options` hash.

##### Options

- `precision` - Sets the level of precision (defaults to 3).
- `roundMode` - Determine how rounding is performed (defaults to `default`.)
- `separator` - Sets the separator between the units (defaults to ".").
- `delimiter` - Sets the thousands delimiter (defaults to "").
- `format` - Sets the format for non-negative numbers (defaults to "%n%"). The
  number field is represented by `%n`.
- `negativeFormat` - Sets the format for negative numbers (defaults to
  prepending a hyphen to the formatted number given by `format`). Accepts the
  same fields than `format`, except `%n` is here the absolute value of the
  number.
- `stripInsignificantZeros` - If `true` removes insignificant zeros after the
  decimal separator (defaults to `false`).

##### Examples

```js
i18n.numberToPercentage(100);
// => "100.000%"

i18n.numberToPercentage("98");
// => "98.000%"

i18n.numberToPercentage(100, { precision: 0 });
// => "100%"

i18n.numberToPercentage(1000, { delimiter: ".", separator: "," });
// => "1.000,000%"

i18n.numberToPercentage(302.24398923423, { precision: 5 });
// => "302.24399%"

i18n.numberToPercentage(1000, { precision: null });
// => "1000%"

i18n.numberToPercentage("98a");
// => "98a%"

i18n.numberToPercentage(100, { format: "%n  %" });
// => "100.000  %"

i18n.numberToPercentage(302.24398923423, { precision: 5, roundMode: "down" });
// => "302.24398%"
```

#### `I18n#numberToDelimited`

Formats a `number` with grouped thousands using `delimiter` (e.g., 12,324). You
can customize the format in the `options` object.

##### Options

- `delimiter` - Sets the thousands delimiter (defaults to ",").
- `separator` - Sets the separator between the fractional and integer digits
  (defaults to ".").
- `delimiterPattern` - Sets a custom regular expression used for deriving the
  placement of delimiter. Helpful when using currency formats like INR. The
  regular expression must be global (i.e. it has the `g` flag).

##### Examples

```js
i18n.numberToDelimited(12345678);
// => "12,345,678"

i18n.numberToDelimited("123456");
// => "123,456"

i18n.numberToDelimited(12345678.05);
// => "12,345,678.05"

i18n.numberToDelimited(12345678, { delimiter: "." });
// => "12.345.678"

i18n.numberToDelimited(12345678, { delimiter: "," });
// => "12,345,678"

i18n.numberToDelimited(12345678.05, { separator: " " });
// => "12,345,678 05"

i18n.numberToDelimited("112a");
// => "112a"

i18n.numberToDelimited(98765432.98, { delimiter: " ", separator: "," });
// => "98 765 432,98"

i18n.numberToDelimited("123456.78", {
  delimiterPattern: /(\d+?)(?=(\d\d)+(\d)(?!\d))/g,
});
// => "1,23,456.78"
```

#### `I18n#numberToRounded`

Formats a `number` with the specified level of `precision` (e.g., 112.32 has a
precision of 2 if `significant` is `false`, and 5 if `significant` is `true`).
You can customize the format in the `options` object.

##### Options

- `locale` - Sets the locale to be used for formatting (defaults to current
  locale).
- `precision` - Sets the precision of the number (defaults to 3). Keeps the
  number's precision if `null`.
- `RoundMode` - Determine how rounding is performed (defaults to :default).
- `significant` - If `true`, precision will be the number of significant_digits.
  If `false`, the number of fractional digits (defaults to `false`).
- `separator` - Sets the separator between the fractional and integer digits
  (defaults to ".").
- `delimiter` - Sets the thousands delimiter (defaults to "").
- `stripInsignificantZeros` - If `true` removes insignificant zeros after the
  decimal separator (defaults to `false`).

##### Examples

```js
i18n.numberToRounded(111.2345);
// => "111.235"

i18n.numberToRounded(111.2345, { precision: 2 });
// => "111.23"

i18n.numberToRounded(13, { precision: 5 });
// => "13.00000"

i18n.numberToRounded(389.32314, { precision: 0 });
// => "389"

i18n.numberToRounded(111.2345, { significant: true });
// => "111"

i18n.numberToRounded(111.2345, { precision: 1, significant: true });
// => "100"

i18n.numberToRounded(13, { precision: 5, significant: true });
// => "13.000"

i18n.numberToRounded(13, { precision: null });
// => "13"

i18n.numberToRounded(389.32314, { precision: 0, roundMode: "up" });
// => "390"

i18n.numberToRounded(13, {
  precision: 5,
  significant: true,
  stripInsignificantZeros: true,
});
// => "13"

i18n.numberToRounded(389.32314, { precision: 4, significant: true });
// => "389.3"

i18n.numberToRounded(1111.2345, {
  precision: 2,
  separator: ",",
  delimiter: ".",
});
// => "1.111,23"
```

#### `I18n#numberToHumanSize`

Formats the bytes in `number` into a more understandable representation (e.g.,
giving it 1500 yields 1.46 KB). This method is useful for reporting file sizes
to users. You can customize the format in the `options` object.

See `I18n#numberToHuman` if you want to pretty-print a generic number.

##### Options

- `precision` - Sets the precision of the number (defaults to 3).
- `roundMode` - Determine how rounding is performed (defaults to `default`)
- `significant` - If `true`, precision will be the number of significant_digits.
  If `false`, the number of fractional digits (defaults to `true`)
- `separator` - Sets the separator between the fractional and integer digits
  (defaults to ".").
- `delimiter` - Sets the thousands delimiter (defaults to "").
- `stripInsignificantZeros` - If `true` removes insignificant zeros after the
  decimal separator (defaults to `true`)

##### Examples

```js
i18n.numberToHumanSize(123)
// => "123 Bytes"

i18n.numberToHumanSize(1234)
// => "1.21 KB"

i18n.numberToHumanSize(12345)
// => "12.1 KB"

i18n.numberToHumanSize(1234567)
// => "1.18 MB"

i18n.numberToHumanSize(1234567890)
// => "1.15 GB"

i18n.numberToHumanSize(1234567890123)
// => "1.12 TB"

i18n.numberToHumanSize(1234567890123456)
// => "1.1 PB"

i18n.numberToHumanSize(1234567890123456789)
// => "1.07 EB"

i18n.numberToHumanSize(1234567, {precision: 2})
// => "1.2 MB"

i18n.numberToHumanSize(483989, precision: 2)
// => "470 KB"

i18n.numberToHumanSize(483989, {precision: 2, roundMode: "up"})
// => "480 KB"

i18n.numberToHumanSize(1234567, {precision: 2, separator: ","})
// => "1,2 MB"

i18n.numberToHumanSize(1234567890123, {precision: 5})
// => "1.1228 TB"

i18n.numberToHumanSize(524288000, {precision: 5})
// => "500 MB"
```

#### `I18n#numberToHuman`

Pretty prints (formats and approximates) a number in a way it is more readable
by humans (e.g.: 1200000000 becomes "1.2 Billion"). This is useful for numbers
that can get very large (and too hard to read).

See `I18n#numberToHumanSize` if you want to print a file size.

You can also define your own unit-quantifier names if you want to use other
decimal units (e.g.: 1500 becomes "1.5 kilometers", 0.150 becomes "150
milliliters", etc). You may define a wide range of unit quantifiers, even
fractional ones (centi, deci, mili, etc).

##### Options

- `precision` - Sets the precision of the number (defaults to 3).
- `roundMode` - Determine how rounding is performed (defaults to `default`).
- `significant` - If `true`, precision will be the number of significant_digits.
  If `false`, the number of fractional digits (defaults to `true`)
- `separator` - Sets the separator between the fractional and integer digits
  (defaults to ".").
- `delimiter` - Sets the thousands delimiter (defaults to "").
- `stripInsignificantZeros` - If `true` removes insignificant zeros after the
  decimal separator (defaults to `true`)
- `units` - A Hash of unit quantifier names. Or a string containing an i18n
  scope where to find this hash. It might have the following keys:
  - _integers_: `unit`, `ten`, `hundred`, `thousand`, `million`, `billion`,
    `trillion`, `quadrillion`
  - _fractionals_: `deci`, `centi`, `mili`, `micro`, `nano`, `pico`, `femto`
- `format` - Sets the format of the output string (defaults to "%n %u"). The
  field types are:
  - %u - The quantifier (ex.: 'thousand')
  - %n - The number

##### Examples

```js
i18n.numberToHuman(123);
// => "123"

i18n.numberToHuman(1234);
// => "1.23 Thousand"

i18n.numberToHuman(12345);
// => "12.3 Thousand"

i18n.numberToHuman(1234567);
// => "1.23 Million"

i18n.numberToHuman(1234567890);
// => "1.23 Billion"

i18n.numberToHuman(1234567890123);
// => "1.23 Trillion"

i18n.numberToHuman(1234567890123456);
// => "1.23 Quadrillion"

i18n.numberToHuman(1234567890123456789);
// => "1230 Quadrillion"

i18n.numberToHuman(489939, { precision: 2 });
// => "490 Thousand"

i18n.numberToHuman(489939, { precision: 4 });
// => "489.9 Thousand"

i18n.numberToHuman(489939, { precision: 2, roundMode: "down" });
// => "480 Thousand"

i18n.numberToHuman(1234567, { precision: 4, significant: false });
// => "1.2346 Million"

i18n.numberToHuman(1234567, {
  precision: 1,
  separator: ",",
  significant: false,
});
// => "1,2 Million"

i18n.numberToHuman(500000000, { precision: 5 });
// => "500 Million"

i18n.numberToHuman(12345012345, { significant: false });
// => "12.345 Billion"
```

Non-significant zeros after the decimal separator are stripped out by default
(set `stripInsignificantZeros` to `false` to change that):

```js
i18n.numberToHuman(12.00001);
// => "12"

i18n.numberToHuman(12.00001, { stripInsignificantZeros: false });
// => "12.0"
```

You can also use your own custom unit quantifiers:

```js
i18n.numberToHuman(500000, units: { unit: "ml", thousand: "lt" })
// => "500 lt"
```

If in your I18n locale you have:

```yaml
---
en:
  distance:
    centi:
      one: "centimeter"
      other: "centimeters"
    unit:
      one: "meter"
      other: "meters"
    thousand:
      one: "kilometer"
      other: "kilometers"
    billion: "gazillion-distance"
```

Then you could do:

```js
i18n.numberToHuman(543934, { units: "distance" });
// => "544 kilometers"

i18n.numberToHuman(54393498, { units: "distance" });
// => "54400 kilometers"

i18n.numberToHuman(54393498000, { units: "distance" });
// => "54.4 gazillion-distance"

i18n.numberToHuman(343, { units: "distance", precision: 1 });
// => "300 meters"

i18n.numberToHuman(1, { units: "distance" });
// => "1 meter"

i18n.numberToHuman(0.34, { units: "distance" });
// => "34 centimeters"
```

### Date Formatting

The `I18n#localize` (or its alias `I18n#l`) can accept a string, epoch time
integer or a `Date` object. You can see below the accepted formats:

```js
// yyyy-mm-dd
i18n.l("date.formats.short", "2009-09-18");

// yyyy-mm-dd hh:mm:ss
i18n.l("time.formats.short", "2009-09-18 23:12:43");

// JSON format with local Timezone (part of ISO-8601)
i18n.l("time.formats.short", "2009-11-09T18:10:34");

// JSON format in UTC (part of ISO-8601)
i18n.l("time.formats.short", "2009-11-09T18:10:34Z");

// Epoch time
i18n.l("date.formats.short", 1251862029000);

// mm/dd/yyyy
i18n.l("date.formats.short", "09/18/2009");

// Date object
i18n.l("date.formats.short", new Date());
```

You can also add placeholders to the date format:

```js
const i18n = new I18n({
  date: {
    formats: {
      ordinalDay: "%B %{day}",
    },
  },
});

i18n.l("date.formats.ordinalDay", "2009-09-18", { day: "18th" }); // Sep 18th
```

If you prefer, you can use the `I18n#toTime` and `I18n#strftime` functions
directly to format dates.

```js
var date = new Date();
i18n.toTime("date.formats.short", "2009-09-18");
i18n.toTime("date.formats.short", date);
i18n.strftime(date, "%d/%m/%Y");
```

The accepted formats for `i18n.strftime` are:

```
%a  - The abbreviated weekday name (Sun)
%A  - The full weekday name (Sunday)
%b  - The abbreviated month name (Jan)
%B  - The full month name (January)
%c  - The preferred local date and time representation
%d  - Day of the month (01..31)
%-d - Day of the month (1..31)
%H  - Hour of the day, 24-hour clock (00..23)
%-H - Hour of the day, 24-hour clock (0..23)
%k  - Hour of the day, 24-hour clock (0..23)
%I  - Hour of the day, 12-hour clock (01..12)
%-I - Hour of the day, 12-hour clock (1..12)
%l  - Hour of the day, 12-hour clock (1..12)
%m  - Month of the year (01..12)
%-m - Month of the year (1..12)
%M  - Minute of the hour (00..59)
%-M - Minute of the hour (0..59)
%p  - Meridian indicator (AM  or  PM)
%P  - Meridian indicator (am  or  pm)
%S  - Second of the minute (00..60)
%-S - Second of the minute (0..60)
%w  - Day of the week (Sunday is 0, 0..6)
%y  - Year without a century (00..99)
%-y - Year without a century (0..99)
%Y  - Year with century
%z  - Timezone offset (+0545)
%Z  - Timezone offset (+0545)
```

Check out
[\_\_tests\_\_/strftime.test.ts](https://github.com/fnando/i18n/blob/main/__tests__/strftime.test.ts)
file for more examples!

Finally, you can also diplay relative time strings using `I18n#timeAgoInWords`.

```js
const to = new Date();
const from = to.getTime() - 60 * 60 * 1000; // ~1h ago.

i18n.timeAgoInWords(from, to);
//=> about 1 hour
```

#### Using pluralization and number formatting together

Sometimes you might want to display translation with formatted number, like
adding thousand delimiters to displayed number You can do this:

```js
const i18n = new I18n({
  en: {
    points: {
      one: "1 Point",
      other: "{{points}} Points",
    },
  },
});

const points = 1234;

i18n.t("points", {
  count: points,
  points: i18n.formatNumber(points),
});
```

Output should be `1,234 points`.

### Other helpers

#### `I18n#toSentence(list, options)`

```js
i18n.toSentence(["apple", "banana", "pineapple"]);
//=> apple, banana, and pineapple.
```

## Troubleshooting

### I'm getting an error like `Unable to resolve "make-plural" from "node modules/i18n-js/dist/import/Pluralization.js"`

[make-plural](https://www.npmjs.com/package/make-plural) uses `.mjs` files. You
need to change your build pipeline to also consider these files.

If you're using [react-native](https://reactnative.dev), you need to change your
metro config to consider `.mjs`. Try doing something like this (you may need to
adapt your code based on existing changes).

```js
const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
  const {
    resolver: { assetExts, sourceExts },
  } = await getDefaultConfig();

  return {
    resolver: {
      sourceExts: [...sourceExts, "mjs"],
    },
  };
})();
```

### I'm getting an error like `SyntaxError: Unexpected end of JSON input` or `Uncaught SyntaxError: Unexpected token ;`

You may get such error if you're trying to load empty JSON files with
`import data from "file.json"`. This has nothing to do with I18n and is related
to how your JSON file is loaded. **JSON files must contain valid JSON data.**

Similarly, make sure you're writing valid JSON, and not JavaScript. For
instance, if you write something like `{};`, you'll get an error like
`Uncaught SyntaxError: Unexpected token ;`.

### My JSON contains a flat structure. How can I load and use it with I18n.js?

I18n.js expects a nested object to represent the translation tree. For this
reason, you cannot use an object like the following by default:

```json
{
  "en.messages.hello": "hello",
  "pt-BR.messages.hello": "olá"
}
```

One solution is using something like the following to transform your flat into a
nested object:

```js
const { set } = require("lodash");

const from = {
  "en.messages.hello": "hello",
  "pt-BR.messages.hello": "olá",
};

function flatToNestedObject(target) {
  const nested = {};

  Object.keys(target).forEach((path) => set(nested, path, target[path]));

  return nested;
}

console.log(flatToNestedObject(from));
// {
//   en: { messages: { hello: 'hello' } },
//   'pt-BR': { messages: { hello: 'olá' } }
// }
```

You can also use something like [flat](https://github.com/hughsk/flat) to
perform the same transformation.

## Maintainer

- [Nando Vieira](https://github.com/fnando)

## Contributors

- https://github.com/fnando/i18n/contributors

## Contributing

For more details about how to contribute, please read
https://github.com/fnando/i18n/blob/main/CONTRIBUTING.md.

## License

The gem is available as open source under the terms of the
[MIT License](https://opensource.org/licenses/MIT). A copy of the license can be
found at https://github.com/fnando/i18n/blob/main/LICENSE.md.

## Code of Conduct

Everyone interacting in the i18n project's codebases, issue trackers, chat rooms
and mailing lists is expected to follow the
[code of conduct](https://github.com/fnando/i18n/blob/main/CODE_OF_CONDUCT.md).
