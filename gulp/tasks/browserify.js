var gulp        = require('gulp');
var browserify  = require('browserify');
var through2    = require('through2');
var rename      = require('gulp-rename');
var uglify = require('gulp-terser');
var config      = require('../config').app;

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
