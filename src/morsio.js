(function($, global){

    /**
     * morsio
     * ------
     */
    var morsio = {};

    /**
     * Compatibility
     * -------------
     */
    global.AudioContext = global.AudioContext
        || global.webkitAudioContext;
    global.AudioContext.prototype.createGain = global.AudioContext.prototype.createGain
        || global.AudioContext.prototype.createGainNode;

    /**
     * Utilities
     * ---------
     */
    morsio.utils = {

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
        },

        /**
         * Bind functions to object
         * @param {Object} obj
         * @param {Array} props
         */
        delegate: function(obj, props){
            props.forEach(function(name){
                obj[name] = obj[name].bind(obj);
            });
        },

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

        /**
         * Combine keys and values to an object
         * @param {Array} keys
         * @param {Array} values
         * @return {Object}
         */
        combine: function(keys, values){
            var o = [];
            keys.forEach(function(key, i){
                o[key] = values[i];
            });
            return o;
        },

        /**
         * Configure options (use with `apply`)
         * @param {Object|String} options|key
         * @param {*} value
         * @returns {*}
         */
        config: function(){
            var args = arguments;
            this.options = this.options || {};
            switch($.type(args[0])){
                case "string":
                    if(args.length < 2){
                        return this.options[args[0]];
                    }
                    this.options[args[0]] = args[1];
                    return this;
                case "object":
                    this.options = $.extend(true, {}, this.options, args[0]);
                    return this;
                case "undefined":
                    return this.options;
                default: break;
            }
            return this;
        }

    };

    /**
     * Composer
     * --------
     * @class Parse text message to morse tones and play it
     */
    var Composer = morsio.Composer = function(){
        this._construct.apply(this, arguments);
    };

    (function(){
        var api = Composer.prototype,
            u = morsio.utils;

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
         */
        api.config = function(){
            return u.config.apply(this, arguments);
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
            !! tones && tones.replace(this.regMode, "").split("").forEach(function(tone){
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

            tones = tones || this.tones || "";
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
         * Clear composed data
         */
        api.clear = function(){
            this.tones = null;
            this._tones = null;
        };

        /**
         * Load tones string and initialize
         * @param {String} tones
         * @returns {Composer|Boolean}
         */
        api.load = function(tones){
            var my = this;

            if(! /^([\w]+:)?[\d\.]+$/.test(tones)){
                return false;
            }
            this.config("mode", (function(){
                var m = tones.match(my.regMode);
                return m ? m[1] : my.config("mode");
            }()));
            this.tones = tones.replace(my.regMode, "");
            return this;
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
        var api = Tone.prototype,
            u = morsio.utils;

        api.touchable = (void 0 !== window.ontouchstart);
        api.doc = null;
        api.context = null;
        api.osc = null;
        api.gain = null;

        /**
         * Constructor
         * @constructor
         */
        api._construct = function(){
            u.delegate(this, ["onFirstTouch"]);

            // nodes
            this.doc = $(document);
            this.context = new AudioContext();
            this.osc = this.context.createOscillator();
            this.gain = this.context.createGain();
            this.gain.gain.value = 0;

            // connection
            this.osc.connect(this.gain);
            this.gain.connect(this.context.destination);

            if(this.touchable){
                return this.doc.on("touchstart", this.onFirstTouch);
            }

            this.osc.start(0);
        };

        /**
         * Handler for first touch event
         */
        api.onFirstTouch = function(){
            this.osc.start(0);
            this.doc.off("touchstart", this.onFirstTouch);
        };

        /**
         * Toggle on/off of sound
         * @param {Boolean} on
         */
        api.toggle = function(on){
            this.gain.gain.value = on ? 1 : 0;
            return this;
        };

        /**
         * Play sound
         */
        api.on = function(){
            return this.toggle(true);
        };

        /**
         * Mute sound
         */
        api.off = function(){
            return this.toggle(false);
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
        var api = Recorder.prototype,
            u = morsio.utils;

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
        api.config = function(){
            return u.config.apply(this, arguments);
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
         * Clear recorded data
         */
        api.clear = function(){
            this.source = [];
            this.tones = null;
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

    }());

    /**
     * Export
     */
    global.morsio = morsio;

}(jQuery, this));
