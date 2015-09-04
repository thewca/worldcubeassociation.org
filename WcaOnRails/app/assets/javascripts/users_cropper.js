var CarrierWaveCropper = (function() {
  function CarrierWaveCropper() {
    var that = this;
    this.updatePreview = this.updatePreview.bind(this);
    this.update = this.update.bind(this);

    $('#user_avatar_cropbox').Jcrop({
      aspectRatio: 1,
      boxWidth: 400, boxHeight: 400,
      onSelect: this.update,
      onChange: this.update,
    }, function() {
      that.jcrop_api = this;
      that.jcrop_api.disable();
      $('#user_avatar_previewbox_wrapper').hide();
    });
    $('#avatar_thumbnail').click(function() {
      that.jcrop_api.enable();
      that.jcrop_api.setSelect([0, 0, 200, 200]);
      $('#avatar_thumbnail').hide();
      $('#user_avatar_previewbox_wrapper').show();
    });
  }

  CarrierWaveCropper.prototype.update = function(coords) {
    $('#user_avatar_crop_x').val(coords.x);
    $('#user_avatar_crop_y').val(coords.y);
    $('#user_avatar_crop_w').val(coords.w);
    $('#user_avatar_crop_h').val(coords.h);
    return this.updatePreview(coords);
  };

  CarrierWaveCropper.prototype.updatePreview = function(coords) {
    return $('#user_avatar_previewbox').css({
      width: Math.round(100 / coords.w * $('#user_avatar_cropbox').width()) + 'px',
      height: Math.round(100 / coords.h * $('#user_avatar_cropbox').height()) + 'px',
      marginLeft: '-' + Math.round(100 / coords.w * coords.x) + 'px',
      marginTop: '-' + Math.round(100 / coords.h * coords.y) + 'px'
    });
  };

  return CarrierWaveCropper;

})();

jQuery(function() {
  new CarrierWaveCropper();
});
