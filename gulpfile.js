'use strict';

var gulp = require('gulp');
var inject = require('gulp-inject');
var less = require('gulp-less');
var del = require('del');
var runSequence = require('run-sequence');
var browserify = require('browserify');
var reactify = require('reactify'); // for browserify
var tsify = require('tsify');
var ts = require('gulp-typescript');
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
var nightwatch = require('gulp-nightwatch');

var config = require('./config/config.js');

// from http://rhumaric.com/2014/01/livereload-magic-gulp-style/
var app;
function startExpress() {
  app = require('./app.js');
  app.use(require('connect-livereload')());
  app.listen(config.port);
}

function stopExpress() {
  app.close();
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

gulp.task('fonts', function() {
  return gulp.src('./frontend/src/bootstrap/fonts/*')
  .pipe(gulp.dest('./frontend/build/public/fonts/'));
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
  return gulp.src(['frontend/src/**/*.{js,jsx}', '!./frontend/src/bootstrap/**/*.js']) // lint reactified JS
  .pipe(plumber())
  .pipe(jscs())
  .pipe(react())
  .pipe(jshint())
  .pipe(stylish.combineWithHintResults())
  .pipe(jshint.reporter('jshint-stylish'));
});

function js(startPath, targetFile) {
  return function() {
    return browserify(startPath)
    .add(startPath)
    .add('typings/tsd.d.ts')
    .transform(reactify)
    .plugin(tsify)
    .bundle()
    .on('error', function(err) {
      notify.onError({
        message: '<%= error.message %>'
      }).apply(this, arguments);
      this.emit('end');
    })
    .pipe(source(targetFile))
    .pipe(gulp.dest('./frontend/build/public/js/'));
  };
}

function jsMin(startPath, targetFile) {
  return function() {
    return browserify()
    .add(startPath)
    .add('typings/tsd.d.ts')
    .transform(reactify)
    .bundle()
    .pipe(source(targetFile))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./frontend/build/public/js/'));
  };
}

gulp.task('js:store', ['lint'], js('./frontend/src/js/App.tsx', 'App.js'));
gulp.task('js:admin', js('./frontend/src/js-admin/AdminApp.jsx', 'adminApp.js'));

gulp.task('js', ['js:store', 'js:admin']);

gulp.task('js:store:min', jsMin('./frontend/src/js/App.jsx', 'App.js'));
gulp.task('js:admin:min', jsMin('./frontend/src/js-admin/AdminApp.jsx', 'adminApp.js'));

gulp.task('js:min', ['js:store:min', 'js:admin:min']);

gulp.task('backend', function() {
  return gulp.src(['backend/src/**/*.ts', 'typings/tsd.d.ts'])
    .pipe(ts({
      module: 'commonjs'
    }))
    .pipe(gulp.dest('backend/build/'));
});

gulp.task('app', function() {
  return gulp.src(['app.ts', 'typings/tsd.d.ts'])
    .pipe(ts({
      module: 'commonjs'
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('index', function() {
  return gulp.src('./frontend/src/index.html')
      .pipe(inject(gulp.src(['./public/**/*.{css,js}', '!./public/**/admin*'], {read: false, cwd: './frontend/build/'}), {addRootSlash: false}))
      .pipe(inject(gulp.src('./config/google-analytics.js'), {name: 'analytics', transform: function(path, file) { return file.contents.toString('utf8'); }}))
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

gulp.task('ete-test', function() {
  return gulp.src('')
    .pipe(nightwatch({
      configFile: 'nightwatch.json'
    }));
});

gulp.task('test', function() {
  runSequence(
    ['build-dev'],
    ['start-dev'],
    ['ete-test'],
    stopExpress
  );
});

gulp.task('build-dev', function(cb) {
  runSequence(
    ['clean'],
    ['app', 'backend', 'css', 'js', 'img', 'fonts'],
    ['index', 'admin'],
    cb);
});

gulp.task('build', function(cb) {
  runSequence(
    ['clean'],
    ['app', 'backend', 'css:min', 'js:min', 'img', 'fonts'],
    ['index', 'admin'],
    cb);
});

gulp.task('start-dev', function() {
  startExpress();
  startLivereload();
  gulp.watch('frontend/src/css/**/*.{css,less}', ['css', 'index', 'admin']);
  gulp.watch('frontend/src/js*/**/*.{js,jsx,ts,tsx}', ['js', 'index', 'admin']);
  gulp.watch('frontend/src/img/**/*.{jpg,gif,png}', ['img']);
  gulp.watch('frontend/src/index.html', ['index']);
  gulp.watch('frontend/src/admin.html', ['admin']);
  gulp.watch('frontend/build/**/*.{html,css,js,jpg,gif,png}', notifyLivereload);
});

gulp.task('start', function() {
  startExpress();
});

gulp.task('default', function(cb) {
  runSequence(
    ['build-dev'],
    ['start-dev'],
    cb);
});
