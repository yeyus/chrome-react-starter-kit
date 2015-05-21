var gulp         = require('gulp');
var gutil        = require('gulp-util');
var sass         = require('gulp-sass');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var sourcemaps   = require('gulp-sourcemaps');
var sixtofiveify = require('6to5ify');
var reactify     = require('reactify');
var watchify     = require('watchify');
var browserify   = require('browserify');
var browserSync  = require('browser-sync');

// Input file.
var bundler     = watchify(browserify('./app/js/app.jsx', watchify.args));

// React JSX transform
bundler.transform(reactify);

// Babel, 6to5ify transform
bundler.transform(sixtofiveify);

// On updates recompile
bundler.on('update', bundleJS);

function bundleJS() {

    gutil.log('Compiling JS...');

    return bundler.bundle()
        .on('error', function (err) {
            gutil.log(err.message);
            browserSync.notify("Browserify Error!");
            this.emit("end");
        })
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./build/js'))
        .pipe(browserSync.reload({stream: true, once: true}));
}

/**
 * Gulp task alias
 */
gulp.task('bundle', function () {
    return bundleJS();
});

gulp.task('sass', function () {
  gulp.src('./app/styles/**/*.scss')
    .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./build/css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./app/styles/**/*.scss', ['sass']);
});

gulp.task('copy', function() {
    gulp.src('app/fonts/**')
        .pipe(gulp.dest('build/fonts'));
    gulp.src('app/icons/**')
        .pipe(gulp.dest('build/icons'));
    gulp.src('app/_locales/**')
        .pipe(gulp.dest('build/_locales'));
    gulp.src('app/index.html')
        .pipe(gulp.dest('build'));
    return gulp.src('app/manifest.json')
        .pipe(gulp.dest('build'));
});

/**
 * First bundle, then serve from the ./app directory
 */
gulp.task('default', ['bundle','sass','sass:watch','copy'], function () {
    browserSync({
        server: "./build"
    });
});