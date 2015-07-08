$(document).on("page:change", function() {
  $("table.selectable-rows").each(function() {
    var $table = $(this);
    var $th = $('<th><span></span></th>');
    $(this).find("thead tr").prepend($th);
    $(this).find("tbody tr").prepend('<td><input type="checkbox" class="select-row-checkbox"></input></td>');
    $(this).find("tbody tr").each(function() {
      var tr = this;
      var $tr = $(tr);
      var $checkbox = $tr.find(".select-row-checkbox");
      $checkbox.prop('name', tr.id);
      $checkbox.prop('value', '1');
    });
    function updateHeaderIcon() {
      var $checkboxes = $table.find(".select-row-checkbox");
      var selectedCount = 0;
      $checkboxes.each(function() {
        var $tr = $(this).parents("tr");
        if(this.checked) {
          selectedCount++;
          $tr.addClass("selected-row");
        } else {
          $tr.removeClass("selected-row");
        }
      });
      $th.removeClass("all-selected none-selected some-selected");
      if(selectedCount == $checkboxes.length) {
        // All selected
        $th.addClass("all-selected");
      } else if(selectedCount === 0) {
        // None selected
        $th.addClass("none-selected");
      } else {
        // Some selected
        $th.addClass("some-selected");
      }
    }
    updateHeaderIcon();
    $(this).on("change", "input.select-row-checkbox", updateHeaderIcon);

    $table.find("input.select-row-checkbox").parent().on("click", function(e) {
      if(e.target.tagName != "INPUT") {
        $(this).children('input').click();
      }
    });
    $th.click(function(e) {
      var $checkboxes = $table.find(".select-row-checkbox");
      if($th.hasClass("all-selected")) {
        // If all are selected, select none
        $checkboxes.prop('checked', false);
      } else if($th.hasClass("none-selected")) {
        // If none are selected, select all
        $checkboxes.prop('checked', true);
      } else if($th.hasClass("some-selected")) {
        // If some are selected, select none
        $checkboxes.prop('checked', false);
      }
      $checkboxes.trigger("change"); // changing the checked property doesn't fire the change event
      updateHeaderIcon();
    });
  });
});
