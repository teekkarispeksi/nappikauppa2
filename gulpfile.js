var gulp = require('gulp');
var inject = require('gulp-inject');
var less = require('gulp-less');
var del = require('del');
var runSequence = require('run-sequence');

// from http://rhumaric.com/2014/01/livereload-magic-gulp-style/
function startExpress() {
  var app = require('./app.js');
  app.listen(3000);
}

function startLivereload() {
  lr = require('tiny-lr')();
  lr.listen(35729);
}

function notifyLivereload(event) {
  // this should, but does not work, so using the solution below
  //gulp.src(event.path, {read: false}).pipe(require('gulp-livereload')(lr));

  var fileName = require('path').relative(__dirname, event.path);
  lr.changed({
    body: {
      files: [fileName]
    }
  });
}

gulp.task('clean', function (cb) {
  return del(['./frontend/build/'], cb)
})

gulp.task('css', function () {
  return gulp.src('./frontend/src/css/*.less')
      .pipe(less())
      .pipe(gulp.dest('./frontend/build/public/css/'));
})

gulp.task('js', function () {
  return gulp.src('./frontend/src/js/*.js')
      .pipe(gulp.dest('./frontend/build/public/js/'));
})

gulp.task('index', function () {
  return gulp.src('./frontend/src/index.html')
      .pipe(inject(gulp.src('./public/**/*.{css,js}', {read: false, cwd: './frontend/build/'})))
      .pipe(gulp.dest('./frontend/build/'));
})

gulp.task('build', function(cb) {
  runSequence(
    ['clean'],
    ['css', 'js'],
    ['index'],
    cb);
})

gulp.task('start', function () {
  startExpress();
  startLivereload();
  gulp.watch('frontend/src/css/*', ['css', 'index']);
  gulp.watch('frontend/src/js/*', ['js', 'index']);
  gulp.watch('frontend/src/index.html', ['index']);
  gulp.watch('frontend/build/**/*.{html,css,js}', notifyLivereload);
});

gulp.task('default', function(cb) {
  runSequence(
    ['build'],
    ['start'],
    cb);
})
