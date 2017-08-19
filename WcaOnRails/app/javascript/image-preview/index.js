import loadImage from 'blueimp-load-image';

$(() => {
  $('.image-preview-container').each((index, container) => {
    const $container = $(container);
    const $input = $($container.data('inputSelector'));
    $input.on('change', () => {
      loadImage(
        $input[0].files[0],
        img => img.type !== 'error' && $container.empty().append(img),
        $container.data() /* Options passed as data attribues, see the list https://github.com/blueimp/JavaScript-Load-Image#options */
      );
    });
  });
});
