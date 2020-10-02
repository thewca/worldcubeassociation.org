$(function() {
  $(".char-counter").each(function() {
    var maxLength = $(this).attr("maxlength");
    if (maxLength !== null) {
      var commentLength = document.createElement("p");
      commentLength.style.float = "right";
      $(this).parent("div").append(commentLength);
      $(this).on("input", function() {
        commentLength.innerText = this.value.length + "/" + maxLength;
      }).trigger("input");
    }
  });
});
