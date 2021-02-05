var babel = require("gulp-babel");
var browserify = require("browserify");
var derequire = require("gulp-derequire");
var gulp = require("gulp");
var insert = require("gulp-insert");
var path = require("path");
var rename = require("gulp-rename");
var source = require("vinyl-source-stream");
var uglify = require("gulp-uglify-es").default;
var watch = require("gulp-watch");

var BUILD = process.env.AUA_BUILD || "browser";
var VERSION = require("./package.json").version;

var transformRuntime = [
    "@babel/plugin-transform-runtime",
    {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: false
    }
];

var PRESETS = {
    browser: ["@babel/preset-react"],
    node: [
        [
            "@babel/preset-env",
            {
                targets: { node: "8" }
            }
        ]
    ],
    "react-native": ["@babel/preset-react"]
};
var PLUGINS = {
    browser: [
        transformRuntime,
        "@babel/plugin-transform-flow-comments",
        "@babel/plugin-proposal-class-properties",
        "inline-package-json",
        "transform-inline-environment-variables"
    ],
    node: [
        "@babel/plugin-transform-flow-comments",
        "inline-package-json",
        "transform-inline-environment-variables"
    ],
    "react-native": [
        "@babel/plugin-transform-flow-comments",
        "inline-package-json",
        "transform-inline-environment-variables"
    ]
};

var DEV_HEADER =
    "/**\n" + " * AUA client JavaScript library" + VERSION + "\n*/\n";

var FULL_HEADER =
    "/**\n" + " * AUA client JavaScript library" + VERSION + "\n*/\n";

gulp.task("compile", function() {
    return (
        gulp
            .src([
                "src/*.js",
                "src/*/*.js",
                "src/*/*/*.js",
                "src/*/*/*/*.js",
                "src/*/*/*/*/*.js"
            ])
            .pipe(
                babel({
                    presets: PRESETS[BUILD],
                    plugins: PLUGINS[BUILD]
                })
            )
            // Second pass to kill BUILD-switched code
            .pipe(
                babel({
                    plugins: ["minify-dead-code-elimination"]
                })
            )
            .pipe(gulp.dest(path.join("lib", BUILD)))
    );
});

gulp.task("browserify", function(cb) {
    var stream = browserify({
        builtins: ["_process", "events"],
        entries: "lib/browser/AUA.js",
        standalone: "AUA"
    })
        .exclude("xmlhttprequest")
        .ignore("_process")
        .bundle();
    stream.on("end", () => {
        cb();
    });
    return stream
        .pipe(source("aua-client.js"))
        .pipe(derequire())
        .pipe(insert.prepend(DEV_HEADER))
        .pipe(gulp.dest("./dist"));
});

gulp.task("minify", function() {
    return gulp
        .src("dist/aua-client.js")
        .pipe(uglify())
        .pipe(insert.prepend(FULL_HEADER))
        .pipe(rename({ extname: ".min.js" }))
        .pipe(gulp.dest("./dist"));
});

gulp.task("watch", function() {
    return (
        watch("src/*.js", { ignoreInitial: false, verbose: true })
            .pipe(
                babel({
                    presets: PRESETS[BUILD],
                    plugins: PLUGINS[BUILD]
                })
            )
            // Second pass to kill BUILD-switched code
            .pipe(
                babel({
                    plugins: ["minify-dead-code-elimination"]
                })
            )
            .pipe(gulp.dest(path.join("lib", BUILD)))
    );
});
