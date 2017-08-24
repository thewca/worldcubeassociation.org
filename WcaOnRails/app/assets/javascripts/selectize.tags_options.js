function defaultSelectizeOptions(options) {
  return {
    plugins: ['remove_button'],
    delimiter: ',',
    persist: false,
    options: options,
    create: function(input) {
      return {
        value: input,
        text: input
      };
    },
  };
}
