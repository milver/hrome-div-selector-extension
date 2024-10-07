(function($) {

    var DomOutline = function (options) {
        options = options || {};

        var pub = {};
        var self = {
            opts: {
                namespace: options.namespace || 'DomOutline',
                borderWidth: options.borderWidth || 2,
                onClick: options.onClick || false,
                filter: options.filter || false
            },
            keyCodes: {
                BACKSPACE: 8,
                ESC: 27,
                DELETE: 46
            },
            active: false,
            initialized: false,
            elements: {},
            outlineActive: false
        };

        function writeStylesheet(css) {
            var element = document.createElement('style');
            element.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(element);

            if (element.styleSheet) {
                element.styleSheet.cssText = css; // IE
            } else {
                element.innerHTML = css; // Non-IE
            }
        }

        function initStylesheet() {
            if (self.initialized !== true) {
                var css = '' +
                    '.' + self.opts.namespace + ' {' +
                    '    background: #09c;' +
                    '    position: absolute;' +
                    '    z-index: 1000000;' +
                    '}' +
                    '.' + self.opts.namespace + '_label {' +
                    '    background: #09c;' +
                    '    border-radius: 2px;' +
                    '    color: #fff;' +
                    '    font: bold 12px/12px Helvetica, sans-serif;' +
                    '    padding: 4px 6px;' +
                    '    position: absolute;' +
                    '    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);' +
                    '    z-index: 1000001;' +
                    '}' +
                    '.' + self.opts.namespace + '_box {' +
                    '    background: rgba(0, 153, 204, 0.2);' +
                    '    position: absolute;' +
                    '    z-index: 1000000;' +
                    '}';

                writeStylesheet(css);
                self.initialized = true;
            }
        }

        function createOutlineElements() {
            self.elements.label = jQuery('<div>').addClass(self.opts.namespace + '_label').appendTo('body');
            self.elements.top = jQuery('<div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.bottom = jQuery('<div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.left = jQuery('<div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.right = jQuery('<div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.box = jQuery('<div>').addClass(self.opts.namespace + '_box').appendTo('body');
        }

        function removeOutlineElements() {
            if (self.outlineActive) {
                jQuery.each(self.elements, function(name, element) {
                    element.remove();
                });
                self.elements = {}; // Clear elements reference to ensure they are recreated
                self.outlineActive = false;
            }
        }

        function compileLabelText(element, width, height) {
            var label = element.tagName.toLowerCase();
            if (element.id) {
                label += '#' + element.id;
            }
            if (element.className) {
                label += ('.' + jQuery.trim(element.className).replace(/ /g, '.')).replace(/\.+/g, '.');
            }
            return label + ' (' + Math.round(width) + 'x' + Math.round(height) + ')';
        }

        function getScrollOffset() {
            var scrollOffset = {
                left: document.documentElement.scrollLeft || document.body.scrollLeft,
                top: document.documentElement.scrollTop || document.body.scrollTop
            };
            return scrollOffset;
        }

        function updateOutlinePosition(element) {
            var b = self.opts.borderWidth;
            var scroll = getScrollOffset();
            var pos = element.getBoundingClientRect();
            var top = pos.top + scroll.top;
            var left = pos.left + scroll.left;

            var label_text = compileLabelText(element, pos.width, pos.height);
            var label_top = Math.max(0, top - 20 - b, scroll.top);
            var label_left = Math.max(0, left + scroll.left);

            self.elements.label.css({ top: label_top, left: label_left }).text(label_text);
            self.elements.top.css({ top: Math.max(0, top - b), left: left - b, width: pos.width + b + b, height: b });
            self.elements.bottom.css({ top: top + pos.height, left: left - b, width: pos.width + b + b, height: b });
            self.elements.left.css({ top: top - b, left: Math.max(0, left - b), width: b, height: pos.height + b + b });
            self.elements.right.css({ top: top - b, left: left + pos.width, width: b, height: pos.height + b + b });
            self.elements.box.css({ top: top, left: left, width: pos.width, height: pos.height });

            self.outlineActive = true;
        }

        pub.start = function (element) {
            removeOutlineElements(); // Ensure previous elements are cleared before starting
            initStylesheet();
            createOutlineElements();
            updateOutlinePosition(element);
        };

        pub.stop = function () {
            removeOutlineElements();
        };

        return pub;
    };

    window.DomOutline = DomOutline;

})(jQuery);