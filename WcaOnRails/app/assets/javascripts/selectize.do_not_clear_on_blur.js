// Copied from https://github.com/brianreavis/selectize.js/blob/043420284064ad998b07e1abd9720f56c86d6614/src/selectize.js#L602-L636
Selectize.define('do_not_clear_on_blur', function() {
  this.onBlur = function(e, dest) {
    var self = this;
    if (!self.isFocused) return;
    self.isFocused = false;

    if (self.ignoreFocus) {
      return;
    } else if (!self.ignoreBlur && document.activeElement === self.$dropdown_content[0]) {
      // necessary to prevent IE closing the dropdown when the scrollbar is clicked
      self.ignoreBlur = true;
      self.onFocus(e);
      return;
    }

    var deactivate = function() {
      self.close();
      //JFLY self.setTextboxValue('');
      self.setActiveItem(null);
      self.setActiveOption(null);
      self.setCaret(self.items.length);
      self.refreshState();

      // IE11 bug: element still marked as active
      (dest || document.body).focus();

      self.ignoreFocus = false;
      self.trigger('blur');
    };

    self.ignoreFocus = true;
    if (self.settings.create && self.settings.createOnBlur) {
      self.createItem(null, false, deactivate);
    } else {
      deactivate();
    }
  };
});
