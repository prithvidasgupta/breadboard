/* global jQuery $*/
let util = {};

/**
 * Naive deep-cloning of an object.
 * Doesn't check against infinite recursion.
 */
util.cloneSimpleObject = function (obj) {
    let ret, key;
    if (obj instanceof Array) {
        ret = [];
        for (key in obj) {
            ret.push(util.cloneSimpleObject(obj[key]));
        }
        return ret;
    }
    else if (typeof obj === 'object') {
        ret = {};
        for (key in obj) {
            ret[key] = util.cloneSimpleObject(obj[key]);
        }
        return ret;
    }
    else {
        return obj;
    }
};

// The "next" function returns a different value each time
// alternating between the two input values x, y.
util.Alternator = function (x, y) {
    this.x = x;
    this.y = y;
    this.cnt = 0;
};
util.Alternator.prototype =
{
    next: function () {
        ++this.cnt;
        return this.cnt % 2 == 1 ? this.x : this.y;
    }
};

// Return a string representation of time lapsed between start and end
util.timeLapseStr = function (start, end) {
    let seconds = Math.floor((end - start) / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    let str = seconds + (seconds == 1 ? ' second' : ' seconds');
    if (minutes > 0) {
        str = minutes + (minutes == 1 ? ' minute ' : ' minutes ') + str;
    }
    return str;
};

/**
The initial version of this was copied from the serializeArray method of jQuery
this version returns a result object and uses the names of the input elements
as the actual keys in the result object.  This requires more careful naming but it
makes using the returned object easier.  It could be improved to handle dates and
numbers perhaps using style classes to tag them as such.
*/
util.serializeForm = function (form) {
    let result = {};
    form.map(function () {
        return this.elements ? jQuery.makeArray(this.elements) : this;
    }).filter(function () {
        return this.name &&
            (this.checked || (/select|textarea/i).test(this.nodeName) ||
                (/text|hidden|password|search/i).test(this.type));
    }).each(function () {
        let val = jQuery(this).val();
        if (val === null) {
            return;
        }

        if (Array.isArray(val)) {
            result[this.name] = jQuery.makeArray(val);
        }
        else {
            result[this.name] = val;
        }
    });
    return result;
};

// Returns a string representation of the input date
// date: either a Date or a number in milliseconds
util.formatDate = function (date) {
    function fillZero(val) {
        return val < 10 ? '0' + val : String(val);
    }
    if (typeof date === 'number') {
        date = new Date(date);
    }
    let s = fillZero(date.getMonth() + 1) + '/';

    s += fillZero(date.getDate()) + '/';
    s += String(date.getFullYear()) + ' ';
    s += fillZero(date.getHours()) + ':';
    s += fillZero(date.getMinutes()) + ':';
    s += fillZero(date.getSeconds()) + ' ';
    return s;
};

util.todaysDate = function () {
    let monthNames = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];

    let now = new Date();
    return monthNames[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
}

// Pretty print an object. Mainly intended for debugging JSON objects
util.prettyPrint = function (obj, indent) {
    let t = '';
    if (typeof obj === 'object') {
        for (let key in obj) {
            if (typeof obj[key] !== 'function') {
                for (let i = 0; i < indent; ++i) {
                    t += ' ';
                }
                t += key + ': ';
                if (typeof obj[key] === 'object') {
                    t += '\n';
                }
                t += util.prettyPrint(obj[key], indent + 4);
            }
        }
        return t;
    }
    else {
        return obj + '\n';
    }
};

util.shuffle = function (o) {
    for (let j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

util.contains = function (array, obj) {
    let i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return i;
        }
    }
    return -1;
};

util.getKeys = function (json) {
    let keys = [];
    $.each(json, function (key) {
        keys.push(key);
    })
    return keys;
};

// When we define, say, a logaritmic sweep of frequencies, we calculate them on our end
// for the function generator, and QUCS generates them on its end after being given a
// simulation type. These two series may not be exactly the same after accounting for
// different precisions, so we want to pick the QUCS value that's closest to what we
// think we're generating. So, if we think we're generating 1002.2 Hz, and QUCS comes back
// with [1000, 1002.22222, 1003.33333], we want to return the index '1'
//
// @array an array of numbers, complex or real
// @actual the number we want
// @isComplex whether the numbers in the array are complex or real
util.getClosestIndex = function (array, actual, isComplex) {
    let minDiff = Infinity,
        index;
    // this could be shortened as a CS exercise, but it takes 0 ms over an array of
    // 10,000 so it's not really worth it...
    for (let i = 0, ii = array.length; i < ii; i++) {
        let diff = isComplex ? Math.abs(array[i].real - actual) : Math.abs(array[i] - actual);
        if (diff < minDiff) {
            minDiff = diff;
            index = i;
        }
    }
    return index;
};

// YUI-style inheritance
util.extend = function (Child, Parent, properties) {
    let F = function () { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    if (properties) {
        for (let k in properties) {
            Child.prototype[k] = properties[k];
        }
    }
    Child.prototype.constructor = Child;
    Child.parentConstructor = Parent;
    Child.uber = Parent.prototype;
};

module.exports = util;


// // Shim to add ECMA262-5 Array methods if not supported natively
// if (!Array.prototype.indexOf) {
//     Array.prototype.indexOf = function (find, i /*opt*/) {
//         if (i === undefined) i = 0;
//         if (i < 0) i += this.length;
//         if (i < 0) i = 0;
//         for (let n = this.length; i < n; i++)
//             if (i in this && this[i] === find)
//                 return i;
//         return -1;
//     };
// }
// if (!Array.prototype.forEach) {
//     Array.prototype.forEach = function (fn, scope) {
//         for (let i = 0, len = this.length; i < len; ++i) {
//             fn.call(scope, this[i], i, this);
//         }
//     }
// }
