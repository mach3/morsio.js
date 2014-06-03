
module.exports = function(grunt){

	var _ = grunt.util._;

	grunt.registerTask("generate-map", null, function(){

		var my = {};

		my.str = grunt.file.read("data/map.tsv");
		my.data = {};
		my.header = null;
		my.template = _.template(
			[
				"(function($, global){",
				"var morsio = global.morsio = global.morsio || {};",
				"morsio.map = <%=data %>;",
				"}(jQuery, window));"
			].join("\n")
		);
		my.dest = "src/morsio.map.js";

		my.getCharCodes = function(str, delimiter){
			var codes = [];
			delimiter = delimiter || ",";
			str.split("").forEach(function(s){
				codes.push(s.charCodeAt(0));
			});
			return codes.join(delimiter);
		};

		my.str.split("\n").forEach(function(row){
			var item;

			if(! row){
				return;
			}

			row = row.split("\t");

			if(! my.header){
				my.header = row;
				return;
			}

			item = _.object(my.header, row);

			if(! (item.category in my.data)){
				my.data[item.category] = {};
			}

			my.data[item.category][my.getCharCodes(item.char)] = item.code.replace(/./g, function(s){
				return s === "－" ? 3 : 1;
			});
		});

		grunt.file.write(my.dest, my.template({data: JSON.stringify(my.data)}));

	});

};