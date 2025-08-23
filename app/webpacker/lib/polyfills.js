import 'whatwg-fetch';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// There's a bug in Shakapacker <= 8.2.0 that pins a terribly old CoreJS version inside Babel.
// We have installed a newer CoreJS version correctly, but its nice features "go to waste".
// Until their fix is released, we force some polyfills manually.
//   (cf. https://github.com/shakacode/shakapacker/pull/556/files)
import 'core-js/es/typed-array/to-sorted';
import 'core-js/es/array/to-sorted';
import 'core-js/es/typed-array/to-reversed';
import 'core-js/es/array/to-reversed';
