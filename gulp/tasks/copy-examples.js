const gulp        = require('gulp');
const config      = require('../config').examples;
const filesToMove = [
        config.src
    ];

gulp.task('copy-examples', function(){
  return gulp.src(filesToMove, { base: config.base })
    .pipe(gulp.dest(config.dest));
});
