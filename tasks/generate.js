/**
 * Grunt task: generate
 * --------------------
 * Generate map and validation data of morse tones
 */
module.exports = function(grunt){

	var _ = grunt.util._;

	grunt.registerTask("generate", null, function(){

		var my = {};

		my.sheets = grunt.file.readJSON("data/data.json").sheets;
		my.map = {};
		my.validation = {};

		my.template = _.template([
			"(function($, global){",
			"    var morsio = global.morsio = global.morsio || {};",
			"    morsio.<%=name %> = <%=data %>;",
			"}(jQuery, this));"
		].join("\n"));

		my.dest = {
			map: "src/morsio.map.js",
			validation: "src/morsio.validation.js"
		};

		// Run generate
		my.init = function(){
			// generate, save map
			["kana", "alpha"].forEach(this.generateMap.bind(this));
			this.save("map", this.map);
			// generate, save validations
			this.generateValidation();
			this.save("validation", this.validation);
		};

		// Get item by name from ghostsheet2 data
		my.getItems = function(name){
			return this.sheets.filter(function(o){
				return name === o.name;
			})[0].items;
		};

		// Get charcodes from string(s)
		my.getCharCodes = function(str, delimiter){
			var codes = [];
			delimiter = delimiter || ",";
			str.split("").forEach(function(s){
				codes.push(s.charCodeAt(0));
			});
			return codes.join(delimiter);
		};

		// Generate map data
		my.generateMap = function(name){
			var items, data;

			items = this.getItems(name);
			data = {};
			items.forEach(function(item){
				data[my.getCharCodes(item.name)] = item.tones;
			});
			this.map[name] = data;
		};

		// Generate validation data
		my.generateValidation = function(){
			var items, data;

			items = this.getItems("validation");
			data = {};
			items.forEach(function(item){
				if(void 0 === data[item.mode]){
					data[item.mode] = {};
				}
				data[item.mode][my.getCharCodes(item.from)] = my.getCharCodes(item.to).split(",");
			});
			this.validation = data;
		};

		// Save data as dest
		my.save = function(name, data){
			grunt.file.write(
				this.dest[name],
				this.template({name: name, data: JSON.stringify(data)})
			);
			grunt.log.writeln(name, "saved as", this.dest[name]);
		};

		my.init();

	});

};