var browserify = require('browserify');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var connect = require('gulp-connect');
var source = require('vinyl-source-stream');
var args   = require('yargs').argv;
var verb = require("gulp-verb");
var deploy = require("gulp-gh-pages");

var packageJson = require('./package.json');
var name = packageJson.exports || packageJson.name;
var exports =  packageJson.exports;
var dependencies = Object.keys(packageJson && packageJson.dependencies || {});

gulp.task('dependencies', function () {
  return browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('dependencies.js'))
    .pipe(gulp.dest('./tests/'));
});

gulp.task('lib', function () {
  return browserify('./index.js')
    .external(dependencies)
    .bundle({
        standalone : name
    })
    .pipe(source('lib.js'))
    .pipe(gulp.dest('./tests/'));
});

gulp.task('standalone', function () {
  return browserify('./index.js')
    .bundle({
        standalone : name
    })
    .pipe(source(packageJson.name + '.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('uglify', function() {
  return browserify('./index.js')
    .bundle()
    .pipe(source(packageJson.name + '.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./'));
});

gulp.task('connectDev', function () {
  connect.server({
    root: ['./'],
    port: 9001,
    livereload: false
  });
});

gulp.task('verb-docs', function () {
  gulp.src(['docs/README.tmpl.md'])
    // dest filename is defined in options,
    // otherwise gulp will overwrite .verbrc.md
    .pipe(verb({
      dest: 'README.md',
      type: 'docs',
      jsstart : '```js',
      jsend : '```'
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('verb-gh-pages', function () {
  gulp.src(['docs/index.tmpl.md'])
    // dest filename is defined in options,
    // otherwise gulp will overwrite .verbrc.md
    .pipe(verb({
      dest: 'index.html',
      type: 'gh-pages',
      jsstart : '<script>',
      jsend : '</script>'
    }))
    .pipe(gulp.dest('./gh-pages'))
    .pipe(deploy({remoteUrl : packageJson.repository.url}));
});

//var type = args.type || "build";

gulp.task('default', ['standalone', 'uglify']);

gulp.task('watch', function() {
  gulp.watch("./", ['dependencies', 'lib']);
});

gulp.task('test', ['dependencies', 'lib', 'connectDev' , 'watch']);

gulp.task('docs', ['verb-docs']);

gulp.task('gh-pages', ['verb-gh-pages']);

