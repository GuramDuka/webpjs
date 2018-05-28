const gulp = require('gulp');
const base64 = require('gulp-js-base64-inject');

gulp.task('compile', function () {
	return gulp.src('./data.js')
		.pipe(base64({
			basepath: './',
			relative: false,
			debug: true
		}))
		.pipe(gulp.dest('./build/'));
	});
