module.exports = (grunt) ->
    grunt.initConfig
        pkg: grunt.file.readJSON('package.json')
        
        copy:
            # This task is not required if `inline` source maps are used.
            coffee:
                src: 'coffee/*'
                dest: 'site/static/'
           
        watch:
            options:
                atBegin: true
                livereload: true
            hugo:
                files: ['site/**']
                tasks: 'hugo:dev'
            all:
                files: ['Gruntfile.coffee']
                tasks: 'dev'
        connect:
            mysite:
                options:
                    hostname: '127.0.0.1'
                    port: 8080
                    protocol: 'http'
                    base: 'build/dev'
                    livereload: true

    grunt.registerTask 'hugo', (target) ->
        done = @async()
        args = ["--destination=build/#{target}"]
        if target == 'dev'
            args.push '--baseUrl=http://127.0.0.1:8080'
            args.push '--buildDrafts=true'
            args.push '--buildFuture=true'
        hugo = require('child_process').spawn 'hugo', args, stdio: 'inherit'
        (hugo.on e, -> done(true)) for e in ['exit', 'error']

    grunt.loadNpmTasks plugin for plugin in [
        'grunt-contrib-copy'
        'grunt-contrib-watch'
        'grunt-contrib-connect'
    ]
    grunt.registerTask 'dev', ['copy', 'hugo:dev']
    grunt.registerTask 'default', ['copy', 'hugo:dist']
    grunt.registerTask 'edit', ['connect', 'watch']