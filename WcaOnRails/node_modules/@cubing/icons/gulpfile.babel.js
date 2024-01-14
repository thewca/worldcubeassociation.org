var del = require('del');
var gulp = require('gulp');
var path = require('path');
var jimp = require('gulp-jimp');
var through = require('through2');
var rename = require('gulp-rename');
var svg2png = require('gulp-svg2png');
var iconfont = require('gulp-iconfont');
var bufferstreams = require('bufferstreams');
var child_process = require('child_process');
var consolidate = require('gulp-consolidate');

var FONT_NAME = 'cubing-icons';
var SVG_FILES = "svgs/*/*.svg";
var STATIC_FILES = "static/*/*";
var TEMPLATE_FILES = 'templates/*.lodash';
var SRC_FILES = [ SVG_FILES, TEMPLATE_FILES ];

var runTimestamp = Math.round(Date.now()/1000);

const defaultTask = gulp.parallel(copySvgs, copyStaticFiles, css);
export default defaultTask;

export function css() {
  var fontCss = fontCssPipe();
  return gulp.src(SVG_FILES)

    // We convert the SVGs to PNG, to BMP, and then back to SVG
    // in order to produce the simplest SVGs possible, as iconfont
    // is not very resilient in what it accepts.
    .pipe(svg2png())

    // svg2png looks for files on the filesystem by name, so we cannot
    // rename until after svg2png. We should really fix this bug in svg2png.
    .pipe(through.obj(function(file, enc, next) {
      file.path = path.join(path.dirname(file.path), file.relative.replace("/", "-"));
      next(null, file);
    }))

    .pipe(jimp({
      '': {
        background: '#FFFFFF', // Convert transparent to white
        type: 'bmp',
      }
    }))
    .pipe(bmp2svg())

    .pipe(iconfont({
      fontName: FONT_NAME,
      formats: ['ttf', 'woff'],
      timestamp: runTimestamp, // get consistent builds when watching files
      normalize: true,
      fontHeight: 1000,
    }))
      .on('glyphs', function(glyphs, options) {
        // Stash glyphs so we can generate the CSS at the end.
        fontCss.glyphs = glyphs;

        gulp.src('templates/index.html.lodash')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
          }))
          .pipe(rename('index.html'))
          .pipe(gulp.dest('www/'));
      })
    .pipe(gulp.dest('www/fonts/'))
    .pipe(fontCss);
};

export function copyStaticFiles() {
  return gulp.src(STATIC_FILES).pipe(gulp.dest("www/"));
}

export function copySvgs() {
  return gulp.src(SVG_FILES)
           .pipe(gulp.dest('www/svgs/'));
}

export const watch = gulp.series(defaultTask, function watching() {
  gulp.watch(SRC_FILES, defaultTask);
});

export function clean() {
  return del('www');
};

function fontCssPipe() {
  var fontFiles = [];
  return through.obj(function(file, enc, cb) {
      file.contents.pipe(new bufferstreams(function(err, buf, cb) {
        if(err) {
          throw err;
        }

        fontFiles[file.extname.substring(1)] = buf.toString('base64');
        cb();
      })).on('finish', cb);
  }, function(cb) {
    // Modified from https://www.npmjs.com/package/gulp-iconfont
    var fontUrls = {
      woff: "data:application/x-font-woff;charset=utf-8;base64," + fontFiles.woff,
      ttf: "data:application/x-font-ttf;charset=utf-8;base64," + fontFiles.ttf,
    };
    gulp.src('templates/cubing-icons.css.lodash')
      .pipe(consolidate('lodash', {
        glyphs: this.glyphs,
        fontName: FONT_NAME,
        fontUrls: fontUrls,
        className: 'cubing-icon',
      }))
      .pipe(rename('cubing-icons.css'))
      .pipe(gulp.dest('www/css/'))
      .on('end', cb);
  });
}

function bmp2svg() {
  return through.obj(function(file, enc, next) {

    var potraceProcess = child_process.spawn(
      'potrace', ['-o', '-', '-b', 'svg'], {
         stdio: [ 'pipe', 'pipe', 'inherit' ]
       }
    );

    potraceProcess.stdin.write(file.contents);
    potraceProcess.stdin.end();

    // TODO - there must be some way of avoiding this...
    var buffer = new Buffer.alloc(0);
    potraceProcess.stdout.on('data', function(data) {
      buffer = Buffer.concat([ buffer, data ]);
    });

    potraceProcess.once('close', function(code) {
      if(code !== 0) {
        next(new Error("potrace exited with code " + code, null));
      } else {
        file.extname = ".svg";
        file.contents = buffer;
        next(null, file);
      }
    });
  });
}
