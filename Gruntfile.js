module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: {
                options: {
                    jshintrc: true
                },
                files: {
                    src: ['app.js','src/**/*.js']
                }
            }
        },
        watch: {
            // Changes in models
            task: {
                files: ['app.js', 'src/**/*.js'],
                tasks: ['jshint']
            }
        },


    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');


    // Default task(s).
    grunt.registerTask('default', ['jshint']);


};