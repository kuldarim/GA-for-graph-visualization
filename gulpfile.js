'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var protractor = require("gulp-protractor").protractor;

gulp.task('sass', function () {
    gulp.src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('e2etests:run', function() {
    gulp.src(["./src/tests/*.js"])
        .pipe(protractor({
            configFile: "spec/protractor.conf.js",
            args: ['--baseUrl', 'http://127.0.0.1:8000']
        }))
        .on('error', function(e) { throw e })
});

var jscs = require('gulp-jscs');

gulp.task('jscs', function () {
    return gulp.src('js/*.js')
        .pipe(jscs());
});