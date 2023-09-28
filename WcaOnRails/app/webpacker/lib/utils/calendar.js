const HEX_BASE = 16;
const HEX_CHANNEL_REGEX = /^#(?<r>[0-9A-Fa-f]{2})(?<g>[0-9A-Fa-f]{2})(?<b>[0-9A-Fa-f]{2})$/;

/**
 * Convert a HEX color code to RGB values.
 *
 * @example
 * // returns [255, 255, 255]
 * getTextColor('#ffffff');
 *
 * @param {string} hexColor HEX color code to convert to RGB
 *
 * @returns {Array<number>} RBG values, defaults to `[0, 0, 0]` if `hexColor` cannot be parsed
 */
export const hexToRgb = (hexColor) => {
  const match = hexColor.match(HEX_CHANNEL_REGEX);

  if (match !== null) {
    return [
      parseInt(match.groups.r, HEX_BASE),
      parseInt(match.groups.g, HEX_BASE),
      parseInt(match.groups.b, HEX_BASE),
    ];
  }

  return [0, 0, 0];
};

const WHITE = '#ffffff';
const BLACK = '#000000';

/**
 * Compute appropriate text color (black or white) based on how "light" or "dark"
 * the background color of a calendar item is.
 *
 * @example
 * // returns #000000 (black given white background color)
 * getTextColor('#ffffff');
 *
 * @param {string} backgroundColor Calendar item's background color (in HEX)
 *
 * @returns {string} white for "dark" backgrounds, black for "light" backgrounds
 */
export const getTextColor = (backgroundColor) => {
  const [red, green, blue] = hexToRgb(backgroundColor);
  // formula from https://stackoverflow.com/a/3943023
  return (red * 0.299 + green * 0.587 + blue * 0.114) > 186 ? BLACK : WHITE;
};
