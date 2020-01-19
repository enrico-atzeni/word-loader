(function(){
    var WordLoader = function(element, args) {
        args = args || {};
        var _this = this,

            // to prevent infinite loop in avoid check
            avoidCount = 0; 
            maxAvoidPerIteration = 10,

            avoidAreaCache = null;

        // configuration
        const defaults = {
            // how much time the word will stay on page
            timeout: 300,

            // how much time the fading effect will last
            fadingDuration: 200,

            // how much time the fading effect will last
            overlayFadingDuration: 200,

            // how much time to wait before force-stop the loader if window.load event 
            // has not yet been triggered
            // useful to circumvent some eventual bug on event load listener
            forceStopTimeout: 20000,

            // how many words can at maximum been handled
            // avoid memory leaks
            maxWords: 50,

            // what class(es) to use for the word element
            wordClasses: 'word-word',

            // how much percentual of window will be used to display the words
            // percentual, from 0 (only center coords) to 100 (all screen)
            rangeAvailableFromCenter: 50, 

            // how much minimum distance in percentual successives words will have
            // Note: setting this value != false will make the animation NOT real random
            // absolute, distance between previous percentual position and new one
            // 0|false to make REAL random
            rangeDistanceFalseRandom: 10,

            // the words list
            words: false,

            // set a minimum time (in ms) for wich the loader will alyways be visible
            // even if load trigger has already been called
            minimumTime: 0,

            // to expose additional methods
            debug: false,

            // event on wich hide the loader 
            // (can be load or DOMContentLoaded or any custom event)
            hideOn: "load",

            // area where words cannot be displayed
            /* 
                example config.
                x,y,width,height can be % or px
                {
                    center: {
                        x: "50%",
                        y: "50%"
                    },
                    width: "10%",
                    height: "10%",
                }
            */ 
            avoid: null
        };
        
        // populate options with
        var options = {};
        for (var k in defaults) {
            options[k] = k in args ? args[k] : defaults[k];
        }
        
        // check fields consistency
        if (options.rangeDistanceFalseRandom && options.rangeAvailableFromCenter / 2 <= options.rangeDistanceFalseRandom * 1.2) {
            options.rangeDistanceFalseRandom = 0;
            console.error("Cannot enable rangeDistanceFalseRandom because too close to rangeAvailableFromCenter");
        }

        // get element from DOM
        if (typeof element == "object" && !"tagName" in element) {
            console.error(element, "must be an ID or a valid DOM element");
            return false;
        }

        if (typeof element == "string") {
            // fetch element from DOM
            element = document.getElementById(element);
        }
        
        // check if element exists in DOM
        if (!element) {
            console.error(element,"invalid or not found in DOM");
            return;
        }

        if (!options.words) {
            // get words
            if (words_json = element.getAttribute("words")) {
                try {
                    options.words = JSON.parse(words_json);
                } catch (e) {
                    console.error(e);
                }
            }

            if (!options.words) {
                if (typeof wl_words == 'object' && wl_words.length) {
                    options.words = wl_words;
                } else {
                    options.words = ["You", "need", "to", "insert", "some", "words"];
                }
            }
        }
        

        // avoid too many words that can absorbe too much CPU usage
        if (options.words.length > options.maxWords) {
            options.words.splice(options.maxWords);
        }

        // add words to the DOM
        var alreadyShowedWords = [],
            domWords = [],
            previousPos = false,
            currentShowedWord = false;

        for (var i = 0; i < options.words.length; i++) {
            var w = options.words[i];
            domWords[w] = createWordElement(w)
            element.appendChild(domWords[w]);
        }

        // add animation timing to page
        var timing_ms = options.fadingDuration / 1000, // seconds to milliseconds
            css = document.createElement('style');

        css.type = 'text/css';
        css.innerHTML = `
        #word-loader .`+ options.wordClasses.replace(/ /g,'.') +` {
            transition: opacity `+ timing_ms + `s ease, transform ` + timing_ms +`s ease;
            -moz - transition: opacity `+ timing_ms + `s ease, transform ` + timing_ms +`s ease;
            -webkit - transition: opacity `+ timing_ms + `s ease, transform ` + timing_ms +`s ease;
        }
        #word-loader {
            transition: `+ timing_ms + `s ease opacity;
            -moz - transition: `+ timing_ms + `s ease opacity;
            -webkit - transition: `+ timing_ms +`s ease opacity;
        }
        #word-loader.hidden {
            opacity: 0;
        }`;
        document.head.appendChild(css);

        // start showing!
        showWord();
        
        // force stop after huge timeout
        var forceStopTimeout = setTimeout(this.stopLoop, options.forceStopTimeout);

        // stop on page load
        var doStop = false;
        
        // target is window or document?
        options.hideOn == "load" ? 
            window.addEventListener(options.hideOn, stopOnEvent)
            : 
            document.addEventListener(options.hideOn, stopOnEvent);
        

        // to use set the minimum Time start date, only if needed!
        if (options.minimumTime) {
            try {
                // force as Int
                options.minimumTime = parseInt(options.minimumTime);
                this.startedAt = new Date().getTime();
            } catch (e) {
                console.error(e);
                options.minimumTime = 0;
            }
        }

        if (options.avoid) {
            // precalculate avoid area
            try {
                calculateAvoidArea();
            } catch (e) {
                console.error("WordLoader: Wrong avoid option configuration", e);
            }
        }

        // methods
        this.stopLoop = function() {
            doStop = true;
            element.classList.add("hidden");
            clearInterval(forceStopTimeout);

            setTimeout(function(){
                if (!options.debug) {
                    element.parentElement.removeChild(element);
                } else {
                    element.style.zIndex = -1;
                    console.debug("WordLoader: stopped and in debug mode", this);
                }
            }, options.overlayFadingDuration);
        
        }

        function stopOnEvent() {
            if (options.minimumTime > 0) {
                let endedAt = new Date().getTime();
                let timeElapsed = endedAt - _this.startedAt;

                if (timeElapsed < options.minimumTime) {
                    setTimeout(_this.stopLoop, options.minimumTime - timeElapsed);

                    if (options.debug) {
                        console.debug("WordLoader: waiting other", 
                                        options.minimumTime - timeElapsed, 
                                        "before closing becase of the minimumTime option");
                    }
                    return;
                }
            }
            _this.stopLoop();
        }

        function createWordElement(word) {
            var b = document.createElement("span");
            b.innerText = word;
            b.className = options.wordClasses;
            return b;
        }

        function hideCurrentWord() {
            if (!currentShowedWord) {
                return;
            }

            domWords[currentShowedWord].classList.remove("shown");
        }

        function showWord() {
            if (doStop) return;

            hideCurrentWord();
            
            // wait for animation to terminate
            setTimeout(function () {
                if (doStop) return;

                currentShowedWord = fetchWordToShow();

                // reset avoid count per iteration
                avoidCount = 0;
                
                // generate coords random
                var pos = getRandomPos();

                // console.log(x,y);

                domWords[currentShowedWord].style.top = pos.y;
                domWords[currentShowedWord].style.left = pos.x;

                domWords[currentShowedWord].classList.add("shown");

                // wait for animation to terminate
                setTimeout(function(){
                    if (doStop) return;

                    // wait for next iteration
                    setTimeout(showWord, options.timeout);

                }, options.fadingDuration);
            }, options.fadingDuration);
        }

        function pxToPercentual(px) {
            var pxVal = parseInt(px);
            return pxVal / (window.innerWidth/100);
        }

        function calculateAvoidArea() {
            // transform all in %
            var centerX = options.avoid.center.x.indexOf('%') ? parseInt(options.avoid.center.x) : pxToPercentual(options.avoid.center.x);
            var centerY = options.avoid.center.y.indexOf('%') ? parseInt(options.avoid.center.y) : pxToPercentual(options.avoid.center.y);
            var halfW = (options.avoid.width.indexOf('%') ? parseInt(options.avoid.width) : pxToPercentual(options.avoid.width)) / 2;
            var halfH = (options.avoid.height.indexOf('%') ? parseInt(options.avoid.height) : pxToPercentual(options.avoid.height)) / 2;

            avoidAreaCache = {
                minX: centerX - halfW,
                maxX: centerX + halfW,
                minY: centerY - halfH,
                maxY: centerY + halfH
            };

            // check for validity: if avoidArea is greater than rangeAvailableFromCenter
            // we cannot display words!
            if (options.rangeAvailableFromCenter / 2 <= (50-avoidAreaCache.minX+5) 
                || options.rangeAvailableFromCenter / 2 <= (50-avoidAreaCache.minY+5)) {
                console.error("WordLoader: avoid area is too big respect of the allowed area. Avoid option will be disabled, increase rangeAvailableFromCenter or decrease the avoid area");
                options.avoid = false;
            }
        }

        function showAvoidArea() {
            if (!options.avoid) {
                console.debug("WordLoader: no avoid setting defined");
                return;
            }

            var avoidAreaElement = document.createElement('div');
            avoidAreaElement.style.position = 'absolute';
            avoidAreaElement.style.top = avoidAreaCache.minY + '%';
            avoidAreaElement.style.left = avoidAreaCache.minX + '%';
            avoidAreaElement.style.width = (avoidAreaCache.maxX - avoidAreaCache.minX) + '%';
            avoidAreaElement.style.height = (avoidAreaCache.maxY - avoidAreaCache.minY) + '%';
            avoidAreaElement.style.zIndex = 999999;
            avoidAreaElement.style.background = 'rgba(255,0,0,.5)';
            avoidAreaElement.style.padding = '.5em';
            avoidAreaElement.style.fontSize = '.8em';
            avoidAreaElement.style.boxSizing = 'border-box';

            avoidAreaElement.innerText = "This is the Avoid Area";

            element.appendChild(avoidAreaElement);
        }

        function isBetween(x, bound0, bound1) {
            return x >= bound0 && x <= bound1;
        }

        function isInAvoidArea(x, y, word) {
            if (!options.avoid || avoidCount >= maxAvoidPerIteration) {
                return false;
            }

            avoidCount++;
            
            if (
                    isBetween(x, avoidAreaCache.minX, avoidAreaCache.maxX)
                    &&
                    isBetween(y, avoidAreaCache.minY, avoidAreaCache.maxY)
                ) {
                return true;
            }

            // calculate word dimension
            var wordEl = document.createElement('div');
            wordEl.innerText = word;
            wordEl.className = options.wordClasses.replace(/ /g, '.');
            wordEl.style.zIndex = -9;
            wordEl.style.top = '-99vw';
            wordEl.style.left = '-99vh';
            element.appendChild(wordEl);

            // multiply by 1.5 to keep in mind the transform:scale(1.5) factor
            // without waiting for the transition to end
            var wordSize = {
                width: pxToPercentual(wordEl.offsetWidth * 1.5),
                height: pxToPercentual(wordEl.offsetHeight * 1.5),
            };

            element.removeChild(wordEl);

            // check if only a segment overlap with the avoid area
            if (x < avoidAreaCache.maxX && x + wordSize.width > avoidAreaCache.minX 
                &&
                y < avoidAreaCache.maxY && y + wordSize.height > avoidAreaCache.minY
            ) {
                return true;
            }

            return false;
        }

        function getRandomPos() {
            var r = options.rangeAvailableFromCenter / 2;
            var x = randBetween(50 - r, 50 + r);
            var y = randBetween(50 - r, 50 + r);

            if (options.rangeDistanceFalseRandom) {
                if (previousPos) {
                    // while both coords are close
                    while (Math.abs(x - previousPos.x) <= options.rangeDistanceFalseRandom && Math.abs(y - previousPos.y) <= options.rangeDistanceFalseRandom) {
                        x = randBetween(50 - r, 50 + r);
                        y = randBetween(50 - r, 50 + r);
                    }
                }

                previousPos = {
                    x: x,
                    y: y
                }
            }

            if (isInAvoidArea(x, y, currentShowedWord)) {
                console.debug("WordLoader: avoiding!", avoidCount);
                return getRandomPos();
            }

            return {
                x: x + '%',
                y: y + '%'
            };
        }

        function randBetween(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        function fetchWordToShow() {
            if (alreadyShowedWords.length >= options.words.length) {
                // reset if already showed all of them
                alreadyShowedWords = [];
            }

            // calculate difference to avoid random on while loop 
            // (too much expensive when few words remaining)
            let difference = options.words.filter(x => !alreadyShowedWords.includes(x));
            
            let word = difference[randBetween(0, difference.length) ];
            alreadyShowedWords.push(word);

            return word;
        }

        // add public methods for debug
        if (options.debug) {
            this.options = options;
            this.element = element;

            this.show = function() {
                doStop = false;
                element.removeAttribute("style");
                element.classList.remove("hidden");
                showWord();
            };

            // show avoid area
            showAvoidArea();

            // expose this istance as public in window object
            window.wloaders ? window.wloaders.push(this) : window.wloaders = [this];
            console.debug("WordLoader: istance available in window.wloaders with index", window.wloaders.length-1);
            console.log('WordLoader: to see debug info activate the "Verbose" filter in the console');
        }
    }

    window.WordLoader = WordLoader;
})()