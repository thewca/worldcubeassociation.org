module.exports = {
  extends: "stylelint-config-recommended-scss",
  rules: {
    "no-descending-specificity": null,
    "block-no-empty": null,
    "font-family-no-missing-generic-family-keyword": null,
    "scss/at-extend-no-missing-placeholder": null
  },
  ignoreFiles: ["WcaOnRails/app/assets/stylesheets/selectize.default.css"]
};
