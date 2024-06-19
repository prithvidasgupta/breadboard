const gulp        = require('gulp');
const browserify  = require('browserify');
const through2    = require('through2');
const rename      = require('gulp-rename');
const uglify = require('gulp-terser');
const config      = require('../config').app;

gulp.task('browserify', function () {
  return gulp.src([config.init])
    .pipe(through2.obj(function (file, enc, next) {
      browserify({entries: file.path, standalone: "sparks"})
        .bundle(function(err, res){
          file.contents = res;
          next(null, file);
        });
    }))
    .pipe(uglify())
    .pipe(rename('sparks.js'))
    .pipe(gulp.dest(config.dest));
});
