function selectize_competition_field(selector) {
  $(selector).attr("placeholder", "Pick a competition...");

  $(selector).selectize({
    create: false,
    render: {
      item: function(item, escape) {
        var text = item.text.split(" | ");
        return '<div>' + text[0] + '</div>';
      },
      option: function(item, escape) {
        var text = item.text.split(" | ");
        var label = text[0];
        var caption = text[2] + " (" + text[1] + ")";
        return '<div>' +
          '<span class="wca-selectify-label">' + label + '</span> <br />' +
          (caption ? '<span class="wca-selectify-caption">' + caption + '</span>' : '') +
          '</div>';
      }
    },
    maxItems: 1,
    maxOptions: 20,
    create: false
  });
}
