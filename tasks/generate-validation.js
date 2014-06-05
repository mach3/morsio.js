
module.exports = function(grunt){

	var _ = grunt.util._;

	grunt.registerTask("generate-validation", function(){

		var my = {};

		my.headers = null;
		my.data = {};
		my.dest = "./src/morsio.validation.js";
		my.template = _.template([
			[
				"(function($, global){",
				"var morsio = global.morsio = global.morsio || {};",
				"morsio.validation = <%=data %>;",
				"}(jQuery, window));"
			].join("\n")
		].join(""));

		grunt.file.read("./data/validation-map.tsv").split("\n").forEach(function(row){
			var category, key;

			row = _.compact(row.split("\t"));

			if(! my.headers){
				my.headers = row;
				return;
			}

			if(row.length < my.headers.length){
				return;
			}

			category = row.shift();
			row = row.map(function(col){
				return "" + col.charCodeAt(0);
			});
			key = row.shift();
			if(! (category in my.data)){
				my.data[category] = {};
			}
			my.data[category][key] = row;

		});

		grunt.file.write(my.dest, my.template({data: JSON.stringify(my.data)}));

	});

};