const loadImageLazy = () => import(/* webpackChunkName: "blueimp-load-image" */ 'blueimp-load-image').then((m) => m.default);

$(() => {
  $('.image-preview-container').each((index, container) => {
    const $container = $(container);
    const $input = $($container.data('inputSelector'));
    $input.on('change', () => {
      loadImageLazy().then((loadImage) => {
        loadImage(
          $input[0].files[0],
          (img) => {
            if (img.type === 'error') {
              /* eslint-disable-next-line */
              console.error(img);
            } else {
              $container.empty().append(img);
            }
          },
          $container.data(), /* Options passed as data attribues, see the list https://github.com/blueimp/JavaScript-Load-Image#options */
        );
      });
    });
  });
});
