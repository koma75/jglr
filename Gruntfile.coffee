module.exports = (grunt)->
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-coffeelint'

  grunt.registerTask 'default', ['watch']

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    watch:
      coffee:
        files: ['coffee_lib/**/*.coffee','coffee_test/**/*.coffee']
        tasks: ['coffeelint', 'coffee']
      uglify_lib:
        files: ['lib/**/*.js']
        tasks: ['uglify:lib']
    coffee:
      lib:
        files: [
          expand: true
          cwd: 'coffee_lib/'
          src: ['**/*.coffee']
          dest: 'lib/'
          ext: '.js'
        ]
      test:
        files: [
          expand: true
          cwd: 'coffee_test/'
          src: ['**/*.coffee']
          dest: 'test/'
          ext: '.js'
        ]
    uglify:
      lib:
        options:
          preserveComments: "some"
        files: [
          expand: true
          cwd: 'lib/'
          src: '**/*.js'
          dest: 'lib/'
          ext: '.js'
        ]
    coffeelint:
      lib:
        files:
          src: ['coffee_lib/**/*.coffee']
      test:
        files:
          src: ['coffee_test/**/*.coffee']

  return
