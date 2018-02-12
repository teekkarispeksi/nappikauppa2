'use strict';

var gulp = require('gulp');
var inject = require('gulp-inject');
var less = require('gulp-less');
var del = require('del');
var runSequence = require('run-sequence');
var browserify = require('browserify');
var babelify = require('babelify'); // for browserify
var tsify = require('tsify');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var stylish = require('gulp-tslint-stylish');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var cssmin = require('gulp-clean-css');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var lr = require('tiny-lr')();
var nightwatch = require('gulp-nightwatch');
var server = require('gulp-live-server');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('server', function() {
  var app = server.new('app.js');
  app.start();
  gulp.watch(['frontend/build/**/*'], function(file) {
    console.log('frontend updated, notifying livereload ', file);
    app.notify.apply(app, [file]);
  });

  //gulp.watch(['app.js', 'backend/build/**/*'], function() {
  //  app.start.bind(app); // does not work :(
  //});
});

gulp.task('clean', function(cb) {
  return del(['./frontend/build/', './backend/build/', './app.js'], cb);
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

gulp.task('css:store:min', function() {
  return gulp.src(['./frontend/src/css/*.less', '!./frontend/src/css/admin*.less'])
    .pipe(less())
    .pipe(concat('style.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('./frontend/build/public/css/'));
});

gulp.task('css:admin:min', function() {
  return gulp.src('./frontend/src/css/admin*.less')
    .pipe(less())
    .pipe(concat('admin.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('./frontend/build/public/css/'));
});

gulp.task('css', ['css:store', 'css:admin']);

gulp.task('css:min', ['css:store:min', 'css:admin:min']);

function lint(files) {
  return function() {
    return gulp.src(files)
    .pipe(tslint())
    .pipe(tslint.report(stylish, {emitError: true}))
    .on('error', function(err) {
      notify.onError({
        message: '<%= error.message %>'
      }).apply(this, arguments);
      this.emit('end');
    });
  };
}

gulp.task('lint:store', lint(['frontend/src/js/**/*.{ts,tsx}']));
gulp.task('lint:admin', lint(['frontend/src/js-admin/**/*.{ts,tsx}']));
gulp.task('lint:app', lint(['app.ts']));
gulp.task('lint:backend', lint(['backend/src/**/*.{ts,tsx}']));

function js(startPath, targetFile) {
  return function() {
    return browserify({entries: startPath, debug: true})
      .add('typings/index.d.ts')
      .transform(babelify)
      .plugin(tsify, {sourceRoot: __dirname})
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
    process.env.NODE_ENV = 'production'; // to make react build in production mode
    return browserify(startPath)
      .add('typings/index.d.ts')
      .transform(babelify)
      .plugin(tsify)
      .bundle()
      .pipe(source(targetFile))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest('./frontend/build/public/js/'));
  };
}

gulp.task('js:store', ['lint:store'], js('./frontend/src/js/App.tsx', 'App.js'));
gulp.task('js:admin', ['lint:admin'], js('./frontend/src/js-admin/AdminApp.tsx', 'adminApp.js'));

gulp.task('js', ['js:store', 'js:admin']);

gulp.task('js:store:min', jsMin('./frontend/src/js/App.tsx', 'App.js'));
gulp.task('js:admin:min', jsMin('./frontend/src/js-admin/AdminApp.tsx', 'adminApp.js'));

gulp.task('js:min', ['js:store:min', 'js:admin:min']);

gulp.task('backend', ['lint:backend'], function() {
  return gulp.src(['backend/src/**/*.ts', 'typings/index.d.ts'])
    .pipe(sourcemaps.init())
    .pipe(ts({module: 'commonjs'}))
    .pipe(sourcemaps.write({sourceRoot: '../src'}))
    .pipe(gulp.dest('backend/build/'))
    .pipe(notify({message: 'backend re-compiled, restart gulp', onLast: true}));
});

gulp.task('app', ['lint:app'], function() {
  return gulp.src(['app.ts', 'typings/index.d.ts'])
    .pipe(sourcemaps.init())
    .pipe(ts({module: 'commonjs'}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./'))
    .pipe(notify({message: 'server re-compiled, restart gulp', onLast: true}));
});

gulp.task('index', function() {
  return gulp.src('./frontend/src/index.html')
    .pipe(inject(gulp.src(['./public/**/*.{css,js}', '!./public/**/admin*'], {read: false, cwd: __dirname + '/frontend/build/'}), {addRootSlash: false}))
    .pipe(gulp.dest('./frontend/build/'));
});

gulp.task('admin', function() {
  return gulp.src('./frontend/src/admin.html')
    .pipe(inject(gulp.src('./public/**/admin*.{css,js}', {read: false, cwd: __dirname + '/frontend/build/'}), {addRootSlash: false}))
    .pipe(gulp.dest('./frontend/build/'));
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
    ['server'],
    ['ete-test']
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

gulp.task('watch', function() {
  gulp.watch('frontend/src/css/**/*.{css,less}', ['css', 'index', 'admin']);
  gulp.watch('frontend/src/js/**/*.{js,jsx,ts,tsx}', ['js:store']);
  gulp.watch('frontend/src/js-admin/**/*.{js,jsx,ts,tsx}', ['js:admin']);
  gulp.watch('frontend/src/img/**/*.{jpg,gif,png}', ['img']);
  gulp.watch('frontend/src/index.html', ['index']);
  gulp.watch('frontend/src/admin.html', ['admin']);
  gulp.watch('backend/src/**/*.{js,jsx,ts,tsx}', ['backend']);
  gulp.watch('app.ts', ['app']);
});

gulp.task('rewatch', function(cb) {
  runSequence(
    ['build-dev'],
    ['watch'],
    cb);
});

gulp.task('watch-and-server', ['server', 'watch']);

gulp.task('default', function(cb) {
  runSequence(
    ['build-dev'],
    ['watch-and-server'],
    cb);
});
