onPage('posts#new, posts#create, posts#edit, posts#update', function() {
  $('input[name="post[sticky]"]').on('change', function() {
    var sticky = this.checked;
    $('.date_picker.post_unstick_at').toggle(sticky);
  }).trigger('change');
});
