var gulp        = require('gulp');
var config      = require('../config').examples;
var filesToMove = [
        config.src
    ];

gulp.task('copy-examples', function(){
  return gulp.src(filesToMove, { base: config.base })
    .pipe(gulp.dest(config.dest));
});
