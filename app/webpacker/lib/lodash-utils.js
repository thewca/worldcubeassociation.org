import _ from 'lodash';

// This file is very awkward.
// Because we have two parallel pipelines to handle our js assets
// (rails sprockets and shakapacker aka. webpack), we have dependencies issues.
// Both need lodash, but we need to put it in webpack dependencies,
// and webpack's application pack needs to be included after the sprockets one
// (because it has jquery...).
// Therefore we have a few helper here, until we port everything to webpack.

window.wca.lodashDiff = (a, b) => _.difference(a, b);

window.wca.lodashDebounce = (a, b) => _.debounce(a, b);

window.wca.lodashUniq = (a) => _.uniq(a);
window.wca.lodashExtend = (a, b, c) => _.extend(a, b, c);
