

module.exports = function(grunt){

    var banner = grunt.template.process(
        grunt.file.read("./src/banner.js"),
        {data: grunt.file.readJSON("package.json")}
    );

    grunt.initConfig({
        connect: {
            dev: {
                options: {
                    base: "./",
                    hostname: "localhost",
                    port: 8080,
                    keepalive: true
                }
            }
        },
        uglify: {
            dist: {
                options: {
                    banner: banner,
                    preserveComments: "some"
                },
                files: {
                    "dist/morsio.min.js": ["src/morsio.js", "src/morsio.map.js", "src/morsio.validation.js"]
                }
            }
        },
        concat: {
            dist: {
                options: {
                    banner: banner
                },
                files: {
                    "dist/morsio.js": ["src/morsio.js", "src/morsio.map.js", "src/morsio.validation.js"]
                }
            }
        },
        copy: {
            dist: {
                expand: true,
                cwd: "src/",
                src: "morse.ogg",
                dest: "dist/"
            }
        }
    });

    grunt.registerTask("default", []);
    grunt.registerTask("build", ["uglify:dist", "concat:dist", "copy:dist"]);

    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadTasks("tasks");

};