/*!
 * morsio.js
 * ---------
 * Library for parsing and sounding morse tones
 *
 * @version 0.1.0
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
        var api = Composer.prototype;

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
        api.codes = null;
        api._codes = null;
        api.playing = false;
        api.timer = null;

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
         * Parse string to morse tones
         * @param {String} message
         */
        api.parse = function(message){
            var my, map;

            my = this,
            map = this.map();
            this.codes = [];

            message.toLowerCase().split("").forEach(function(s){
                var item = map[s.charCodeAt(0)];
                if(! item){
                    my.codes.push([false, 7]);
                    return;
                }
                item.split("").forEach(function(code){
                    code = parseInt(code, 10);
                    my.codes.push([true, code]);
                    my.codes.push([false, 1]);
                });
                my.codes.push([false, 3]);
            });

            return this;
        };

        /**
         * Get map to convert message
         * @returns {Object}
         */
        api.map = function(){
            var src, map = {};
            src = morsio.map;
            $.extend(map, src.symbol, src.num, src[this.config("mode")]);
            return map;
        };

        /**
         * Start playing message
         */
        api.play = function(){
            if(! this.playing){
                this.playing = true;
                this._codes = this.codes;
                this.process();
            }
            return this;
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
            var code, o = this.options;
            if(! this.playing){
                return;
            }
            code = this._codes.shift();
            if(! this._codes.length || ! code.length){
                o.complete();
                this.playing = false;
                return;
            }
            o.process.apply(this, code);
            this.timer = setTimeout(this.process, code[1] * o.time);
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
     * Export
     */
    global.morsio = morsio;

}(jQuery, window));

(function($, global){
var morsio = global.morsio = global.morsio || {};
morsio.map = {"alpha":{"97":"13","98":"3111","99":"3131","100":"311","101":"1","102":"1131","103":"331","104":"1111","105":"11","106":"1333","107":"313","108":"1311","109":"33","110":"31","111":"333","112":"1331","113":"3313","114":"131","115":"111","116":"3","117":"113","118":"1113","119":"133","120":"3113","121":"3133","122":"3311"},"num":{"48":"33333","49":"13333","50":"11333","51":"11133","52":"11113","53":"11111","54":"31111","55":"33111","56":"33311","57":"33331"},"symbol":{"33":"313133","40":"31331","41":"313313","44":"331133","45":"311113","46":"131313","47":"31131","63":"113311","64":"133131","72,72":"11111111"},"kana":{"12443":"11","12444":"11331","12450":"33133","12452":"13","12454":"113","12456":"31333","12458":"13111","12459":"1311","12461":"31311","12463":"1113","12465":"3133","12467":"3333","12469":"31313","12471":"33131","12473":"33313","12475":"13331","12477":"3331","12479":"31","12481":"1131","12484":"1331","12486":"13133","12488":"11311","12490":"131","12491":"3131","12492":"1111","12493":"3313","12494":"1133","12495":"3111","12498":"33113","12501":"3311","12504":"1","12507":"311","12510":"3113","12511":"11313","12512":"3","12513":"31113","12514":"31131","12516":"133","12518":"31133","12520":"33","12521":"111","12522":"331","12523":"31331","12524":"333","12525":"1313","12527":"313","12528":"13113","12529":"13311","12530":"1333","12531":"13131"}};
}(jQuery, window));