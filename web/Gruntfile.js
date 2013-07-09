module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		watch: {
			scripts: {
				files: "app/**/*.ls",
				tasks: "livescript"
			},

			styles: {
				files: [ "styles/**/*.less", "vendor/styles/**/*.less" ],
				tasks: "less"
			},

			jade: {
				files: "view/**/*.jade",
				tasks: "jade"
			},

			assets: {
				files: "assets/**",
				tasks: "copy"
			},

			vendorjs: {
				files: "vendor/**/*.js",
				tasks: "concat"
			}
		},

		livescript: {
			options: {
				separator: "",
				bare: false
			},

			compile: {
				files: [
					{
						dest: "build/js/app.js",
						src: [ "app/**/*.ls" ]
					}, {
						expand: true,
						cwd: "app/workers",
						src: "**/*.ls",
						dest: "build/js/workers/",
						ext: ".js"
					}
				]
			}
		},

		less: {
			compile: {
				files: {
					"build/css/app.css": "styles/app.less"
				}
			},
		},

		concat: {
			options: {
				separator: ";"
			},
			compile: {
				files: {
					"build/js/vendor.js": [
						"vendor/scripts/jquery/*.js",

						"vendor/scripts/angular/angular.js",
						"vendor/scripts/angular/angular-cookies.js",
						"vendor/scripts/angular/angular-loader.js",
						"vendor/scripts/angular/angular-resource.js",
						"vendor/scripts/angular/angular-sanitize.js",

						"vendor/scripts/bootstrap/bootstrap-transition.js",
						"vendor/scripts/bootstrap/bootstrap-alert.js",
						"vendor/scripts/bootstrap/bootstrap-button.js",
						"vendor/scripts/bootstrap/bootstrap-carousel.js",
						"vendor/scripts/bootstrap/bootstrap-collapse.js",
						"vendor/scripts/bootstrap/bootstrap-dropdown.js",
						"vendor/scripts/bootstrap/bootstrap-modal.js",
						"vendor/scripts/bootstrap/bootstrap-tooltip.js",
						"vendor/scripts/bootstrap/bootstrap-popover.js",
						"vendor/scripts/bootstrap/bootstrap-scrollspy.js",
						"vendor/scripts/bootstrap/bootstrap-tab.js",
						"vendor/scripts/bootstrap/bootstrap-typeahead.js",
						"vendor/scripts/bootstrap/bootstrap-affix.js",

					]
				}
			}
		},

		jade: {
			options: {
				client: false,
				pretty: true,
				doctype: "5" // force html5 for the partials
			},
			compile: {
				files: [ {
					expand: true,
					cwd: "view/",
					src: "**/*.jade",
					dest: "build/",
					ext: ".html"
				} ]
			}
		},

		copy: {
			assets: {
				files: [
					{ expand: true
					, cwd: "assets/"
					, src: "**"
					, dest: "build/"
					}
				]
			},
		},

		clean: [ "build/" ]
	})

	grunt.loadNpmTasks("grunt-livescript")
	grunt.loadNpmTasks("grunt-contrib-watch")
	grunt.loadNpmTasks("grunt-contrib-less")
	grunt.loadNpmTasks("grunt-contrib-concat")
	grunt.loadNpmTasks("grunt-contrib-jade")
	grunt.loadNpmTasks("grunt-contrib-copy")
	grunt.loadNpmTasks("grunt-contrib-clean")

	grunt.registerTask("build", [ "livescript", "less", "concat", "jade", "copy" ])
	grunt.registerTask("default", "build")
	grunt.registerTask("watcher", [ "clean", "build", "watch" ])

	grunt.event.on('watch', function(action, filepath) {
		grunt.log.writeln(filepath + ' has ' + action)
	})
}
