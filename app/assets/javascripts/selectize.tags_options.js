window.wca.defaultSelectizeOptions = function(select_options) {
  return {
    plugins: ['remove_button'],
    delimiter: ',',
    persist: false,
    options: select_options,
    create: function(input) {
      return {
        value: input,
        text: input
      };
    },
  };
};
