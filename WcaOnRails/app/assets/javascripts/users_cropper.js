var CarrierWaveCropper = (function() {
  function CarrierWaveCropper(idPrefix) {
    var that = this;
    this.updatePreview = this.updatePreview.bind(this);
    this.update = this.update.bind(this);
    this.idPrefix = idPrefix;

    $('#'+ this.idPrefix + '_cropbox').Jcrop({
      aspectRatio: 1,
      boxWidth: 400, boxHeight: 400,
      setSelect: [0, 0, 200, 200],
      onSelect: this.update,
      onChange: this.update,
    });
  }

  CarrierWaveCropper.prototype.update = function(coords) {
    $('#' + this.idPrefix + '_crop_x').val(coords.x);
    $('#' + this.idPrefix + '_crop_y').val(coords.y);
    $('#' + this.idPrefix + '_crop_w').val(coords.w);
    $('#' + this.idPrefix + '_crop_h').val(coords.h);
    return this.updatePreview(coords);
  };

  CarrierWaveCropper.prototype.updatePreview = function(coords) {
    return $('#' + this.idPrefix + '_previewbox').css({
      width: Math.round(100 / coords.w * $('#' + this.idPrefix + '_cropbox').width()) + 'px',
      height: Math.round(100 / coords.h * $('#' + this.idPrefix + '_cropbox').height()) + 'px',
      marginLeft: '-' + Math.round(100 / coords.w * coords.x) + 'px',
      marginTop: '-' + Math.round(100 / coords.h * coords.y) + 'px'
    });
  };

  return CarrierWaveCropper;

})();

jQuery(function() {
  new CarrierWaveCropper('user_avatar');
  new CarrierWaveCropper('user_pending_avatar');
});
