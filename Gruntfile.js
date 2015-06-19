module.exports = function(grunt) {
    grunt.initConfig({
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.registerTask('default', ['less', 'swig']);
};
