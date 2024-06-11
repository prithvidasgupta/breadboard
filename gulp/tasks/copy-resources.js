const gulp        = require('gulp');
const config      = require('../config').resources;

gulp.task('copy-common', function(){
  return gulp.src(config.common, { base: './' })
    .pipe(gulp.dest(config.commonDest));
});

gulp.task('copy-jquery-ui-images', function(){
  return gulp.src(config.jqueryUI, { base: config.jqueryUIBase })
    .pipe(gulp.dest(config.jqueryDest));
});

gulp.task('copy-resources', gulp.parallel('copy-common', 'copy-jquery-ui-images'));
