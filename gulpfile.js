var gulp = require('gulp');

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

//gulp.task('default', ['server']);
gulp.task('default', function () {
	startExpress();
	startLivereload();
	gulp.watch('frontend/index.html', notifyLivereload);
});
