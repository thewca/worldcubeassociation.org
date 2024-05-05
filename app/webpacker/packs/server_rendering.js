// By default, this pack is loaded for server-side rendering.
// It must expose react_ujs as `ReactRailsUJS` and prepare a require context.
const componentRequireContext = require.context('components', true);
const ReactRailsUJS = require('react_ujs');

// This method "accidentally" sounds like a React Hook, but it's not!
// eslint-disable-next-line react-hooks/rules-of-hooks
ReactRailsUJS.useContext(componentRequireContext);
