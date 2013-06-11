/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
 */

var Breeze = function(container, options) {

    "use strict";

    // utilities
    var noop = function () {
    }; // simple no operation function
    var offloadFn = function (fn) {
        setTimeout(fn || noop, 0)
    }; // offload a functions execution

    // check browser capabilities
    var browser = {
        addEventListener:!!window.addEventListener,
        touch:('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions:(function (temp) {
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            for (var i in props) if (temp.style[ props[i] ] !== undefined) return true;
            return false;
        })(document.createElement('swipe'))
    };

    // quit if no root element
    if (!container) return;
    var element = container;
    var slides, slidePos, width, length, pagButtons;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 700;
    options.continuous = options.continuous !== undefined ? options.continuous : true;

    function setup() {

        // cache slides
        slides = element.children;
        length = slides.length;

        // set continuous to false if only one slide
        if (slides.length < 2) options.continuous = false;

        // create an array to store current positions of each slide
        slidePos = new Array(slides.length);

        // stack elements
        var pos = slides.length;

        slides[0].className += ' active';

        console.log(slides);

        while (pos--) {

            var slide = slides[pos];

            slide.setAttribute('data-index', pos);

            if (browser.transitions) {

            }
        }

        // reposition elements before and after index
        if (options.continuous && browser.transitions) {

        }

    }

    function goTo(to, speed) {


        // do nothing if already on requested slide
        if (index == to) return;

        if (browser.transitions) {

            var direction = Math.abs(index - to) / (index - to); // 1: backward, -1: forward

            var diff = Math.abs(index - to) - 1;

            to = circle(to);
            slides[to].className += ' active';
            blow(index, speed);

        }

        index = to;
        offloadFn(options.callback && options.callback(index, slides[index]));

    }

    function next() {

        if (options.continuous) goTo(index + 1);
        else if (index < slides.length - 1) slideTo(index + 1);

    }

    function circle(index) {

        // a simple positive modulo using slides.length
        return (slides.length + (index % slides.length)) % slides.length;

    }

    function blow(index, speed) {

        var slide = slides[index];

        var transformVal = getTransform();
        var transformStyle = 'translateX(' + transformVal.tx + 'px) translateY(' + transformVal.ty + 'px) translateZ(' + transformVal.tz + 'px) rotateX(' + transformVal.rx + 'deg) rotateY(' + transformVal.ry + 'deg) rotateZ(' + transformVal.rz + 'deg)';

        setTransform(slide, transformStyle);

    }

    function setTransform(slide, transformStyle){

        var style = slide && slide.style;

        style.webkitTransitionDuration =
            style.MozTransitionDuration =
                style.msTransitionDuration =
                    style.OTransitionDuration =
                        style.transitionDuration = speed + 'ms';

        style.webkitTransform =
            style.msTransform =
                style.MozTransform =
                    style.OTransform = transformStyle;
    }


    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getTransform() {
        return {
            rx:getRandom(100, 100),
            ry:getRandom(-10, -10),
            rz:getRandom(-10, 10),
            tx:getRandom(-100, 100),
            ty:getRandom(-200, -200),
            tz:getRandom(-100, 100)
        }
    }

    function resetTransform() {
        return 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    }


// setup auto slideshow
    var delay = options.auto || 0;
    var interval;

    function begin() {

        interval = setTimeout(next, delay);

    }

    function stop() {

        delay = 0;
        clearTimeout(interval);

    }


// setup event capturing
    var events = {

        handleEvent:function (event) {

            switch (event.type) {
                case 'touchstart':
                    this.start(event);
                    break;
                case 'touchmove':
                    this.blow(event);
                    break;
                case 'touchend':
                    offloadFn(this.end(event));
                    break;
                case 'webkitTransitionEnd':
                case 'msTransitionEnd':
                case 'oTransitionEnd':
                case 'otransitionend':
                case 'transitionend':
                    offloadFn(this.transitionEnd(event));
                    break;
                case 'resize':
                    offloadFn(setup.call());
                    break;
            }

            if (options.stopPropagation) event.stopPropagation();

        },
        transitionEnd:function (event) {

            event.target.className = event.target.className.replace(/(?:^|\s)active(?!\S)/g, '')

            setTransform(event.target, resetTransform());

            if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

                if (delay) begin();

                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

            }

        }

    }

// trigger setup
    setup();

// start auto slideshow if applicable
    if (delay) begin();


// add event listeners
    if (browser.addEventListener) {

        // set touchstart event on element
        if (browser.touch) element.addEventListener('touchstart', events, false);

        if (browser.transitions) {
            element.addEventListener('webkitTransitionEnd', events, false);
            element.addEventListener('msTransitionEnd', events, false);
            element.addEventListener('oTransitionEnd', events, false);
            element.addEventListener('otransitionend', events, false);
            element.addEventListener('transitionend', events, false);
        }

        // set resize event on window
        window.addEventListener('resize', events, false);

    } else {

        window.onresize = function () {
            setup()
        }; // to play nice with old IE

    }

// expose the Swipe API
    return {
        setup:function () {

            setup();

        },
        next:function () {

            next();

        },
        slideTo:function (to, speed, event) {

            // cancel slideshow
            stop();

            slideTo(to, speed, event);

        },
        getPos:function () {

            // return current index position
            return index;

        },
        getNumSlides:function () {

            // return total number of slides
            return length;
        },
        kill:function () {

            // cancel slideshow
            stop();

            // reset element
            element.style.width = 'auto';
            element.style.left = 0;

            // reset slides
            var pos = slides.length;
            while (pos--) {

                var slide = slides[pos];
                slide.style.width = '100%';
                slide.style.left = 0;


            }

            // removed event listeners
            if (browser.addEventListener) {

                // remove current event listeners
                element.removeEventListener('touchstart', events, false);
                element.removeEventListener('webkitTransitionEnd', events, false);
                element.removeEventListener('msTransitionEnd', events, false);
                element.removeEventListener('oTransitionEnd', events, false);
                element.removeEventListener('otransitionend', events, false);
                element.removeEventListener('transitionend', events, false);
                window.removeEventListener('resize', events, false);

            }
            else {

                window.onresize = null;

            }

        }
    }

}


if (window.jQuery || window.Zepto) {
    (function ($) {
        $.fn.Breeze = function (params) {
            return this.each(function () {
                $(this).data('Breeze', new Breeze($(this)[0], params));
            });
        }
    })(window.jQuery || window.Zepto)
}
