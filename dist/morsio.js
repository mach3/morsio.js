/*!
 * morsio.js
 * ---------
 * Library for parsing and sounding morse tones
 *
 * @version 0.2.0
 * @license MIT
 * @author mach3 <http://github.com/mach3>
 * @require jquery#1
 */
(function($, global){

    var morsio = {};

    /**
     * Composer
     * --------
     * @class Parse text message to morse tones and play it
     */
    var Composer = morsio.Composer = function(){
        this._construct.apply(this, arguments);
    };

    (function(){
        var u, api = Composer.prototype;

        /**
         * Defaults:
         * - {String} mode : "alpha", "kana"
         * - {Integer} time : Millisecond time for 1 tone
         * - {Function} process : Callback function for a process
         * - {Function} complete : Callback function called when finished
         */
        api.defaults = {
            mode: "alpha",
            time: 100,
            process: $.noop,
            complete: $.noop
        };

        api.options = null;
        api.tones = null;
        api._tones = null;
        api.playing = false;
        api.timer = null;
        api.regMode = /^([a-z]+)\:/;

        /**
         * Constructor
         * @constructor
         * @param {Object} options
         */
        api._construct = function(options){
            this.config(this.defaults).config(options);
            this.process = this.process.bind(this);
        };

        /**
         * Configure options
         * @param {String|Object} key|options
         * @param {*} value
         * @returns {*}
         */
        api.config = function(key, value){
            switch($.type(key)){
                case "object":
                    this.options = $.extend(true, {}, this.options, key);
                    return this;
                case "string":
                    if(arguments.length > 1){
                        this.options[key] = value;
                        return this;
                    }
                    return this.options[key];
                default: break;
            }
        };

        /**
         * Validate message strings, return the validated
         * @param {String} message
         * @param {String} defaultChar
         * @returns {String}
         */
        api.validate = function(message, defaultChar){
            var res, map, valid;

            defaultChar = defaultChar || " ";
            res = [];
            map = this.map();
            valid = morsio.validation[this.config("mode")] || {};

            if(! map){
                return message;
            }

            message.toLowerCase().split("").forEach(function(s){
                var code, dest;

                code = s.charCodeAt(0);

                if(code in map){
                    res.push(s);
                    return;
                }
                if(code in valid){
                    dest = valid[code];
                    dest = $.isArray(dest) ? dest : [dest];
                    dest.forEach(function(value){
                        res.push(String.fromCharCode(value));
                    });
                    return;
                }
                res.push(defaultChar);
            });

            return res.join("");
        };

        /**
         * Parse string to morse tones
         * @param {String} message
         */
        api.parse = function(message){
            var my, map, tones;

            my = this;
            map = this.map();
            tones = [];

            this.validate(message).toLowerCase().split("").forEach(function(s){
                var item = map[s.charCodeAt(0)] || ".";
                tones.push(item);
            });

            this.tones = tones.join(".");

            return this;
        };

        /**
         * Get map to convert message
         * @returns {Object}
         */
        api.map = function(mode){
            var src, map = {};
            src = morsio.map;
            mode = mode || this.config("mode");
            $.extend(map, src.symbol, src.num, src[mode]);
            // this.config("mode")]);
            return map;
        };

        /**
         * Start playing parsed message
         * If 'tones' passed, play it
         */
        api.play = function(tones){
            if(! this.playing){
                this.playing = true;
                // create play data
                tones = tones || this.tones;
                this._tones = this.parseTones(tones);
                this.process();
            }
            return this;
        };

        /**
         * Parse tones string to array data
         * @param {String} tones
         * @returns {Array}
         */
        api.parseTones = function(tones){
            var data = [];
            tones.replace(this.regMode, "").split("").forEach(function(tone){
                tone = parseInt(tone, 10);
                if(! tone){
                    return data.push([false, 3]);
                }
                data.push([true, tone]);
                data.push([false, 1]);
            });
            return data;
        };

        /**
         * Stop playing message
         */
        api.stop = function(){
            this.playing = false;
            clearTimeout(this.timer);
        };

        /**
         * Function for each process
         */
        api.process = function(){
            var tones, o = this.options;
            if(! this.playing){
                return;
            }
            tones = this._tones.shift();
            if(tones){
                o.process.apply(this, tones);
            }
            if(! this._tones.length){
                o.complete();
                this.playing = false;
                return;
            }
            this.timer = setTimeout(this.process, tones[1] * o.time);
        };

        /**
         * Translate tones to message strings 
         * @param {String} tones
         * @return {String} message
         */
        api.translate = function(tones){
            var my, map, message;

            tones = tones || this.tones;
            my = this;
            map = (function(){
                var m = tones.match(my.regMode);
                tones = tones.replace(my.regMode, "");
                return my.map(m ? m[1] : null);
            }());
            message = [];

            tones.split(".").forEach(function(tone){
                var i = u.getKeyByValue(tone, map) || "32";
                message.push(String.fromCharCode(i));
            });

            return message.join("");
        };

        /**
         * Utility
         */
        u = {
            /**
             * Get key name string by value from object
             * @param {*} value
             * @param {Object} obj
             * @returns {String}
             */
            getKeyByValue: function(value, obj){
                var key = null;
                for(i in obj){
                    if(! obj.hasOwnProperty(i)){ continue; }
                    if(obj[i] === value){
                        key = i;
                        break;
                    }
                }
                return key;
            }
        };
    }());
    
    /**
     * Tone
     * ----
     * @class Control sound for morse tone
     */
    var Tone = morsio.Tone = function(){
        this._construct.apply(this, arguments);
    };

    (function(){
        var api = Tone.prototype;

        /**
         * Defaults:
         * - {String} url : URL of sound file
         */
        api.defaults = {
            url: "morse.ogg"
        };

        api.options = null;
        api.loaded = false;
        api.onLoaded = null;

        api.context = null;
        api.source = null;

        /**
         * Constructor
         * @constructor
         * @param {Object} options
         */
        api._construct = function(options){
            this.config(this.defaults).config(options);
            this.load();
        };

        /**
         * Configure options
         * @alias Composer.prototype.config
         */
        api.config = function(key, value){
            return Composer.prototype.config.apply(this, arguments);
        };

        /**
         * Load sound file
         */
        api.load = function(){
            var my, req, onload;

            my = this;
            this.context = new AudioContext();
            handler = function(e){
                my.context.decodeAudioData(e.target.response, function(buffer){
                    my.source = my._getSource(buffer, my.context);
                    if($.isFunction(my.onLoaded)){
                        my.onLoaded.call(my);
                        my.onLoaded = null;
                    }
                });
            };

            req = new XMLHttpRequest();
            req.open("GET", this.config("url"));
            req.responseType = "arraybuffer";
            req.addEventListener("load", handler);
            req.send();

            return this;
        };


        /**
         * Get BufferSource by buffer and context
         * @param {AudioBuffer} buffer
         * @param {AudioContext} context
         */
        api._getSource = function(buffer, context){
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.loop = true;
            source.gain.value = 0;
            source.noteOn(0);
            return source;
        };

        /**
         * Ready for loading sound data
         * If already loaded, imidiately run callback
         * @param {Function} callback
         */
        api.ready = function(callback){
            if(this.loaded){
                callback.call(this);
                return this;
            }
            this.onLoaded = callback;
            return this;
        };

        /**
         * Sound tone by setting gain to 1
         */
        api.on = function(){
            this.source.gain.value = 1;
        };

        /**
         * Stop tone by setting gain to 0
         */
        api.off = function(){
            this.source.gain.value = 0;
        };

        /**
         * Toggle sound by boolean
         * @param {Boolean} on
         */
        api.toggle = function(on){
            this.source.gain.value = on ? 1 : 0;
        };
    }());



    /**
     * Recorder
     * --------
     * @class Record the morse tones
     */
    var Recorder = morsio.Recorder = function(options){
        this._construct.apply(this, arguments);
    };

    (function(){
        var u, api = Recorder.prototype;

        api.defaults = {
            mode: "alpha"
        };

        api.options = null;
        api.source = [];
        api.tones = null;
        api.recording = false;

        /**
         * Constructor
         * @constructor
         */
        api._construct = function(options){
            this.config(this.defaults).config(options);
        };

        /**
         * Configure options
         */
        api.config = function(options){
            this.options = $.extend(true, {}, this.options, options);
            return this;
        };

        /**
         * Start recording
         */
        api.start = function(){
            if(this.recording){
                return;
            }
            this.source = [];
            this.recording = true;
        };

        /**
         * Stop recording
         */
        api.stop = function(){
            if(! this.recording){
                return;
            }
            this.recording = false;
            this.parse();
        };

        /**
         * Send tone
         * @param {Boolean} on
         */
        api.tone = function(on){
            if(! this.recording){
                return;
            }
            this.source.push([on, (new Date()).getTime()]);
        };

        /**
         * Parse tones to the rounded, get tones string
         * @returns {String}
         */
        api.parse = function(){
            var src, tones, min, durations, res;

            src = this.source;
            tones = [];
            min = null;

            src.forEach(function(tone, i){
                var next, time;
                next = src[i+1];
                if(next === void 0){
                    return tones.push([false, 0]);
                }
                time = next[1] - tone[1];
                tones.push([tone[0], time]);
                min = min ? Math.min(min, time) : time;
            });

            durations = [min, min*3];
            res = [];

            tones.forEach(function(tone, i){
                tone[1] = u.roundIndex(tone[1], durations) ? 3 : 1;
                var prev = tones[i-1];
                if(! tone[0]){
                    res.push(prev[1]);
                    if(tone[1] > 1){
                        return res.push(".");
                    }
                }
            });

            this.tones = res.join("");
            return this.tones;
        };

        /**
         * Utilities
         */
        u = {
            /**
             * Search the nearest value from array
             * and returns as its index
             * @param {Number} num
             * @param {Array} nums
             */
            roundIndex: function(num, nums){
                var diffs = [];
                nums.forEach(function(n, i){
                    diffs[i] = Math.abs(num - n);
                });
                return diffs.indexOf(Math.min.apply(null, diffs));
            },

            combine: function(keys, values){
                var o = [];
                keys.forEach(function(key, i){
                    o[key] = values[i];
                });
                return o;
            }
        };
    }());

    /**
     * Export
     */
    global.morsio = morsio;

}(jQuery, window));

(function($, global){
var morsio = global.morsio = global.morsio || {};
morsio.map = {"alpha":{"97":"13","98":"3111","99":"3131","100":"311","101":"1","102":"1131","103":"331","104":"1111","105":"11","106":"1333","107":"313","108":"1311","109":"33","110":"31","111":"333","112":"1331","113":"3313","114":"131","115":"111","116":"3","117":"113","118":"1113","119":"133","120":"3113","121":"3133","122":"3311"},"num":{"48":"33333","49":"13333","50":"11333","51":"11133","52":"11113","53":"11111","54":"31111","55":"33111","56":"33311","57":"33331"},"symbol":{"33":"313133","40":"31331","41":"313313","44":"331133","45":"311113","46":"131313","47":"31131","63":"113311","64":"133131","72,72":"11111111"},"kana":{"12443":"11","12444":"11331","12450":"33133","12452":"13","12454":"113","12456":"31333","12458":"13111","12459":"1311","12461":"31311","12463":"1113","12465":"3133","12467":"3333","12469":"31313","12471":"33131","12473":"33313","12475":"13331","12477":"3331","12479":"31","12481":"1131","12484":"1331","12486":"13133","12488":"11311","12490":"131","12491":"3131","12492":"1111","12493":"3313","12494":"1133","12495":"3111","12498":"33113","12501":"3311","12504":"1","12507":"311","12510":"3113","12511":"11313","12512":"3","12513":"31113","12514":"31131","12516":"133","12518":"31133","12520":"33","12521":"111","12522":"331","12523":"31331","12524":"333","12525":"1313","12527":"313","12528":"13113","12529":"13311","12530":"1333","12531":"13131"}};
}(jQuery, window));
(function($, global){
var morsio = global.morsio = global.morsio || {};
morsio.validation = {"kana":{"12353":["12450"],"12354":["12450"],"12355":["12452"],"12356":["12452"],"12357":["12454"],"12358":["12454"],"12359":["12456"],"12360":["12456"],"12361":["12458"],"12362":["12458"],"12363":["12459"],"12364":["12459","12443"],"12365":["12461"],"12366":["12461","12443"],"12367":["12463"],"12368":["12463","12443"],"12369":["12465"],"12370":["12465","12443"],"12371":["12467"],"12372":["12467","12443"],"12373":["12469"],"12374":["12469","12443"],"12375":["12471"],"12376":["12471","12443"],"12377":["12473"],"12378":["12473","12443"],"12379":["12475"],"12380":["12475","12443"],"12381":["12477"],"12382":["12477","12443"],"12383":["12479"],"12384":["12479","12443"],"12385":["12481"],"12386":["12481","12443"],"12387":["12484"],"12388":["12484"],"12389":["12484","12443"],"12390":["12486"],"12391":["12486","12443"],"12392":["12488"],"12393":["12488","12443"],"12394":["12490"],"12395":["12491"],"12396":["12492"],"12397":["12493"],"12398":["12494"],"12399":["12495"],"12400":["12495","12443"],"12401":["12495","12444"],"12402":["12498"],"12403":["12498","12443"],"12404":["12498","12444"],"12405":["12501"],"12406":["12501","12443"],"12407":["12501","12444"],"12408":["12504"],"12409":["12504","12443"],"12410":["12504","12444"],"12411":["12507"],"12412":["12507","12443"],"12413":["12507","12444"],"12414":["12510"],"12415":["12511"],"12416":["12512"],"12417":["12513"],"12418":["12514"],"12420":["12516"],"12422":["12518"],"12424":["12520"],"12425":["12521"],"12426":["12522"],"12427":["12523"],"12428":["12524"],"12429":["12525"],"12431":["12527"],"12432":["12528"],"12433":["12529"],"12434":["12530"],"12435":["12531"],"12449":["12450"],"12451":["12452"],"12453":["12454"],"12455":["12456"],"12457":["12458"],"12460":["12459","12443"],"12462":["12461","12443"],"12464":["12463","12443"],"12466":["12465","12443"],"12468":["12467","12443"],"12470":["12469","12443"],"12472":["12471","12443"],"12474":["12473","12443"],"12476":["12475","12443"],"12478":["12477","12443"],"12480":["12479","12443"],"12482":["12481","12443"],"12483":["12484"],"12485":["12484","12443"],"12487":["12486","12443"],"12489":["12488","12443"],"12496":["12495","12443"],"12497":["12495","12444"],"12499":["12498","12443"],"12500":["12498","12444"],"12502":["12501","12443"],"12503":["12501","12444"],"12505":["12504","12443"],"12506":["12504","12444"],"12508":["12507","12443"],"12509":["12507","12444"],"12532":["12454","12443"]}};
}(jQuery, window));