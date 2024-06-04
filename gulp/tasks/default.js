var gulp = require('gulp');
var config    = require('../config');

gulp.task('watch', function() {
    gulp.watch(config.app.src,  gulp.series('browserify'));
    gulp.watch(config.css.src,  gulp.series('minify-css'));
    gulp.watch(config.examples.src, gulp.series('copy-examples'));
});

gulp.task('build', gulp.series('copy-resources', 'browserify', 'minify-css'));

gulp.task('build-gh-pages', gulp.series('build', 'copy-examples', 'copy-info'));
gulp.task('build-production', gulp.series('build', 'copy-info'));

gulp.task('default', gulp.series('build', 'copy-examples', 'watch'));
