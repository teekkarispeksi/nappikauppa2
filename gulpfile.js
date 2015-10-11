'use strict';

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
var jscs = require('gulp-jscs');
var stylish = require('gulp-jscs-stylish');
var react = require('gulp-react'); // for jshint
var concat = require('gulp-concat');
var cssmin = require('gulp-minify-css');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var lr = require('tiny-lr')();

var config = require('./config/config.js');

// from http://rhumaric.com/2014/01/livereload-magic-gulp-style/
function startExpress() {
  var app = require('./app.js');
  app.use(require('connect-livereload')());
  app.listen(config.dev_port);
}

function startLivereload() {
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

gulp.task('clean', function(cb) {
  return del(['./frontend/build/'], cb);
});

gulp.task('img', function() {
  return gulp.src('./frontend/src/img/**/*.{jpg,gif,png}')
  .pipe(gulp.dest('./frontend/build/public/img/'));
});

gulp.task('css:store', function() {
  return gulp.src(['./frontend/src/css/*.less', '!./frontend/src/css/admin*.less'])
      .pipe(less())
      .pipe(concat('style.css'))
      .pipe(gulp.dest('./frontend/build/public/css/'));
});

gulp.task('css:admin', function() {
  return gulp.src('./frontend/src/css/admin*.less')
      .pipe(less())
      .pipe(concat('admin.css'))
      .pipe(gulp.dest('./frontend/build/public/css/'));
});

gulp.task('css:min', function() {
  gulp.src(['./frontend/src/css/*.less', '!./frontend/src/css/admin*.less'])
      .pipe(less())
      .pipe(concat('style.css'))
      .pipe(cssmin())
      .pipe(gulp.dest('./frontend/build/public/css/'));
});

gulp.task('css', ['css:store', 'css:admin']);

gulp.task('lint', function() {
  return gulp.src('frontend/src/**/*.{js,jsx}') // lint reactified JS
  .pipe(plumber())
  .pipe(jscs())
  .pipe(react())
  .pipe(jshint())
  .pipe(stylish.combineWithHintResults())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('js:store', ['lint'], function() {
  return browserify('./frontend/src/js/App.jsx')
  .transform(reactify)
  .bundle()
  .on('error', function(err) {
    notify.onError({
      message: '<%= error.message %>'
    }).apply(this, arguments);
    this.emit('end');
  })
  .pipe(source('App.js'))
  .pipe(gulp.dest('./frontend/build/public/js/'));
});

gulp.task('js:admin', function() {
  return browserify('./frontend/src/js-admin/AdminApp.jsx')
  .transform(reactify)
  .bundle()
  .on('error', function(err) {
    notify.onError({
      message: '<%= error.message %>'
    }).apply(this, arguments);
    this.emit('end');
  })
  .pipe(source('adminApp.js'))
  .pipe(gulp.dest('./frontend/build/public/js/'));
});

gulp.task('js', ['js:store', 'js:admin']);

gulp.task('js:min', function() {
  return browserify('./frontend/src/js/App.jsx')
  .transform(reactify)
  .bundle()
  .pipe(source('App.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('./frontend/build/public/js/'));
});

gulp.task('index', function() {
  return gulp.src('./frontend/src/index.html')
      .pipe(inject(gulp.src(['./public/**/*.{css,js}', '!./public/**/admin*'], {read: false, cwd: './frontend/build/'}), {addRootSlash: false}))
      .pipe(gulp.dest('./frontend/build/'));
});

gulp.task('admin', function() {
  return gulp.src('./frontend/src/admin.html')
      .pipe(inject(gulp.src('./public/**/admin*.{css,js}', {read: false, cwd: './frontend/build/'}), {addRootSlash: false}))
      .pipe(gulp.dest('./frontend/build/'));
});

gulp.task('lint-backend', function() {
  return gulp.src('backend/**/*.js') // lint reactified JS
  .pipe(plumber())
  .pipe(jscs())
  .pipe(jshint())
  .pipe(stylish.combineWithHintResults())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build', function(cb) {
  runSequence(
    ['clean'],
    ['css', 'js', 'img'],
    ['index', 'admin'],
    cb);
});

gulp.task('start', function() {
  startExpress();
  startLivereload();
  gulp.watch('frontend/src/css/**/*.{css,less}', ['css', 'index', 'admin']);
  gulp.watch('frontend/src/js*/**/*.{js,jsx}', ['js', 'index', 'admin']);
  gulp.watch('frontend/src/img/**/*.{jpg,gif,png}', ['img']);
  gulp.watch('frontend/src/index.html', ['index']);
  gulp.watch('frontend/src/admin.html', ['admin']);
  gulp.watch('frontend/build/**/*.{html,css,js,jpg,gif,png}', notifyLivereload);
});

gulp.task('default', function(cb) {
  runSequence(
    ['lint-backend'],
    ['build'],
    ['start'],
    cb);
});
