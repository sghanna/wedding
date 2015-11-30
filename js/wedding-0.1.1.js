/* Copyright (C) Minted, LLC - Proprietary, All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

var BreakpointDetection = (function() {
  var _this = this;
  // in the form of {'alias': 'detection-element-html'}
  this.breakpoints = {};
  this.defaultPlaceholder = '<div class="breakpoint-detection"></div>';
  this.placeholderEl = null;

  // event to emit when a changed in the viewport based on the breakpoints is detected
  this.viewportChanged = document.createEvent('CustomEvent');

  var addDetection = function(breakpoints, interval) {
    // adds the breakpoint elements to the DOM and listens
    // on the window.resize event

    document.addEventListener('DOMContentLoaded', function() {
      for(var alias in breakpoints) {
        // add the breakpoints inside the placeholder element and keep a reference to them
        _this.placeholderEl.insertAdjacentHTML('afterbegin', breakpoints[alias]);
        _this.breakpoints[alias] = _this.placeholderEl.childNodes[0];
      }

      // if an interval is provided to the function, listen on the resize
      // event with a debounce and emit the 'sgaas:viewport-changed' event
      // when appropriate
      if(interval) {
        _this.viewportChanged.initEvent('sgaas:viewport-changed', true, false);
        var emitViewportChanged = debounce(function() {
          if(self.last !== self.current) {
            window.dispatchEvent(_this.viewportChanged);
          }

          self.last = self.current;
        }, interval);

        window.addEventListener('resize', emitViewportChanged);
      }

      self.last = self.current;
    });
  };

  // adds the placeholder element for holding the breakpoint
  // elements to the DOM
  var addPlaceholder = function(placeholder) {
    var outer = document.createElement('div');
    outer.innerHTML = placeholder || _this.defaultPlaceholder;
    document.body.appendChild(outer);
    _this.placeholderEl = outer.childNodes[0];
  };

  // simply element hidden detection
  var elementIsHidden = function(el) {
    return (el.offsetParent === null);
  };

  // simple debounce function that will execute on the trailing edge
  var debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // returns the current breakpoint/viewport alias
  var getCurrent = function() {
    var current = null;

    for(var alias in _this.breakpoints) {
      if(self.is(alias)) {
        current = alias;
      };
    }
    return current;
  }

  // the public API exposes 'last' and 'current' properties that indicate
  // the current breakpoint alias, as well as a single function for determining
  // if the current alias matches the provided argument
  var self = {
    last: null,

    is: function(alias) {
      return _this.breakpoints[alias] && !elementIsHidden(_this.breakpoints[alias]);
    }
  };

  Object.defineProperty(self, 'current', {get: getCurrent, enumerable: true});

  // add the placehoder and breakpoint detection and return the object
  return function(breakpoints, interval, placeholder) {
    addPlaceholder(placeholder);
    addDetection(breakpoints, interval);
    return self;
  };
})();

window.StyleGuide = (function() {
  var StyleGuide = {};

  StyleGuide.Fonts = {
    styles: {
      body: {
        family: "MrsEavesRoman",
        weight: "500",
        style: "normal",
        sizeFactor: 1.30
      },
      
      secondary: {
        family: "MrsEavesRoman",
        weight: "500",
        style: "normal",
        sizeFactor: 1.30
      },
      
      heading: {
        family: "Futura Std",
        weight: "700",
        style: "normal",
        sizeFactor: 1.20
      },
      
      hero: {
        family: "Bombshell Pro",
        weight: "400",
        style: "normal",
        sizeFactor: 1.20
      }
      },

    selectors: {
      'hero': [
        '.m-hero-text'
      ],

      'secondary': [
        '.m-secondary-text'
      ],

      'body': [
        'body',
        '.m-body-text',
        '.m-btn-base'
      ],

      'heading': [
        'h1',
        '.h1',
        'h2',
        '.h2',
        'h3',
        '.h3',
        'h4',
        '.h4',
        'h5',
        '.h5',
        'h6',
        '.h6',
        '.m-heading-text'
      ]
    },

    applied: [],

    init: function(config) {
      var self = this;

      config = config || {};

      if(config.selectors) {
        // merge the selectors object to allow for consumer specificity
        Object.keys(config.selectors).forEach(function(key) {
          var selectorConfig = config.selectors[key];
          if(typeof(selectorConfig) == 'object' && !Array.isArray(selectorConfig)) {
            if(selectorConfig.prefix) {
              self.selectors[key] = self.selectors[key].map(function(s) {
                return selectorConfig.prefix + s;
              });
            }
          } else if(Array.isArray(selectorConfig)) {
            self.selectors[key] = selectorConfig;
          }
        });
      }

      var applyDefaults = function() {
        // applies the size factors specified in the design
        // to the default selectors
        Object.keys(self.selectors).forEach(function(key) {
          var sizeFactor = self.styles[key].sizeFactor;
          var selectors = self.selectors[key];
          self.applySizeFactor(key, selectors.join(', '));
        });
      }

      window.addEventListener('sgaas:viewport-changed', function(e) {
        // when the viewport changes based on the breakpoints given,
        // remove existing font resizing and re-apply the defaults
        self.removeResizing();
        applyDefaults();
      });

      // apply the default font size factors
      applyDefaults();
    },

    removeResizing: function() {
      // removes direct 'font-size' declarations
      // on the elements that have had them applied
      while(this.applied.length) {
        var el = this.applied.pop();
        el.style['font-size'] = '';
      }
    },

    applySizeFactor: function(name, selector) {
      // increases font sizes on elements matching the provided selector
      // by the factor for the font 'class' name provided (eg: hero, heading, secondary)
      var sizeFactor = this.styles[name].sizeFactor;
      if(!sizeFactor) {
        return;
      }

      var els = document.querySelectorAll(selector);
      for(var i = 0; i < els.length; i++) {
        // use the computed style to determine font size
        var el = els[i];
        style = window.getComputedStyle(el);

        // apply the sizing factor if one has not already been applied
        if(this.applied.indexOf(el) === -1) {
          el.style['font-size'] = parseFloat(style['font-size']) * sizeFactor + 'px';

        // keep track of the elements that have been modified
          this.applied.push(el);
        }
      }
    }

  };

  // expose the Styleguide object on the window
  return StyleGuide;
})();