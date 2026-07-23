import { CheckboxField, SelectField } from "payload";

export const colorPaletteSelect: SelectField = {
  name: "colorPalette",
  type: "select",
  required: true,
  interfaceName: "ColorPaletteSelect",
  options: [
    "blue",
    "red",
    "green",
    "orange",
    "yellow",
    { label: "white", value: "wcaWhite" },
  ],
};

export const newTabCheckbox: CheckboxField = {
  name: "newTab",
  type: "checkbox",
  admin: {
    description: "Open this link in a new tab",
  },
};

export const colorPaletteToneToggle: CheckboxField = {
  name: "colorPaletteDarker",
  type: "checkbox",
  admin: {
    description: "Use a slightly darker nuance of the color palette",
  },
};
