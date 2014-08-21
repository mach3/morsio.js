

module.exports = function(grunt){

    var banner = grunt.template.process(
        grunt.file.read("./src/banner.js"),
        {data: grunt.file.readJSON("package.json")}
    );

    var files = [
        "src/morsio.js",
        "src/morsio.map.js",
        "src/morsio.validation.js"
    ];

    grunt.initConfig({
        ghostsheet: {
            generate: {
                files: {
                    "data/data.json": ["1xEn7ubB52YjxQ020qu_Y-Ei99N8-BXWDul8lHN9FKSc"]
                }
            }
        },
        connect: {
            dev: {
                options: {
                    base: "./",
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
                    "dist/morsio.min.js": files
                }
            }
        },
        concat: {
            dist: {
                options: {
                    banner: banner
                },
                files: {
                    "dist/morsio.js": files
                }
            }
        }
    });

    grunt.registerTask("default", []);
    grunt.registerTask("fetch", ["ghostsheet:generate"]);
    grunt.registerTask("dev", ["connect:dev"]);
    grunt.registerTask("build", ["uglify:dist", "concat:dist"]);

    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("ghostsheet2");
    grunt.loadTasks("tasks");

};