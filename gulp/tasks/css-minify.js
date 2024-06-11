const gulp      = require('gulp');
const concat    = require('gulp-concat');
const minifyCSS = require('gulp-minify-css');
const config    = require('../config').css;

gulp.task('minify-css', function() {
  return gulp.src(config.src)
    .pipe(concat('breadboard.css'))
    .pipe(minifyCSS({keepBreaks:true}))
    .pipe(gulp.dest(config.dest))
});
