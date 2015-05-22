var gulp         = require('gulp');
var karma        = require('gulp-karma');
var jshint       = require('gulp-jshint');
var clean        = require('gulp-clean');
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
var uiBundler = watchify(browserify('./app/js/app.jsx', watchify.args));
var bgBundler = watchify(browserify('./app/js/background.js', watchify.args));

// React JSX transform
uiBundler.transform(reactify);

// Babel, 6to5ify transform
uiBundler.transform(sixtofiveify);
bgBundler.transform(sixtofiveify);

// On updates recompile
uiBundler.on('update', bundleUIJS);
bgBundler.on('update', bundleBgJS);

function bundleUIJS() {

    gutil.log('Compiling UI JS...');

    return uiBundler.bundle()
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

function bundleBgJS() {

    gutil.log('Compiling background JS...');

    return bgBundler.bundle()
        .on('error', function (err) {
            gutil.log(err.message);
            browserSync.notify("Browserify Error!");
            this.emit("end");
        })
        .pipe(source('background.js'))
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
    bundleBgJS();
    return bundleUIJS();
});

gulp.task('sass', function () {
    gulp.src('./app/styles/**/*.scss')
        .pipe(sourcemaps.init())
            .pipe(sass.sync().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'));
});

gulp.task('lint', function() {
  return gulp.src('./app/js')
    .pipe(jshint({ linter: require('jshint-jsx').JSXHINT }))
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function(done) {
    return gulp.src('./test/**/*.js')
        .pipe(karma({
            configFile: 'karma.conf.js',
            action: 'run'
        }))
        .on('error', function(err) {
            // Make sure failed tests cause gulp to exit non-zero
            throw err;
        });
});

gulp.task('sass:watch', function () {
    gulp.watch('./app/styles/**/*.scss', ['sass']);
});

gulp.task('copy', function() {
    gulp.src('app/fonts/**')
        .pipe(gulp.dest('build/fonts'));
    gulp.src('app/icons/**')
        .pipe(gulp.dest('build/icons'));
    //gulp.src('app/_locales/**')
    //   .pipe(gulp.dest('build/_locales'));
    gulp.src('app/index.html')
        .pipe(gulp.dest('build'));
    return gulp.src('app/manifest.json')
        .pipe(gulp.dest('build'));
});

gulp.task('clean', function() {
    return gulp.src('build')
        .pipe(clean());
});

/**
 * First bundle, then serve from the ./build directory
 */
gulp.task('default', ['lint','bundle','sass','sass:watch','copy'], function () {
    browserSync({
        server: "./build"
    });

    return gulp.src('./test/**/*.js')
        .pipe(karma({
            configFile: 'karma.conf.js',
            action: 'watch'
        }));
});