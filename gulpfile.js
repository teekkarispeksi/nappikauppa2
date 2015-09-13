var gulp = require('gulp');
var inject = require('gulp-inject');
var less = require('gulp-less');
var del = require('del');
var runSequence = require('run-sequence');
var browserify = require('browserify');
var reactify = require('reactify'); // for browserify
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var react = require('gulp-react'); // for jshint
var concat = require('gulp-concat');
var cssmin = require('gulp-minify-css');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');

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

gulp.task('img', function () {
  return gulp.src('./frontend/src/img/**/*.{jpg,gif,png}')
  .pipe(gulp.dest('./frontend/build/public/img/'));
})

gulp.task('css', function () {
  return gulp.src('./frontend/src/css/*.less')
      .pipe(less())
      .pipe(concat('style.css'))
      .pipe(gulp.dest('./frontend/build/public/css/'));
})

gulp.task('css:min', function () {
  gulp.src('./frontend/src/css/*.less')
      .pipe(less())
      .pipe(concat('style.css'))
      .pipe(cssmin())
      .pipe(gulp.dest('./frontend/build/public/css/'));
})

gulp.task('lint', function() {
  return gulp.src('frontend/src/**/*.{js,jsx}') // lint reactified JS
  .pipe(plumber())
  .pipe(react())
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

gulp.task('js', ['lint'], function() {
  return browserify('./frontend/src/js/App.jsx')
  .transform(reactify)
  .bundle()
  .on('error', function(err) {
    notify.onError({
      message: "<%= error.message %>"
    }).apply(this, arguments);
    this.emit('end');
  })
  .pipe(source('App.js'))
  .pipe(gulp.dest('./frontend/build/public/js/'));
})

gulp.task('js:min', function() {
  return browserify('./frontend/src/js/App.jsx')
  .transform(reactify)
  .bundle()
  .pipe(source('App.js'))
  .pipe(buffer())
  .pipe(uglify())
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
    ['css', 'js', 'img'],
    ['index'],
    cb);
})

gulp.task('start', function () {
  startExpress();
  startLivereload();
  gulp.watch('frontend/src/css/**/*.{css,less}', ['css', 'index']);
  gulp.watch('frontend/src/js/**/*.{js,jsx}', ['js', 'index']);
  gulp.watch('frontend/src/img/**/*.{jpg,gif,png}', ['img']);
  gulp.watch('frontend/src/index.html', ['index']);
  gulp.watch('frontend/build/**/*.{html,css,js,jpg,gif,png}', notifyLivereload);
});

gulp.task('default', function(cb) {
  runSequence(
    ['build'],
    ['start'],
    cb);
})
