/*
 * Breezko 0.1
 *
 * Iurii Kozuliak
 * Copyright 2013, MIT License
 *
 */

(function (window) {


    "use strict";

    var noop = function () {
    };
    var offloadFn = function (fn) {
        setTimeout(fn || noop, 0)
    }; // offload a callback execution

    var browser = {
        addEventListener:!!window.addEventListener,
        touch:('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions:(function (temp) {
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            for (var i in props) if (temp.style[ props[i] ] !== undefined) return true;
            return false;
        })
    };

    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }

    function Breezko(container, options) {
        this.container = container;
        this.options = extend(this.defaults, options);
        this._init();
    }

    Breezko.prototype = {
        defaults:{
            speed:500,
            limits:{
                'rotateX':[100, 100],
                'rotateY':[-10, 10],
                'rotateZ':[-10, 10],
                'translateX':[-400, 400],
                'translateY':[-300, 300],
                'translateZ':[350, 500]
            }
        },
        _init:function () {

            this.index = 0;
            // cache slides

            this.returnMode = 1;

            this.slides = this.container.children;
            this.length = this.slides.length;


            // stack elements

            this.slides[0].className += ' active';

            this._resetzIndex();

            if (this.options.delay) this._begin();

            if (browser.addEventListener) {

                if (browser.transitions) {
                    this.container.addEventListener('webkitTransitionEnd', this._events, false);
                    this.container.addEventListener('msTransitionEnd', this._events, false);
                    this.container.addEventListener('oTransitionEnd', this._events, false);
                    this.container.addEventListener('otransitionend', this._events, false);
                    this.container.addEventListener('transitionend', this, false);
                }


            } else {

//                window.onresize = function () {
//                    this._init();
//                };
            }
        },
        _goTo:function (to) {

            if (this.index == to) return;

            if (browser.transitions) {

                var direction = Math.abs(this.index - to) / (this.index - to); // 1: backward, -1: forward
                var diff = Math.abs(this.index - to) - 1;

                to = this._circle(to);

                var targetSlide = this.slides[to],
                    currentSlide = this.slides[this.index];

                this._blow(this.index, direction);

            }

            this.index = to;

            if (to == 0 && this.returnMode === 1 && direction === -1 ){
                this.returnMode = -1;
            }
            else  if(to == 0 && this.returnMode === -1 && direction === -1 ){
                this.returnMode = 1;
            }

            this._resetzIndex();


            offloadFn(this.options.callback && this.options.callback(this.index, this.slides[index]));

        },

        _next:function () {
           this._goTo(this.index + 1);
        },

        _prev:function () {
           if(this.index > 0) this._goTo(this.index - 1);
        },

        _circle:function (index) {

            // a simple positive modulo using length
            return (this.length + (index % this.length)) % this.length;

        },

        _blow:function (index, direction) {
            var transformVal = this._getTransform();
            var transformStyle = 'translateX(' + transformVal.tx + 'px) translateY(' + transformVal.ty + 'px) translateZ(' + transformVal.tz + 'px) rotateX(' + transformVal.rx + 'deg) rotateY(' + transformVal.ry + 'deg) rotateZ(' + transformVal.rz + 'deg)';

            if(direction === 1){
                var slide = this.slides[index - 1];

                this._blowAway(slide, transformStyle, -this.returnMode);
            }
            else{
                var slide = this.slides[index];
                this._blowAway(slide, transformStyle, this.returnMode);
            }


        },

        _blowAway: function(slide, transformStyle, mode){

            slide.style.visibility = 'visible';

            mode == 1? this._setTransform(slide, transformStyle) : this._setTransform(slide);

        },


        _resetzIndex : function(){
            var pos = this.slides.length;

            while (pos--) {

                var slide = this.slides[pos];

                slide.setAttribute('data-index', pos);
                slide.style.zIndex = this.length - pos * this.returnMode;
            }
        },

        _setTransform:function (slide, transformStyle, speed) {
            var style = slide && slide.style;
            var speed = speed || this.options.speed;

            var opacity = (transformStyle) ? 0 : 1;

            slide.style.opacity = opacity;

            var transformStyle = transformStyle || "translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)";


            style.webkitTransitionDuration =
                style.MozTransitionDuration =
                    style.msTransitionDuration =
                        style.OTransitionDuration =
                            style.transitionDuration = speed + 'ms';

            style.webkitTransform =
                style.msTransform =
                    style.MozTransform =
                        style.OTransform = transformStyle;

        },
        _getRandom:function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        _getTransform:function () {
            return {
                rx:this._getRandom(this.options.limits.rotateX[0], this.options.limits.rotateX[1]),
                ry:this._getRandom(this.options.limits.rotateY[0], this.options.limits.rotateY[1]),
                rz:this._getRandom(this.options.limits.rotateZ[0], this.options.limits.rotateZ[1]),
                tx:this._getRandom(this.options.limits.translateX[0], this.options.limits.translateX[1]),
                ty:this._getRandom(this.options.limits.translateY[0], this.options.limits.translateY[1]),
                tz:this._getRandom(this.options.limits.translateZ[0], this.options.limits.translateZ[1])

            }
        },
        _begin:function () {

            var self = this;

            this.interval = setInterval(function(){self._next()}, this.options.delay || 0);
        },

        _stop:function () {

            this.delay = 0;
            clearTimeout(this.interval);

        },
        handleEvent:function (event) {

            switch (event.type) {
                case 'webkitTransitionEnd':
                case 'msTransitionEnd':
                case 'oTransitionEnd':
                case 'otransitionend':
                case 'transitionend':
                    offloadFn(this._transitionEnd(event));
                    break;
            }

            if (this.options.stopPropagation) event.stopPropagation();

        },
        _transitionEnd:function (event) {

            var slide = event.target;

            slide.className = slide.className.replace(/(?:^|\s)active(?!\S)/g, '');
            if(slide.style.opacity == 0)
                slide.style.visibility = 'hidden';

            if (parseInt(event.target.getAttribute('data-index'), 10) == this.index) {
                this.options.transitionEnd && this.options.transitionEnd.call(event, this.index, this.slides[this.index]);
            }

        },
        next:function () {

            this._next();

        },
        prev:function () {

            this._prev();

        },

        start:function (delay) {
            this.options.delay = delay;
            this._begin();

        },

        stop:function () {
            this._stop();

        }
    }


    window.Breezko = Breezko;

//    if (window.jQuery || window.Zepto) {
//        (function ($) {
//            $.fn.Breeze = function (params) {
//                return this.each(function () {
//                    $(this).data('Breeze', new Breeze($(this)[0], params));
//                });
//            }
//        })(window.jQuery || window.Zepto)
//    }
})(window);