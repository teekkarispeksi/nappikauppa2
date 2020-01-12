import gulp from 'gulp';

import del from 'del';

import browserify from 'browserify';
import tsify from 'tsify';
import babelify from 'babelify';
import watchify from 'watchify';

import less from 'gulp-less';
import concat from 'gulp-concat';
import cssmin from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import terser from 'gulp-terser';
import tslint from 'gulp-tslint';
import cache from 'gulp-cached';
import ts from 'gulp-typescript';
import inject from 'gulp-inject';
import livereload from 'gulp-livereload';

import notifier from 'node-notifier';

import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';

import {spawn} from 'child_process';

//Functions with prefix create* are used to generate gulp pipes for different tasks
//with same functionality, but for different resources

function createCopy(source, destination) {
  return gulp.src(source).pipe(gulp.dest(destination)).pipe(livereload());
}

function createCss(source, destination, outfile) {
  return gulp.src(source)
    .pipe(less())
    .pipe(concat(outfile))
    .pipe(gulp.dest(destination))
    .pipe(livereload());
}

function createCssMin(source, destination, outfile) {
  return gulp.src(source)
    .pipe(less())
    .pipe(concat(outfile))
    .pipe(cssmin())
    .pipe(gulp.dest(destination));
}

// Linter with cache, so only changed files will be linted
function createLinter(sourceFiles, cacheName) {
  return () => {
    const linter = gulp.src(sourceFiles)
      .pipe(cache(cacheName))
      .pipe(tslint({formatter: "stylish"}))
      .pipe(tslint.report())
      .on('error', (err) => {
        notifier.notify({
          title: "Nappikauppa2",
          subtitle: err.name,
          message: "Linter error: " + err.message
        });
        linter.emit('end');
      });

    return linter;
  }
}

// file watchers and linters are bundled to frontend developement build
// use of watchify indstead of gulp watch enables file caching in frontend building

function createFrontendDev(name, startFile, sourceFiles, targetFile, targetDir) {
  const bundler = browserify({
      debug: true,
      entries: startFile,
      cache: {},
      packageCache: {},
    })
    .add('typings/index.d.ts')
    .plugin(watchify, {
      ignoreWatch: ['**/node_modules/**', '**/backend/**/*', '**/app.ts']
    })
    .plugin(tsify, {files: [] }) //only dependencies files are passed to tsify
    .transform(babelify, {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      extensions: [ '.tsx', '.ts' ]
    });

  const taskFn = () => {
    const stream = bundler.bundle()
    return stream
      .on('error', (err) => {
        notifier.notify({
          title: "Nappikauppa2",
          subtitle: err.name,
          message: "Bundler error: " + err.message
        });
        console.log(err.message);
        stream.emit('end');
      })
      .pipe(source(targetFile))
      .pipe(gulp.dest(targetDir))
      .pipe(livereload());
  }

  if (gulp.task(name + '_lint') == undefined) {
    const lintFn = createLinter(sourceFiles, name + '_lintCache');
    gulp.task(name + '_lint', lintFn);
  }

  gulp.task(name + '_build', taskFn);
  const task = gulp.series(name + '_lint', name + '_build');
  bundler.on('update', task);

  return task;
}

function createFrontendProd(name, startFile, sourceFiles, targetFile, targetDir) {
  process.env.NODE_ENV = 'production';

  const bundler = browserify({
      entries: startFile
    })
    .add('typings/index.d.ts')
    .plugin(tsify, {files: []})
    .transform(babelify, {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      extensions: [ '.tsx', '.ts' ]
    });

  const taskFn = () => {
    const stream = bundler.bundle()
    return stream
      .pipe(source(targetFile))
      .pipe(buffer())
      .pipe(terser())
      .pipe(gulp.dest(targetDir));
  }

  if (gulp.task(name + '_lint') == undefined) {
    const lintFn = createLinter(sourceFiles, name + '_lintCache');
    gulp.task(name + '_lint', lintFn);
  }

  gulp.task(name + '_build_prod', taskFn);

  return gulp.series(name + '_lint', name + '_build_prod');
}

// backend builders, uses file caching for developement builds
function createBackendDev(name, sourceFiles, targetDir, tsconfig) {

  const tsProject = ts.createProject(tsconfig)

  const taskFn = () => {
    const stream = tsProject.src();
    return stream
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .on('error', (err) => {
        notifier.notify({
          title: "Nappikauppa2",
          subtitle: err.name,
          message: "Build error: " + err.message
        });
        console.log(err.message);
        stream.emit('end');
      })
      .pipe(sourcemaps.write({sourceRoot: 'src'}))
      .pipe(gulp.dest(targetDir));
  }

  if (gulp.task(name + '_lint') == undefined) {
    const lintFn = createLinter(sourceFiles, name + '_lintCache');
    gulp.task(name + '_lint', lintFn);
  }

  gulp.task(name + '_build', taskFn);
  return gulp.series(name + '_lint', name + '_build');
}

function createBackendProd(name, sourceFiles, targetDir, tsconfig) {

  const tsProject = ts.createProject(tsconfig);

  const taskFn = () => {
    return tsProject.src()
      .pipe(tsProject())
      .pipe(gulp.dest(targetDir));
  }

  if (gulp.task(name + '_lint') == undefined) {
    const lintFn = createLinter(sourceFiles, name + '_lintCache');
    gulp.task(name + '_lint', lintFn);
  }

  gulp.task(name + '_build_prod', taskFn);
  return gulp.series(name + '_lint', name + '_build_prod')
}

// Actual task definitions start here

export const clean = () => del(['./frontend/build/', './backend/build/', './app.js']);

const img = () => createCopy('./frontend/src/img/**/*.{jpg,gif,png}', './frontend/build/public/img/');
const fonts = () => createCopy('./frontend/src/bootstrap/fonts/*', './frontend/build/public/fonts/');

const css_store = () => createCss(['./frontend/src/css/*.less', '!./frontend/src/css/admin*.less'], './frontend/build/public/css/', 'style.css');
const css_admin = () => createCss(['./frontend/src/css/admin*.less'], './frontend/build/public/css/', 'admin.css' );

const css_store_min = () => createCssMin(['./frontend/src/css/*.less', '!./frontend/src/css/admin*.less'], './frontend/build/public/css/', 'style.min.css');
const css_admin_min = () => createCssMin(['./frontend/src/css/admin*.less'], './frontend/build/public/css/', 'admin.min.css' );

const js_store = createFrontendDev('js_store', 'frontend/src/js/App.tsx', 'frontend/src/js/**/*.{ts,tsx}', 'App.js', 'frontend/build/public/js/');
const js_admin = createFrontendDev('js_admin', 'frontend/src/js-admin/AdminApp.tsx', 'frontend/src/js-admin/**/*.{ts,tsx}', 'admin-App.js', 'frontend/build/public/js/');

const js_store_prod = createFrontendProd('js_store', 'frontend/src/js/App.tsx', 'frontend/src/js/**/*.{ts,tsx}', 'App.js', 'frontend/build/public/js/');
const js_admin_prod = createFrontendProd('js_admin', 'frontend/src/js-admin/AdminApp.tsx', 'frontend/src/js-admin/**/*.{ts,tsx}', 'admin-App.js', 'frontend/build/public/js/');

const backend_dev = createBackendDev('backend', ['backend/src/'], 'backend/build/', 'tsconfig-backend.json');
const app_dev = createBackendDev('app', ['app.ts'] , './', 'tsconfig-app.json');

const backend_prod = createBackendProd('backend', ['backend/src/'], 'backend/build/', 'tsconfig-backend.json');
const app_prod = createBackendProd('app', ['app.ts'], './', 'tsconfig-app.json');

const index = () => {
  return gulp.src('./frontend/src/index.html')
    .pipe(inject(gulp.src(['./public/**/*.{css,js}', '!./public/**/admin*'], {read: false, cwd: __dirname + '/frontend/build/'}), {addRootSlash: false}))
    .pipe(gulp.dest('./frontend/build/'))
    .pipe(livereload());
}

const admin = () => {
  return gulp.src('./frontend/src/admin.html')
    .pipe(inject(gulp.src('./public/**/admin*.{css,js}', {read: false, cwd: __dirname + '/frontend/build/'}), {addRootSlash: false}))
    .pipe(gulp.dest('./frontend/build/'))
    .pipe(livereload());
}

export const build = gulp.series(
  clean,
  gulp.parallel(app_prod, backend_prod, js_store_prod, js_admin_prod, img, fonts, css_store_min, css_admin_min),
  gulp.parallel(index, admin)
);

// global variable for server process, can be managed by multiple tasks
var serverProcess;

// Starts node server as child process
export function startServer(done) {
  serverProcess = spawn(process.execPath, ['app.js'], {stdio: 'inherit'});
  done();
}

function restartServer(done) {
  notifier.notify({
    title: 'Nappikauppa2',
    message: 'Restarting server...'
  });
  // closing old server process with sigterm
  serverProcess.kill();
  // after server process is exited, restarting new process
  serverProcess.on('exit', (signal) => {
    startServer(done);
  });
}

// Watchers for developement
// Front end is not watched here, but instead with watchify for caching purposes
function watch() {
  livereload.listen();
  gulp.watch('backend/src/', gulp.series(backend_dev, restartServer));
  // As app is runned with server, watcher is working better with polling
  gulp.watch('app.ts', {usePolling: true, interval: 500}, gulp.series(app_dev, restartServer));
  gulp.watch(['frontend/src/css/*.less', '!frontend/src/css/admin*.less'], css_store);
  gulp.watch('frontend/src/css/admin*.less', css_admin);
  gulp.watch('frontend/src/img/**/*.{jpg,png,gif}', img);
  gulp.watch('frontend/src/bootstrap/fonts/*', fonts);
  gulp.watch('frontend/src/index.html', index);
  gulp.watch('frontend/src/admin.html', admin);
}


const dev = gulp.series(
  clean,
  gulp.parallel(app_dev, backend_dev, js_store, js_admin, img, fonts, css_store, css_admin),
  gulp.parallel(index, admin),
  gulp.parallel(watch, startServer)
);

export default dev ;
