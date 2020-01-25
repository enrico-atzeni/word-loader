# Word Loader
A JavaScript library that adds a loader on pages that shows words in random position and order

## Basic Usage
1. Add a DIV for the wrapper in your page
```
<div id="word-loader"></div>
```

2. Includes CSS and JS files
```
<link rel="stylesheet" href="src/word-loader.css" />
<script type="text/javascript" onload="new WordLoader('word-loader')" defer async src="src/word-loader.js"></script>
```

Well done! This is the minimal usage!
We use the `onload` attribute of the script tag to create the Word Loader object as soon as possibile, without adding other JavaScript code in the page, but if you prefer you can move the initialization everywhere you want, just make sure that the Word Loader class has fully loaded!

## Pass your words list
You can pass your words list via attribute in the wrapper element as a JSON encoded string (make sure that the encoded string has also been passed by an htmlentities function if you're using PHP as web server language).
```
<div id="word-loader" words="['Some', 'word', 'list', 'here']"></div>
```

or declaring it as a global JavaScript variable named `wl_words` before calling `new WordLoader`
```
<script>var wl_words = ["Some", "word", "list", "here"]</script>
...
<script>new WordLoader('word-loader')</script>
```

or passing it as an option
```
new WordLoader('word-loader', {words: ["Some", "word", "list", "here"]})
```

## Options
You can customize the behavior of the Word Loader using one the allowed options, here is the full list:
```
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
hideOn: "load"

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
avoid: {
    center: {
        x: "50%",
        y: "50%"
    },
    width: "15%",
    height: "6%"
},

// to show an additional standard loader in the middle of the page
centerLoader: true
```

## Advanced usage examples
### Make it always visible for X seconds
Sometimes your page load very fast but you always want to show Word Loader for a minimum time.
In this case you can use the `minimumTime` options settings the amount of milliseconds you want the Word Loader be shown even if the page has already been fully loaded.
```
new WordLoader('word-loader', {minimumTime: 3000})
```
This will show the Word Loader for a minimum of 3 seconds, even if the page has already been fully loaded.

### Debugging mode
```
new WordLoader('word-loader', {debug: true})
```
This mode doesn't remove the DOM element after hiding it and expose the instance publicy in the `window` object, so you can access its properties, reshow it and fix eventual conflicts with other code in your page.

### Avoiding an area of the page
```
new WordLoader('word-loader', {
    avoid: {
        center: {
            x: "50%",
            y: "50%"
        },
        width: "25%",
        height: "25%",
    }
})
```
Prevent words to appear in a particulare region of the page. Word box size will be automatically calculated on runtime, so keep in mind when adding a lot of effects and transition to the word element.
I suggest to enable the debug mode while trying this property because the avoid area will be shown in the page as a red transparent box.

