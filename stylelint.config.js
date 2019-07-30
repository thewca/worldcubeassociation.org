module.exports = {
  extends: "stylelint-config-recommended-scss",
  rules: {
    "no-descending-specificity": null,
    "block-no-empty": null,
    "font-family-no-missing-generic-family-keyword": null
  },
  ignoreFiles: ["WcaOnRails/app/assets/stylesheets/selectize.default.css"]
};
