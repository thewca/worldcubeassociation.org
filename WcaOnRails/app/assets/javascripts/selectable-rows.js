$(function() {
  $("table.selectable-rows").each(function() {
    var $table = $(this);
    var $th = $table.find("thead th:first-child");

    var $checkboxes = $table.find(".select-row-checkbox");
    var $trs = $checkboxes.parents("tr");
    var selectedCount = $table.find(".select-row-checkbox:checked").length;
    function updateHeaderIcon() {
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
    $(this).on("change", "input.select-row-checkbox", function() {
      var $tr = $(this).parents("tr");
      if(this.checked) {
        selectedCount++;
        $tr.addClass("selected-row");
      } else {
        selectedCount--;
        $tr.removeClass("selected-row");
      }
      updateHeaderIcon();
    });

    $table.find("input.select-row-checkbox").parent().on("click", function(e) {
      if(e.target.tagName != "INPUT") {
        $(this).children('input').click();
      }
    });
    $th.click(function(e) {
      if($th.hasClass("all-selected")) {
        // If all are selected, select none
        $checkboxes.prop('checked', false);
        $trs.removeClass("selected-row");
        selectedCount = 0;
      } else if($th.hasClass("none-selected")) {
        // If none are selected, select all
        $checkboxes.prop('checked', true);
        $trs.addClass("selected-row");
        selectedCount = $checkboxes.length;
      } else if($th.hasClass("some-selected")) {
        // If some are selected, select none
        $checkboxes.prop('checked', false);
        $trs.removeClass("selected-row");
        selectedCount = 0;
      }
      $table.trigger("select-all-none-click");
      updateHeaderIcon();
    });
  });
});
