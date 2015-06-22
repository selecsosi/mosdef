module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        concat: {
            dist: {
                src: [
                    "src/loader.js",
                    "src/export.js"
                ],
                dest: "mosdef.js"
            }
        },
        jshint: {
            mosdef: "mosdef.js",
            spec: "spec/*.js",
            options: {}
        },
        jasmine: {
            pipelines: {
                src: 'mosdef.js',
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
