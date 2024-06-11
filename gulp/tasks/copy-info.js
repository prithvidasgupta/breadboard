const gulp        = require('gulp');
const config      = require('../config');
const filesToMove = [
        './bower.json',
        './license.md',
        './package.json',
        './readme.md',
    ];

gulp.task('copy-info', function(){
  gulp.src(filesToMove, { base: './' })
    .pipe(gulp.dest(config.dest));
});
