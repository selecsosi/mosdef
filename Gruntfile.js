module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        concat: {
            dist: {
                src: [
                    "src/loader.js",
                    "src/mosdef.js"
                ],
                dest: "mosdef.js"
            }
        },
        jshint: {
            beforeconcat: 'src/*.js',
            afterconcat: "mosdef.js",
            spec: "spec/*.js",
            options: {}
        },
        jasmine: {
            pipelines: {
                src: 'src/**/*.js',
                options: {
                    specs: 'spec/*Spec.js',
                    vendor: [
                        "lib/lodash/lodash.js"
                    ]
                }
            }
        },
        uglify: {
            mosdef: {
                files: {
                    'mosdef.min.js': 'mosdef.js'
                }
            }
        }


    });

    grunt.registerTask('default', ['concat', 'jshint', 'jasmine', 'uglify'])
};
