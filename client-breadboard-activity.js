/*
    http://www.JSON.org/json2.js
    2009-09-29

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:


            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/



if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {


        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {


        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];


        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }


        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }


        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':


            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':


            return String(value);


        case 'object':


            if (!value) {
                return 'null';
            }


            gap += indent;
            partial = [];


            if (Object.prototype.toString.apply(value) === '[object Array]') {


                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }


                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }


            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {


                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }


            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }


    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {


            var i;
            gap = '';
            indent = '';


            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }


            } else if (typeof space === 'string') {
                indent = space;
            }


            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }


            return str('', {'': value});
        };
    }



    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {


            var j;

            function walk(holder, key) {


                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }



            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }



            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {


                j = eval('(' + text + ')');


                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }


            throw new SyntaxError('JSON.parse');
        };
    }
}());

/* FILE setup-common.js */

(function () {

    /*
     * Common initial setup for SPARKS activities
     */

    if (typeof console === 'undefined' || !console) {
        this.console = {};
    }
    if (!console.log) {
        console.log = function () {};
    }

    if (typeof debug === 'undefined' || !debug) {
        this.debug = function (x) { console.log(x); };
    }

    if (typeof sparks === 'undefined' || !sparks) {
        this.sparks = {};
    }

    if (!sparks.config) {
        sparks.config = {};
    }

    if (!sparks.circuit) {
        sparks.circuit = {};
    }

    if (!sparks.util) {
        sparks.util = {};
    }

    if (!sparks.activities) {
        sparks.activities = {};
    }

    sparks.config.root_dir = '/sparks-content';

    sparks.extend = function(Child, Parent, properties) {
      var F = function() {};
      F.prototype = Parent.prototype;
      Child.prototype = new F();
      if (properties) {
          for (var k in properties) {
              Child.prototype[k] = properties[k];
          }
      }
      Child.prototype.constructor = Child;
      Child.uber = Parent.prototype;
    };


})();
/*!
 * jQuery JavaScript Library v1.4.2
 * http://jquery.com/
 *
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2010, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Sat Feb 13 22:33:48 2010 -0500
 */
(function(A,w){function ma(){if(!c.isReady){try{s.documentElement.doScroll("left")}catch(a){setTimeout(ma,1);return}c.ready()}}function Qa(a,b){b.src?c.ajax({url:b.src,async:false,dataType:"script"}):c.globalEval(b.text||b.textContent||b.innerHTML||"");b.parentNode&&b.parentNode.removeChild(b)}function X(a,b,d,f,e,j){var i=a.length;if(typeof b==="object"){for(var o in b)X(a,o,b[o],f,e,d);return a}if(d!==w){f=!j&&f&&c.isFunction(d);for(o=0;o<i;o++)e(a[o],b,f?d.call(a[o],o,e(a[o],b)):d,j);return a}return i?
e(a[0],b):w}function J(){return(new Date).getTime()}function Y(){return false}function Z(){return true}function na(a,b,d){d[0].type=a;return c.event.handle.apply(b,d)}function oa(a){var b,d=[],f=[],e=arguments,j,i,o,k,n,r;i=c.data(this,"events");if(!(a.liveFired===this||!i||!i.live||a.button&&a.type==="click")){a.liveFired=this;var u=i.live.slice(0);for(k=0;k<u.length;k++){i=u[k];i.origType.replace(O,"")===a.type?f.push(i.selector):u.splice(k--,1)}j=c(a.target).closest(f,a.currentTarget);n=0;for(r=
j.length;n<r;n++)for(k=0;k<u.length;k++){i=u[k];if(j[n].selector===i.selector){o=j[n].elem;f=null;if(i.preType==="mouseenter"||i.preType==="mouseleave")f=c(a.relatedTarget).closest(i.selector)[0];if(!f||f!==o)d.push({elem:o,handleObj:i})}}n=0;for(r=d.length;n<r;n++){j=d[n];a.currentTarget=j.elem;a.data=j.handleObj.data;a.handleObj=j.handleObj;if(j.handleObj.origHandler.apply(j.elem,e)===false){b=false;break}}return b}}function pa(a,b){return"live."+(a&&a!=="*"?a+".":"")+b.replace(/\./g,"`").replace(/ /g,
"&")}function qa(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function ra(a,b){var d=0;b.each(function(){if(this.nodeName===(a[d]&&a[d].nodeName)){var f=c.data(a[d++]),e=c.data(this,f);if(f=f&&f.events){delete e.handle;e.events={};for(var j in f)for(var i in f[j])c.event.add(this,j,f[j][i],f[j][i].data)}}})}function sa(a,b,d){var f,e,j;b=b&&b[0]?b[0].ownerDocument||b[0]:s;if(a.length===1&&typeof a[0]==="string"&&a[0].length<512&&b===s&&!ta.test(a[0])&&(c.support.checkClone||!ua.test(a[0]))){e=
true;if(j=c.fragments[a[0]])if(j!==1)f=j}if(!f){f=b.createDocumentFragment();c.clean(a,b,f,d)}if(e)c.fragments[a[0]]=j?f:1;return{fragment:f,cacheable:e}}function K(a,b){var d={};c.each(va.concat.apply([],va.slice(0,b)),function(){d[this]=a});return d}function wa(a){return"scrollTo"in a&&a.document?a:a.nodeType===9?a.defaultView||a.parentWindow:false}var c=function(a,b){return new c.fn.init(a,b)},Ra=A.jQuery,Sa=A.$,s=A.document,T,Ta=/^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/,Ua=/^.[^:#\[\.,]*$/,Va=/\S/,
Wa=/^(\s|\u00A0)+|(\s|\u00A0)+$/g,Xa=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,P=navigator.userAgent,xa=false,Q=[],L,$=Object.prototype.toString,aa=Object.prototype.hasOwnProperty,ba=Array.prototype.push,R=Array.prototype.slice,ya=Array.prototype.indexOf;c.fn=c.prototype={init:function(a,b){var d,f;if(!a)return this;if(a.nodeType){this.context=this[0]=a;this.length=1;return this}if(a==="body"&&!b){this.context=s;this[0]=s.body;this.selector="body";this.length=1;return this}if(typeof a==="string")if((d=Ta.exec(a))&&
(d[1]||!b))if(d[1]){f=b?b.ownerDocument||b:s;if(a=Xa.exec(a))if(c.isPlainObject(b)){a=[s.createElement(a[1])];c.fn.attr.call(a,b,true)}else a=[f.createElement(a[1])];else{a=sa([d[1]],[f]);a=(a.cacheable?a.fragment.cloneNode(true):a.fragment).childNodes}return c.merge(this,a)}else{if(b=s.getElementById(d[2])){if(b.id!==d[2])return T.find(a);this.length=1;this[0]=b}this.context=s;this.selector=a;return this}else if(!b&&/^\w+$/.test(a)){this.selector=a;this.context=s;a=s.getElementsByTagName(a);return c.merge(this,
a)}else return!b||b.jquery?(b||T).find(a):c(b).find(a);else if(c.isFunction(a))return T.ready(a);if(a.selector!==w){this.selector=a.selector;this.context=a.context}return c.makeArray(a,this)},selector:"",jquery:"1.4.2",length:0,size:function(){return this.length},toArray:function(){return R.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this.slice(a)[0]:this[a]},pushStack:function(a,b,d){var f=c();c.isArray(a)?ba.apply(f,a):c.merge(f,a);f.prevObject=this;f.context=this.context;if(b===
"find")f.selector=this.selector+(this.selector?" ":"")+d;else if(b)f.selector=this.selector+"."+b+"("+d+")";return f},each:function(a,b){return c.each(this,a,b)},ready:function(a){c.bindReady();if(c.isReady)a.call(s,c);else Q&&Q.push(a);return this},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(R.apply(this,arguments),"slice",R.call(arguments).join(","))},map:function(a){return this.pushStack(c.map(this,
function(b,d){return a.call(b,d,b)}))},end:function(){return this.prevObject||c(null)},push:ba,sort:[].sort,splice:[].splice};c.fn.init.prototype=c.fn;c.extend=c.fn.extend=function(){var a=arguments[0]||{},b=1,d=arguments.length,f=false,e,j,i,o;if(typeof a==="boolean"){f=a;a=arguments[1]||{};b=2}if(typeof a!=="object"&&!c.isFunction(a))a={};if(d===b){a=this;--b}for(;b<d;b++)if((e=arguments[b])!=null)for(j in e){i=a[j];o=e[j];if(a!==o)if(f&&o&&(c.isPlainObject(o)||c.isArray(o))){i=i&&(c.isPlainObject(i)||
c.isArray(i))?i:c.isArray(o)?[]:{};a[j]=c.extend(f,i,o)}else if(o!==w)a[j]=o}return a};c.extend({noConflict:function(a){A.$=Sa;if(a)A.jQuery=Ra;return c},isReady:false,ready:function(){if(!c.isReady){if(!s.body)return setTimeout(c.ready,13);c.isReady=true;if(Q){for(var a,b=0;a=Q[b++];)a.call(s,c);Q=null}c.fn.triggerHandler&&c(s).triggerHandler("ready")}},bindReady:function(){if(!xa){xa=true;if(s.readyState==="complete")return c.ready();if(s.addEventListener){s.addEventListener("DOMContentLoaded",
L,false);A.addEventListener("load",c.ready,false)}else if(s.attachEvent){s.attachEvent("onreadystatechange",L);A.attachEvent("onload",c.ready);var a=false;try{a=A.frameElement==null}catch(b){}s.documentElement.doScroll&&a&&ma()}}},isFunction:function(a){return $.call(a)==="[object Function]"},isArray:function(a){return $.call(a)==="[object Array]"},isPlainObject:function(a){if(!a||$.call(a)!=="[object Object]"||a.nodeType||a.setInterval)return false;if(a.constructor&&!aa.call(a,"constructor")&&!aa.call(a.constructor.prototype,
"isPrototypeOf"))return false;var b;for(b in a);return b===w||aa.call(a,b)},isEmptyObject:function(a){for(var b in a)return false;return true},error:function(a){throw a;},parseJSON:function(a){if(typeof a!=="string"||!a)return null;a=c.trim(a);if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return A.JSON&&A.JSON.parse?A.JSON.parse(a):(new Function("return "+
a))();else c.error("Invalid JSON: "+a)},noop:function(){},globalEval:function(a){if(a&&Va.test(a)){var b=s.getElementsByTagName("head")[0]||s.documentElement,d=s.createElement("script");d.type="text/javascript";if(c.support.scriptEval)d.appendChild(s.createTextNode(a));else d.text=a;b.insertBefore(d,b.firstChild);b.removeChild(d)}},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,b,d){var f,e=0,j=a.length,i=j===w||c.isFunction(a);if(d)if(i)for(f in a){if(b.apply(a[f],
d)===false)break}else for(;e<j;){if(b.apply(a[e++],d)===false)break}else if(i)for(f in a){if(b.call(a[f],f,a[f])===false)break}else for(d=a[0];e<j&&b.call(d,e,d)!==false;d=a[++e]);return a},trim:function(a){return(a||"").replace(Wa,"")},makeArray:function(a,b){b=b||[];if(a!=null)a.length==null||typeof a==="string"||c.isFunction(a)||typeof a!=="function"&&a.setInterval?ba.call(b,a):c.merge(b,a);return b},inArray:function(a,b){if(b.indexOf)return b.indexOf(a);for(var d=0,f=b.length;d<f;d++)if(b[d]===
a)return d;return-1},merge:function(a,b){var d=a.length,f=0;if(typeof b.length==="number")for(var e=b.length;f<e;f++)a[d++]=b[f];else for(;b[f]!==w;)a[d++]=b[f++];a.length=d;return a},grep:function(a,b,d){for(var f=[],e=0,j=a.length;e<j;e++)!d!==!b(a[e],e)&&f.push(a[e]);return f},map:function(a,b,d){for(var f=[],e,j=0,i=a.length;j<i;j++){e=b(a[j],j,d);if(e!=null)f[f.length]=e}return f.concat.apply([],f)},guid:1,proxy:function(a,b,d){if(arguments.length===2)if(typeof b==="string"){d=a;a=d[b];b=w}else if(b&&
!c.isFunction(b)){d=b;b=w}if(!b&&a)b=function(){return a.apply(d||this,arguments)};if(a)b.guid=a.guid=a.guid||b.guid||c.guid++;return b},uaMatch:function(a){a=a.toLowerCase();a=/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version)?[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||!/compatible/.test(a)&&/(mozilla)(?:.*? rv:([\w.]+))?/.exec(a)||[];return{browser:a[1]||"",version:a[2]||"0"}},browser:{}});P=c.uaMatch(P);if(P.browser){c.browser[P.browser]=true;c.browser.version=P.version}if(c.browser.webkit)c.browser.safari=
true;if(ya)c.inArray=function(a,b){return ya.call(b,a)};T=c(s);if(s.addEventListener)L=function(){s.removeEventListener("DOMContentLoaded",L,false);c.ready()};else if(s.attachEvent)L=function(){if(s.readyState==="complete"){s.detachEvent("onreadystatechange",L);c.ready()}};(function(){c.support={};var a=s.documentElement,b=s.createElement("script"),d=s.createElement("div"),f="script"+J();d.style.display="none";d.innerHTML="   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
var e=d.getElementsByTagName("*"),j=d.getElementsByTagName("a")[0];if(!(!e||!e.length||!j)){c.support={leadingWhitespace:d.firstChild.nodeType===3,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/red/.test(j.getAttribute("style")),hrefNormalized:j.getAttribute("href")==="/a",opacity:/^0.55$/.test(j.style.opacity),cssFloat:!!j.style.cssFloat,checkOn:d.getElementsByTagName("input")[0].value==="on",optSelected:s.createElement("select").appendChild(s.createElement("option")).selected,
parentNode:d.removeChild(d.appendChild(s.createElement("div"))).parentNode===null,deleteExpando:true,checkClone:false,scriptEval:false,noCloneEvent:true,boxModel:null};b.type="text/javascript";try{b.appendChild(s.createTextNode("window."+f+"=1;"))}catch(i){}a.insertBefore(b,a.firstChild);if(A[f]){c.support.scriptEval=true;delete A[f]}try{delete b.test}catch(o){c.support.deleteExpando=false}a.removeChild(b);if(d.attachEvent&&d.fireEvent){d.attachEvent("onclick",function k(){c.support.noCloneEvent=
false;d.detachEvent("onclick",k)});d.cloneNode(true).fireEvent("onclick")}d=s.createElement("div");d.innerHTML="<input type='radio' name='radiotest' checked='checked'/>";a=s.createDocumentFragment();a.appendChild(d.firstChild);c.support.checkClone=a.cloneNode(true).cloneNode(true).lastChild.checked;c(function(){var k=s.createElement("div");k.style.width=k.style.paddingLeft="1px";s.body.appendChild(k);c.boxModel=c.support.boxModel=k.offsetWidth===2;s.body.removeChild(k).style.display="none"});a=function(k){var n=
s.createElement("div");k="on"+k;var r=k in n;if(!r){n.setAttribute(k,"return;");r=typeof n[k]==="function"}return r};c.support.submitBubbles=a("submit");c.support.changeBubbles=a("change");a=b=d=e=j=null}})();c.props={"for":"htmlFor","class":"className",readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",colspan:"colSpan",tabindex:"tabIndex",usemap:"useMap",frameborder:"frameBorder"};var G="jQuery"+J(),Ya=0,za={};c.extend({cache:{},expando:G,noData:{embed:true,object:true,
applet:true},data:function(a,b,d){if(!(a.nodeName&&c.noData[a.nodeName.toLowerCase()])){a=a==A?za:a;var f=a[G],e=c.cache;if(!f&&typeof b==="string"&&d===w)return null;f||(f=++Ya);if(typeof b==="object"){a[G]=f;e[f]=c.extend(true,{},b)}else if(!e[f]){a[G]=f;e[f]={}}a=e[f];if(d!==w)a[b]=d;return typeof b==="string"?a[b]:a}},removeData:function(a,b){if(!(a.nodeName&&c.noData[a.nodeName.toLowerCase()])){a=a==A?za:a;var d=a[G],f=c.cache,e=f[d];if(b){if(e){delete e[b];c.isEmptyObject(e)&&c.removeData(a)}}else{if(c.support.deleteExpando)delete a[c.expando];
else a.removeAttribute&&a.removeAttribute(c.expando);delete f[d]}}}});c.fn.extend({data:function(a,b){if(typeof a==="undefined"&&this.length)return c.data(this[0]);else if(typeof a==="object")return this.each(function(){c.data(this,a)});var d=a.split(".");d[1]=d[1]?"."+d[1]:"";if(b===w){var f=this.triggerHandler("getData"+d[1]+"!",[d[0]]);if(f===w&&this.length)f=c.data(this[0],a);return f===w&&d[1]?this.data(d[0]):f}else return this.trigger("setData"+d[1]+"!",[d[0],b]).each(function(){c.data(this,
a,b)})},removeData:function(a){return this.each(function(){c.removeData(this,a)})}});c.extend({queue:function(a,b,d){if(a){b=(b||"fx")+"queue";var f=c.data(a,b);if(!d)return f||[];if(!f||c.isArray(d))f=c.data(a,b,c.makeArray(d));else f.push(d);return f}},dequeue:function(a,b){b=b||"fx";var d=c.queue(a,b),f=d.shift();if(f==="inprogress")f=d.shift();if(f){b==="fx"&&d.unshift("inprogress");f.call(a,function(){c.dequeue(a,b)})}}});c.fn.extend({queue:function(a,b){if(typeof a!=="string"){b=a;a="fx"}if(b===
w)return c.queue(this[0],a);return this.each(function(){var d=c.queue(this,a,b);a==="fx"&&d[0]!=="inprogress"&&c.dequeue(this,a)})},dequeue:function(a){return this.each(function(){c.dequeue(this,a)})},delay:function(a,b){a=c.fx?c.fx.speeds[a]||a:a;b=b||"fx";return this.queue(b,function(){var d=this;setTimeout(function(){c.dequeue(d,b)},a)})},clearQueue:function(a){return this.queue(a||"fx",[])}});var Aa=/[\n\t]/g,ca=/\s+/,Za=/\r/g,$a=/href|src|style/,ab=/(button|input)/i,bb=/(button|input|object|select|textarea)/i,
cb=/^(a|area)$/i,Ba=/radio|checkbox/;c.fn.extend({attr:function(a,b){return X(this,a,b,true,c.attr)},removeAttr:function(a){return this.each(function(){c.attr(this,a,"");this.nodeType===1&&this.removeAttribute(a)})},addClass:function(a){if(c.isFunction(a))return this.each(function(n){var r=c(this);r.addClass(a.call(this,n,r.attr("class")))});if(a&&typeof a==="string")for(var b=(a||"").split(ca),d=0,f=this.length;d<f;d++){var e=this[d];if(e.nodeType===1)if(e.className){for(var j=" "+e.className+" ",
i=e.className,o=0,k=b.length;o<k;o++)if(j.indexOf(" "+b[o]+" ")<0)i+=" "+b[o];e.className=c.trim(i)}else e.className=a}return this},removeClass:function(a){if(c.isFunction(a))return this.each(function(k){var n=c(this);n.removeClass(a.call(this,k,n.attr("class")))});if(a&&typeof a==="string"||a===w)for(var b=(a||"").split(ca),d=0,f=this.length;d<f;d++){var e=this[d];if(e.nodeType===1&&e.className)if(a){for(var j=(" "+e.className+" ").replace(Aa," "),i=0,o=b.length;i<o;i++)j=j.replace(" "+b[i]+" ",
" ");e.className=c.trim(j)}else e.className=""}return this},toggleClass:function(a,b){var d=typeof a,f=typeof b==="boolean";if(c.isFunction(a))return this.each(function(e){var j=c(this);j.toggleClass(a.call(this,e,j.attr("class"),b),b)});return this.each(function(){if(d==="string")for(var e,j=0,i=c(this),o=b,k=a.split(ca);e=k[j++];){o=f?o:!i.hasClass(e);i[o?"addClass":"removeClass"](e)}else if(d==="undefined"||d==="boolean"){this.className&&c.data(this,"__className__",this.className);this.className=
this.className||a===false?"":c.data(this,"__className__")||""}})},hasClass:function(a){a=" "+a+" ";for(var b=0,d=this.length;b<d;b++)if((" "+this[b].className+" ").replace(Aa," ").indexOf(a)>-1)return true;return false},val:function(a){if(a===w){var b=this[0];if(b){if(c.nodeName(b,"option"))return(b.attributes.value||{}).specified?b.value:b.text;if(c.nodeName(b,"select")){var d=b.selectedIndex,f=[],e=b.options;b=b.type==="select-one";if(d<0)return null;var j=b?d:0;for(d=b?d+1:e.length;j<d;j++){var i=
e[j];if(i.selected){a=c(i).val();if(b)return a;f.push(a)}}return f}if(Ba.test(b.type)&&!c.support.checkOn)return b.getAttribute("value")===null?"on":b.value;return(b.value||"").replace(Za,"")}return w}var o=c.isFunction(a);return this.each(function(k){var n=c(this),r=a;if(this.nodeType===1){if(o)r=a.call(this,k,n.val());if(typeof r==="number")r+="";if(c.isArray(r)&&Ba.test(this.type))this.checked=c.inArray(n.val(),r)>=0;else if(c.nodeName(this,"select")){var u=c.makeArray(r);c("option",this).each(function(){this.selected=
c.inArray(c(this).val(),u)>=0});if(!u.length)this.selectedIndex=-1}else this.value=r}})}});c.extend({attrFn:{val:true,css:true,html:true,text:true,data:true,width:true,height:true,offset:true},attr:function(a,b,d,f){if(!a||a.nodeType===3||a.nodeType===8)return w;if(f&&b in c.attrFn)return c(a)[b](d);f=a.nodeType!==1||!c.isXMLDoc(a);var e=d!==w;b=f&&c.props[b]||b;if(a.nodeType===1){var j=$a.test(b);if(b in a&&f&&!j){if(e){b==="type"&&ab.test(a.nodeName)&&a.parentNode&&c.error("type property can't be changed");
a[b]=d}if(c.nodeName(a,"form")&&a.getAttributeNode(b))return a.getAttributeNode(b).nodeValue;if(b==="tabIndex")return(b=a.getAttributeNode("tabIndex"))&&b.specified?b.value:bb.test(a.nodeName)||cb.test(a.nodeName)&&a.href?0:w;return a[b]}if(!c.support.style&&f&&b==="style"){if(e)a.style.cssText=""+d;return a.style.cssText}e&&a.setAttribute(b,""+d);a=!c.support.hrefNormalized&&f&&j?a.getAttribute(b,2):a.getAttribute(b);return a===null?w:a}return c.style(a,b,d)}});var O=/\.(.*)$/,db=function(a){return a.replace(/[^\w\s\.\|`]/g,
function(b){return"\\"+b})};c.event={add:function(a,b,d,f){if(!(a.nodeType===3||a.nodeType===8)){if(a.setInterval&&a!==A&&!a.frameElement)a=A;var e,j;if(d.handler){e=d;d=e.handler}if(!d.guid)d.guid=c.guid++;if(j=c.data(a)){var i=j.events=j.events||{},o=j.handle;if(!o)j.handle=o=function(){return typeof c!=="undefined"&&!c.event.triggered?c.event.handle.apply(o.elem,arguments):w};o.elem=a;b=b.split(" ");for(var k,n=0,r;k=b[n++];){j=e?c.extend({},e):{handler:d,data:f};if(k.indexOf(".")>-1){r=k.split(".");
k=r.shift();j.namespace=r.slice(0).sort().join(".")}else{r=[];j.namespace=""}j.type=k;j.guid=d.guid;var u=i[k],z=c.event.special[k]||{};if(!u){u=i[k]=[];if(!z.setup||z.setup.call(a,f,r,o)===false)if(a.addEventListener)a.addEventListener(k,o,false);else a.attachEvent&&a.attachEvent("on"+k,o)}if(z.add){z.add.call(a,j);if(!j.handler.guid)j.handler.guid=d.guid}u.push(j);c.event.global[k]=true}a=null}}},global:{},remove:function(a,b,d,f){if(!(a.nodeType===3||a.nodeType===8)){var e,j=0,i,o,k,n,r,u,z=c.data(a),
C=z&&z.events;if(z&&C){if(b&&b.type){d=b.handler;b=b.type}if(!b||typeof b==="string"&&b.charAt(0)==="."){b=b||"";for(e in C)c.event.remove(a,e+b)}else{for(b=b.split(" ");e=b[j++];){n=e;i=e.indexOf(".")<0;o=[];if(!i){o=e.split(".");e=o.shift();k=new RegExp("(^|\\.)"+c.map(o.slice(0).sort(),db).join("\\.(?:.*\\.)?")+"(\\.|$)")}if(r=C[e])if(d){n=c.event.special[e]||{};for(B=f||0;B<r.length;B++){u=r[B];if(d.guid===u.guid){if(i||k.test(u.namespace)){f==null&&r.splice(B--,1);n.remove&&n.remove.call(a,u)}if(f!=
null)break}}if(r.length===0||f!=null&&r.length===1){if(!n.teardown||n.teardown.call(a,o)===false)Ca(a,e,z.handle);delete C[e]}}else for(var B=0;B<r.length;B++){u=r[B];if(i||k.test(u.namespace)){c.event.remove(a,n,u.handler,B);r.splice(B--,1)}}}if(c.isEmptyObject(C)){if(b=z.handle)b.elem=null;delete z.events;delete z.handle;c.isEmptyObject(z)&&c.removeData(a)}}}}},trigger:function(a,b,d,f){var e=a.type||a;if(!f){a=typeof a==="object"?a[G]?a:c.extend(c.Event(e),a):c.Event(e);if(e.indexOf("!")>=0){a.type=
e=e.slice(0,-1);a.exclusive=true}if(!d){a.stopPropagation();c.event.global[e]&&c.each(c.cache,function(){this.events&&this.events[e]&&c.event.trigger(a,b,this.handle.elem)})}if(!d||d.nodeType===3||d.nodeType===8)return w;a.result=w;a.target=d;b=c.makeArray(b);b.unshift(a)}a.currentTarget=d;(f=c.data(d,"handle"))&&f.apply(d,b);f=d.parentNode||d.ownerDocument;try{if(!(d&&d.nodeName&&c.noData[d.nodeName.toLowerCase()]))if(d["on"+e]&&d["on"+e].apply(d,b)===false)a.result=false}catch(j){}if(!a.isPropagationStopped()&&
f)c.event.trigger(a,b,f,true);else if(!a.isDefaultPrevented()){f=a.target;var i,o=c.nodeName(f,"a")&&e==="click",k=c.event.special[e]||{};if((!k._default||k._default.call(d,a)===false)&&!o&&!(f&&f.nodeName&&c.noData[f.nodeName.toLowerCase()])){try{if(f[e]){if(i=f["on"+e])f["on"+e]=null;c.event.triggered=true;f[e]()}}catch(n){}if(i)f["on"+e]=i;c.event.triggered=false}}},handle:function(a){var b,d,f,e;a=arguments[0]=c.event.fix(a||A.event);a.currentTarget=this;b=a.type.indexOf(".")<0&&!a.exclusive;
if(!b){d=a.type.split(".");a.type=d.shift();f=new RegExp("(^|\\.)"+d.slice(0).sort().join("\\.(?:.*\\.)?")+"(\\.|$)")}e=c.data(this,"events");d=e[a.type];if(e&&d){d=d.slice(0);e=0;for(var j=d.length;e<j;e++){var i=d[e];if(b||f.test(i.namespace)){a.handler=i.handler;a.data=i.data;a.handleObj=i;i=i.handler.apply(this,arguments);if(i!==w){a.result=i;if(i===false){a.preventDefault();a.stopPropagation()}}if(a.isImmediatePropagationStopped())break}}}return a.result},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),
fix:function(a){if(a[G])return a;var b=a;a=c.Event(b);for(var d=this.props.length,f;d;){f=this.props[--d];a[f]=b[f]}if(!a.target)a.target=a.srcElement||s;if(a.target.nodeType===3)a.target=a.target.parentNode;if(!a.relatedTarget&&a.fromElement)a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement;if(a.pageX==null&&a.clientX!=null){b=s.documentElement;d=s.body;a.pageX=a.clientX+(b&&b.scrollLeft||d&&d.scrollLeft||0)-(b&&b.clientLeft||d&&d.clientLeft||0);a.pageY=a.clientY+(b&&b.scrollTop||
d&&d.scrollTop||0)-(b&&b.clientTop||d&&d.clientTop||0)}if(!a.which&&(a.charCode||a.charCode===0?a.charCode:a.keyCode))a.which=a.charCode||a.keyCode;if(!a.metaKey&&a.ctrlKey)a.metaKey=a.ctrlKey;if(!a.which&&a.button!==w)a.which=a.button&1?1:a.button&2?3:a.button&4?2:0;return a},guid:1E8,proxy:c.proxy,special:{ready:{setup:c.bindReady,teardown:c.noop},live:{add:function(a){c.event.add(this,a.origType,c.extend({},a,{handler:oa}))},remove:function(a){var b=true,d=a.origType.replace(O,"");c.each(c.data(this,
"events").live||[],function(){if(d===this.origType.replace(O,""))return b=false});b&&c.event.remove(this,a.origType,oa)}},beforeunload:{setup:function(a,b,d){if(this.setInterval)this.onbeforeunload=d;return false},teardown:function(a,b){if(this.onbeforeunload===b)this.onbeforeunload=null}}}};var Ca=s.removeEventListener?function(a,b,d){a.removeEventListener(b,d,false)}:function(a,b,d){a.detachEvent("on"+b,d)};c.Event=function(a){if(!this.preventDefault)return new c.Event(a);if(a&&a.type){this.originalEvent=
a;this.type=a.type}else this.type=a;this.timeStamp=J();this[G]=true};c.Event.prototype={preventDefault:function(){this.isDefaultPrevented=Z;var a=this.originalEvent;if(a){a.preventDefault&&a.preventDefault();a.returnValue=false}},stopPropagation:function(){this.isPropagationStopped=Z;var a=this.originalEvent;if(a){a.stopPropagation&&a.stopPropagation();a.cancelBubble=true}},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=Z;this.stopPropagation()},isDefaultPrevented:Y,isPropagationStopped:Y,
isImmediatePropagationStopped:Y};var Da=function(a){var b=a.relatedTarget;try{for(;b&&b!==this;)b=b.parentNode;if(b!==this){a.type=a.data;c.event.handle.apply(this,arguments)}}catch(d){}},Ea=function(a){a.type=a.data;c.event.handle.apply(this,arguments)};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){c.event.special[a]={setup:function(d){c.event.add(this,b,d&&d.selector?Ea:Da,a)},teardown:function(d){c.event.remove(this,b,d&&d.selector?Ea:Da)}}});if(!c.support.submitBubbles)c.event.special.submit=
{setup:function(){if(this.nodeName.toLowerCase()!=="form"){c.event.add(this,"click.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="submit"||d==="image")&&c(b).closest("form").length)return na("submit",this,arguments)});c.event.add(this,"keypress.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="text"||d==="password")&&c(b).closest("form").length&&a.keyCode===13)return na("submit",this,arguments)})}else return false},teardown:function(){c.event.remove(this,".specialSubmit")}};
if(!c.support.changeBubbles){var da=/textarea|input|select/i,ea,Fa=function(a){var b=a.type,d=a.value;if(b==="radio"||b==="checkbox")d=a.checked;else if(b==="select-multiple")d=a.selectedIndex>-1?c.map(a.options,function(f){return f.selected}).join("-"):"";else if(a.nodeName.toLowerCase()==="select")d=a.selectedIndex;return d},fa=function(a,b){var d=a.target,f,e;if(!(!da.test(d.nodeName)||d.readOnly)){f=c.data(d,"_change_data");e=Fa(d);if(a.type!=="focusout"||d.type!=="radio")c.data(d,"_change_data",
e);if(!(f===w||e===f))if(f!=null||e){a.type="change";return c.event.trigger(a,b,d)}}};c.event.special.change={filters:{focusout:fa,click:function(a){var b=a.target,d=b.type;if(d==="radio"||d==="checkbox"||b.nodeName.toLowerCase()==="select")return fa.call(this,a)},keydown:function(a){var b=a.target,d=b.type;if(a.keyCode===13&&b.nodeName.toLowerCase()!=="textarea"||a.keyCode===32&&(d==="checkbox"||d==="radio")||d==="select-multiple")return fa.call(this,a)},beforeactivate:function(a){a=a.target;c.data(a,
"_change_data",Fa(a))}},setup:function(){if(this.type==="file")return false;for(var a in ea)c.event.add(this,a+".specialChange",ea[a]);return da.test(this.nodeName)},teardown:function(){c.event.remove(this,".specialChange");return da.test(this.nodeName)}};ea=c.event.special.change.filters}s.addEventListener&&c.each({focus:"focusin",blur:"focusout"},function(a,b){function d(f){f=c.event.fix(f);f.type=b;return c.event.handle.call(this,f)}c.event.special[b]={setup:function(){this.addEventListener(a,
d,true)},teardown:function(){this.removeEventListener(a,d,true)}}});c.each(["bind","one"],function(a,b){c.fn[b]=function(d,f,e){if(typeof d==="object"){for(var j in d)this[b](j,f,d[j],e);return this}if(c.isFunction(f)){e=f;f=w}var i=b==="one"?c.proxy(e,function(k){c(this).unbind(k,i);return e.apply(this,arguments)}):e;if(d==="unload"&&b!=="one")this.one(d,f,e);else{j=0;for(var o=this.length;j<o;j++)c.event.add(this[j],d,i,f)}return this}});c.fn.extend({unbind:function(a,b){if(typeof a==="object"&&
!a.preventDefault)for(var d in a)this.unbind(d,a[d]);else{d=0;for(var f=this.length;d<f;d++)c.event.remove(this[d],a,b)}return this},delegate:function(a,b,d,f){return this.live(b,d,f,a)},undelegate:function(a,b,d){return arguments.length===0?this.unbind("live"):this.die(b,null,d,a)},trigger:function(a,b){return this.each(function(){c.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0]){a=c.Event(a);a.preventDefault();a.stopPropagation();c.event.trigger(a,b,this[0]);return a.result}},
toggle:function(a){for(var b=arguments,d=1;d<b.length;)c.proxy(a,b[d++]);return this.click(c.proxy(a,function(f){var e=(c.data(this,"lastToggle"+a.guid)||0)%d;c.data(this,"lastToggle"+a.guid,e+1);f.preventDefault();return b[e].apply(this,arguments)||false}))},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var Ga={focus:"focusin",blur:"focusout",mouseenter:"mouseover",mouseleave:"mouseout"};c.each(["live","die"],function(a,b){c.fn[b]=function(d,f,e,j){var i,o=0,k,n,r=j||this.selector,
u=j?this:c(this.context);if(c.isFunction(f)){e=f;f=w}for(d=(d||"").split(" ");(i=d[o++])!=null;){j=O.exec(i);k="";if(j){k=j[0];i=i.replace(O,"")}if(i==="hover")d.push("mouseenter"+k,"mouseleave"+k);else{n=i;if(i==="focus"||i==="blur"){d.push(Ga[i]+k);i+=k}else i=(Ga[i]||i)+k;b==="live"?u.each(function(){c.event.add(this,pa(i,r),{data:f,selector:r,handler:e,origType:i,origHandler:e,preType:n})}):u.unbind(pa(i,r),e)}}return this}});c.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error".split(" "),
function(a,b){c.fn[b]=function(d){return d?this.bind(b,d):this.trigger(b)};if(c.attrFn)c.attrFn[b]=true});A.attachEvent&&!A.addEventListener&&A.attachEvent("onunload",function(){for(var a in c.cache)if(c.cache[a].handle)try{c.event.remove(c.cache[a].handle.elem)}catch(b){}});(function(){function a(g){for(var h="",l,m=0;g[m];m++){l=g[m];if(l.nodeType===3||l.nodeType===4)h+=l.nodeValue;else if(l.nodeType!==8)h+=a(l.childNodes)}return h}function b(g,h,l,m,q,p){q=0;for(var v=m.length;q<v;q++){var t=m[q];
if(t){t=t[g];for(var y=false;t;){if(t.sizcache===l){y=m[t.sizset];break}if(t.nodeType===1&&!p){t.sizcache=l;t.sizset=q}if(t.nodeName.toLowerCase()===h){y=t;break}t=t[g]}m[q]=y}}}function d(g,h,l,m,q,p){q=0;for(var v=m.length;q<v;q++){var t=m[q];if(t){t=t[g];for(var y=false;t;){if(t.sizcache===l){y=m[t.sizset];break}if(t.nodeType===1){if(!p){t.sizcache=l;t.sizset=q}if(typeof h!=="string"){if(t===h){y=true;break}}else if(k.filter(h,[t]).length>0){y=t;break}}t=t[g]}m[q]=y}}}var f=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
e=0,j=Object.prototype.toString,i=false,o=true;[0,0].sort(function(){o=false;return 0});var k=function(g,h,l,m){l=l||[];var q=h=h||s;if(h.nodeType!==1&&h.nodeType!==9)return[];if(!g||typeof g!=="string")return l;for(var p=[],v,t,y,S,H=true,M=x(h),I=g;(f.exec(""),v=f.exec(I))!==null;){I=v[3];p.push(v[1]);if(v[2]){S=v[3];break}}if(p.length>1&&r.exec(g))if(p.length===2&&n.relative[p[0]])t=ga(p[0]+p[1],h);else for(t=n.relative[p[0]]?[h]:k(p.shift(),h);p.length;){g=p.shift();if(n.relative[g])g+=p.shift();
t=ga(g,t)}else{if(!m&&p.length>1&&h.nodeType===9&&!M&&n.match.ID.test(p[0])&&!n.match.ID.test(p[p.length-1])){v=k.find(p.shift(),h,M);h=v.expr?k.filter(v.expr,v.set)[0]:v.set[0]}if(h){v=m?{expr:p.pop(),set:z(m)}:k.find(p.pop(),p.length===1&&(p[0]==="~"||p[0]==="+")&&h.parentNode?h.parentNode:h,M);t=v.expr?k.filter(v.expr,v.set):v.set;if(p.length>0)y=z(t);else H=false;for(;p.length;){var D=p.pop();v=D;if(n.relative[D])v=p.pop();else D="";if(v==null)v=h;n.relative[D](y,v,M)}}else y=[]}y||(y=t);y||k.error(D||
g);if(j.call(y)==="[object Array]")if(H)if(h&&h.nodeType===1)for(g=0;y[g]!=null;g++){if(y[g]&&(y[g]===true||y[g].nodeType===1&&E(h,y[g])))l.push(t[g])}else for(g=0;y[g]!=null;g++)y[g]&&y[g].nodeType===1&&l.push(t[g]);else l.push.apply(l,y);else z(y,l);if(S){k(S,q,l,m);k.uniqueSort(l)}return l};k.uniqueSort=function(g){if(B){i=o;g.sort(B);if(i)for(var h=1;h<g.length;h++)g[h]===g[h-1]&&g.splice(h--,1)}return g};k.matches=function(g,h){return k(g,null,null,h)};k.find=function(g,h,l){var m,q;if(!g)return[];
for(var p=0,v=n.order.length;p<v;p++){var t=n.order[p];if(q=n.leftMatch[t].exec(g)){var y=q[1];q.splice(1,1);if(y.substr(y.length-1)!=="\\"){q[1]=(q[1]||"").replace(/\\/g,"");m=n.find[t](q,h,l);if(m!=null){g=g.replace(n.match[t],"");break}}}}m||(m=h.getElementsByTagName("*"));return{set:m,expr:g}};k.filter=function(g,h,l,m){for(var q=g,p=[],v=h,t,y,S=h&&h[0]&&x(h[0]);g&&h.length;){for(var H in n.filter)if((t=n.leftMatch[H].exec(g))!=null&&t[2]){var M=n.filter[H],I,D;D=t[1];y=false;t.splice(1,1);if(D.substr(D.length-
1)!=="\\"){if(v===p)p=[];if(n.preFilter[H])if(t=n.preFilter[H](t,v,l,p,m,S)){if(t===true)continue}else y=I=true;if(t)for(var U=0;(D=v[U])!=null;U++)if(D){I=M(D,t,U,v);var Ha=m^!!I;if(l&&I!=null)if(Ha)y=true;else v[U]=false;else if(Ha){p.push(D);y=true}}if(I!==w){l||(v=p);g=g.replace(n.match[H],"");if(!y)return[];break}}}if(g===q)if(y==null)k.error(g);else break;q=g}return v};k.error=function(g){throw"Syntax error, unrecognized expression: "+g;};var n=k.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
CLASS:/\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(g){return g.getAttribute("href")}},
relative:{"+":function(g,h){var l=typeof h==="string",m=l&&!/\W/.test(h);l=l&&!m;if(m)h=h.toLowerCase();m=0;for(var q=g.length,p;m<q;m++)if(p=g[m]){for(;(p=p.previousSibling)&&p.nodeType!==1;);g[m]=l||p&&p.nodeName.toLowerCase()===h?p||false:p===h}l&&k.filter(h,g,true)},">":function(g,h){var l=typeof h==="string";if(l&&!/\W/.test(h)){h=h.toLowerCase();for(var m=0,q=g.length;m<q;m++){var p=g[m];if(p){l=p.parentNode;g[m]=l.nodeName.toLowerCase()===h?l:false}}}else{m=0;for(q=g.length;m<q;m++)if(p=g[m])g[m]=
l?p.parentNode:p.parentNode===h;l&&k.filter(h,g,true)}},"":function(g,h,l){var m=e++,q=d;if(typeof h==="string"&&!/\W/.test(h)){var p=h=h.toLowerCase();q=b}q("parentNode",h,m,g,p,l)},"~":function(g,h,l){var m=e++,q=d;if(typeof h==="string"&&!/\W/.test(h)){var p=h=h.toLowerCase();q=b}q("previousSibling",h,m,g,p,l)}},find:{ID:function(g,h,l){if(typeof h.getElementById!=="undefined"&&!l)return(g=h.getElementById(g[1]))?[g]:[]},NAME:function(g,h){if(typeof h.getElementsByName!=="undefined"){var l=[];
h=h.getElementsByName(g[1]);for(var m=0,q=h.length;m<q;m++)h[m].getAttribute("name")===g[1]&&l.push(h[m]);return l.length===0?null:l}},TAG:function(g,h){return h.getElementsByTagName(g[1])}},preFilter:{CLASS:function(g,h,l,m,q,p){g=" "+g[1].replace(/\\/g,"")+" ";if(p)return g;p=0;for(var v;(v=h[p])!=null;p++)if(v)if(q^(v.className&&(" "+v.className+" ").replace(/[\t\n]/g," ").indexOf(g)>=0))l||m.push(v);else if(l)h[p]=false;return false},ID:function(g){return g[1].replace(/\\/g,"")},TAG:function(g){return g[1].toLowerCase()},
CHILD:function(g){if(g[1]==="nth"){var h=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(g[2]==="even"&&"2n"||g[2]==="odd"&&"2n+1"||!/\D/.test(g[2])&&"0n+"+g[2]||g[2]);g[2]=h[1]+(h[2]||1)-0;g[3]=h[3]-0}g[0]=e++;return g},ATTR:function(g,h,l,m,q,p){h=g[1].replace(/\\/g,"");if(!p&&n.attrMap[h])g[1]=n.attrMap[h];if(g[2]==="~=")g[4]=" "+g[4]+" ";return g},PSEUDO:function(g,h,l,m,q){if(g[1]==="not")if((f.exec(g[3])||"").length>1||/^\w/.test(g[3]))g[3]=k(g[3],null,null,h);else{g=k.filter(g[3],h,l,true^q);l||m.push.apply(m,
g);return false}else if(n.match.POS.test(g[0])||n.match.CHILD.test(g[0]))return true;return g},POS:function(g){g.unshift(true);return g}},filters:{enabled:function(g){return g.disabled===false&&g.type!=="hidden"},disabled:function(g){return g.disabled===true},checked:function(g){return g.checked===true},selected:function(g){return g.selected===true},parent:function(g){return!!g.firstChild},empty:function(g){return!g.firstChild},has:function(g,h,l){return!!k(l[3],g).length},header:function(g){return/h\d/i.test(g.nodeName)},
text:function(g){return"text"===g.type},radio:function(g){return"radio"===g.type},checkbox:function(g){return"checkbox"===g.type},file:function(g){return"file"===g.type},password:function(g){return"password"===g.type},submit:function(g){return"submit"===g.type},image:function(g){return"image"===g.type},reset:function(g){return"reset"===g.type},button:function(g){return"button"===g.type||g.nodeName.toLowerCase()==="button"},input:function(g){return/input|select|textarea|button/i.test(g.nodeName)}},
setFilters:{first:function(g,h){return h===0},last:function(g,h,l,m){return h===m.length-1},even:function(g,h){return h%2===0},odd:function(g,h){return h%2===1},lt:function(g,h,l){return h<l[3]-0},gt:function(g,h,l){return h>l[3]-0},nth:function(g,h,l){return l[3]-0===h},eq:function(g,h,l){return l[3]-0===h}},filter:{PSEUDO:function(g,h,l,m){var q=h[1],p=n.filters[q];if(p)return p(g,l,h,m);else if(q==="contains")return(g.textContent||g.innerText||a([g])||"").indexOf(h[3])>=0;else if(q==="not"){h=
h[3];l=0;for(m=h.length;l<m;l++)if(h[l]===g)return false;return true}else k.error("Syntax error, unrecognized expression: "+q)},CHILD:function(g,h){var l=h[1],m=g;switch(l){case "only":case "first":for(;m=m.previousSibling;)if(m.nodeType===1)return false;if(l==="first")return true;m=g;case "last":for(;m=m.nextSibling;)if(m.nodeType===1)return false;return true;case "nth":l=h[2];var q=h[3];if(l===1&&q===0)return true;h=h[0];var p=g.parentNode;if(p&&(p.sizcache!==h||!g.nodeIndex)){var v=0;for(m=p.firstChild;m;m=
m.nextSibling)if(m.nodeType===1)m.nodeIndex=++v;p.sizcache=h}g=g.nodeIndex-q;return l===0?g===0:g%l===0&&g/l>=0}},ID:function(g,h){return g.nodeType===1&&g.getAttribute("id")===h},TAG:function(g,h){return h==="*"&&g.nodeType===1||g.nodeName.toLowerCase()===h},CLASS:function(g,h){return(" "+(g.className||g.getAttribute("class"))+" ").indexOf(h)>-1},ATTR:function(g,h){var l=h[1];g=n.attrHandle[l]?n.attrHandle[l](g):g[l]!=null?g[l]:g.getAttribute(l);l=g+"";var m=h[2];h=h[4];return g==null?m==="!=":m===
"="?l===h:m==="*="?l.indexOf(h)>=0:m==="~="?(" "+l+" ").indexOf(h)>=0:!h?l&&g!==false:m==="!="?l!==h:m==="^="?l.indexOf(h)===0:m==="$="?l.substr(l.length-h.length)===h:m==="|="?l===h||l.substr(0,h.length+1)===h+"-":false},POS:function(g,h,l,m){var q=n.setFilters[h[2]];if(q)return q(g,l,h,m)}}},r=n.match.POS;for(var u in n.match){n.match[u]=new RegExp(n.match[u].source+/(?![^\[]*\])(?![^\(]*\))/.source);n.leftMatch[u]=new RegExp(/(^(?:.|\r|\n)*?)/.source+n.match[u].source.replace(/\\(\d+)/g,function(g,
h){return"\\"+(h-0+1)}))}var z=function(g,h){g=Array.prototype.slice.call(g,0);if(h){h.push.apply(h,g);return h}return g};try{Array.prototype.slice.call(s.documentElement.childNodes,0)}catch(C){z=function(g,h){h=h||[];if(j.call(g)==="[object Array]")Array.prototype.push.apply(h,g);else if(typeof g.length==="number")for(var l=0,m=g.length;l<m;l++)h.push(g[l]);else for(l=0;g[l];l++)h.push(g[l]);return h}}var B;if(s.documentElement.compareDocumentPosition)B=function(g,h){if(!g.compareDocumentPosition||
!h.compareDocumentPosition){if(g==h)i=true;return g.compareDocumentPosition?-1:1}g=g.compareDocumentPosition(h)&4?-1:g===h?0:1;if(g===0)i=true;return g};else if("sourceIndex"in s.documentElement)B=function(g,h){if(!g.sourceIndex||!h.sourceIndex){if(g==h)i=true;return g.sourceIndex?-1:1}g=g.sourceIndex-h.sourceIndex;if(g===0)i=true;return g};else if(s.createRange)B=function(g,h){if(!g.ownerDocument||!h.ownerDocument){if(g==h)i=true;return g.ownerDocument?-1:1}var l=g.ownerDocument.createRange(),m=
h.ownerDocument.createRange();l.setStart(g,0);l.setEnd(g,0);m.setStart(h,0);m.setEnd(h,0);g=l.compareBoundaryPoints(Range.START_TO_END,m);if(g===0)i=true;return g};(function(){var g=s.createElement("div"),h="script"+(new Date).getTime();g.innerHTML="<a name='"+h+"'/>";var l=s.documentElement;l.insertBefore(g,l.firstChild);if(s.getElementById(h)){n.find.ID=function(m,q,p){if(typeof q.getElementById!=="undefined"&&!p)return(q=q.getElementById(m[1]))?q.id===m[1]||typeof q.getAttributeNode!=="undefined"&&
q.getAttributeNode("id").nodeValue===m[1]?[q]:w:[]};n.filter.ID=function(m,q){var p=typeof m.getAttributeNode!=="undefined"&&m.getAttributeNode("id");return m.nodeType===1&&p&&p.nodeValue===q}}l.removeChild(g);l=g=null})();(function(){var g=s.createElement("div");g.appendChild(s.createComment(""));if(g.getElementsByTagName("*").length>0)n.find.TAG=function(h,l){l=l.getElementsByTagName(h[1]);if(h[1]==="*"){h=[];for(var m=0;l[m];m++)l[m].nodeType===1&&h.push(l[m]);l=h}return l};g.innerHTML="<a href='#'></a>";
if(g.firstChild&&typeof g.firstChild.getAttribute!=="undefined"&&g.firstChild.getAttribute("href")!=="#")n.attrHandle.href=function(h){return h.getAttribute("href",2)};g=null})();s.querySelectorAll&&function(){var g=k,h=s.createElement("div");h.innerHTML="<p class='TEST'></p>";if(!(h.querySelectorAll&&h.querySelectorAll(".TEST").length===0)){k=function(m,q,p,v){q=q||s;if(!v&&q.nodeType===9&&!x(q))try{return z(q.querySelectorAll(m),p)}catch(t){}return g(m,q,p,v)};for(var l in g)k[l]=g[l];h=null}}();
(function(){var g=s.createElement("div");g.innerHTML="<div class='test e'></div><div class='test'></div>";if(!(!g.getElementsByClassName||g.getElementsByClassName("e").length===0)){g.lastChild.className="e";if(g.getElementsByClassName("e").length!==1){n.order.splice(1,0,"CLASS");n.find.CLASS=function(h,l,m){if(typeof l.getElementsByClassName!=="undefined"&&!m)return l.getElementsByClassName(h[1])};g=null}}})();var E=s.compareDocumentPosition?function(g,h){return!!(g.compareDocumentPosition(h)&16)}:
function(g,h){return g!==h&&(g.contains?g.contains(h):true)},x=function(g){return(g=(g?g.ownerDocument||g:0).documentElement)?g.nodeName!=="HTML":false},ga=function(g,h){var l=[],m="",q;for(h=h.nodeType?[h]:h;q=n.match.PSEUDO.exec(g);){m+=q[0];g=g.replace(n.match.PSEUDO,"")}g=n.relative[g]?g+"*":g;q=0;for(var p=h.length;q<p;q++)k(g,h[q],l);return k.filter(m,l)};c.find=k;c.expr=k.selectors;c.expr[":"]=c.expr.filters;c.unique=k.uniqueSort;c.text=a;c.isXMLDoc=x;c.contains=E})();var eb=/Until$/,fb=/^(?:parents|prevUntil|prevAll)/,
gb=/,/;R=Array.prototype.slice;var Ia=function(a,b,d){if(c.isFunction(b))return c.grep(a,function(e,j){return!!b.call(e,j,e)===d});else if(b.nodeType)return c.grep(a,function(e){return e===b===d});else if(typeof b==="string"){var f=c.grep(a,function(e){return e.nodeType===1});if(Ua.test(b))return c.filter(b,f,!d);else b=c.filter(b,f)}return c.grep(a,function(e){return c.inArray(e,b)>=0===d})};c.fn.extend({find:function(a){for(var b=this.pushStack("","find",a),d=0,f=0,e=this.length;f<e;f++){d=b.length;
c.find(a,this[f],b);if(f>0)for(var j=d;j<b.length;j++)for(var i=0;i<d;i++)if(b[i]===b[j]){b.splice(j--,1);break}}return b},has:function(a){var b=c(a);return this.filter(function(){for(var d=0,f=b.length;d<f;d++)if(c.contains(this,b[d]))return true})},not:function(a){return this.pushStack(Ia(this,a,false),"not",a)},filter:function(a){return this.pushStack(Ia(this,a,true),"filter",a)},is:function(a){return!!a&&c.filter(a,this).length>0},closest:function(a,b){if(c.isArray(a)){var d=[],f=this[0],e,j=
{},i;if(f&&a.length){e=0;for(var o=a.length;e<o;e++){i=a[e];j[i]||(j[i]=c.expr.match.POS.test(i)?c(i,b||this.context):i)}for(;f&&f.ownerDocument&&f!==b;){for(i in j){e=j[i];if(e.jquery?e.index(f)>-1:c(f).is(e)){d.push({selector:i,elem:f});delete j[i]}}f=f.parentNode}}return d}var k=c.expr.match.POS.test(a)?c(a,b||this.context):null;return this.map(function(n,r){for(;r&&r.ownerDocument&&r!==b;){if(k?k.index(r)>-1:c(r).is(a))return r;r=r.parentNode}return null})},index:function(a){if(!a||typeof a===
"string")return c.inArray(this[0],a?c(a):this.parent().children());return c.inArray(a.jquery?a[0]:a,this)},add:function(a,b){a=typeof a==="string"?c(a,b||this.context):c.makeArray(a);b=c.merge(this.get(),a);return this.pushStack(qa(a[0])||qa(b[0])?b:c.unique(b))},andSelf:function(){return this.add(this.prevObject)}});c.each({parent:function(a){return(a=a.parentNode)&&a.nodeType!==11?a:null},parents:function(a){return c.dir(a,"parentNode")},parentsUntil:function(a,b,d){return c.dir(a,"parentNode",
d)},next:function(a){return c.nth(a,2,"nextSibling")},prev:function(a){return c.nth(a,2,"previousSibling")},nextAll:function(a){return c.dir(a,"nextSibling")},prevAll:function(a){return c.dir(a,"previousSibling")},nextUntil:function(a,b,d){return c.dir(a,"nextSibling",d)},prevUntil:function(a,b,d){return c.dir(a,"previousSibling",d)},siblings:function(a){return c.sibling(a.parentNode.firstChild,a)},children:function(a){return c.sibling(a.firstChild)},contents:function(a){return c.nodeName(a,"iframe")?
a.contentDocument||a.contentWindow.document:c.makeArray(a.childNodes)}},function(a,b){c.fn[a]=function(d,f){var e=c.map(this,b,d);eb.test(a)||(f=d);if(f&&typeof f==="string")e=c.filter(f,e);e=this.length>1?c.unique(e):e;if((this.length>1||gb.test(f))&&fb.test(a))e=e.reverse();return this.pushStack(e,a,R.call(arguments).join(","))}});c.extend({filter:function(a,b,d){if(d)a=":not("+a+")";return c.find.matches(a,b)},dir:function(a,b,d){var f=[];for(a=a[b];a&&a.nodeType!==9&&(d===w||a.nodeType!==1||!c(a).is(d));){a.nodeType===
1&&f.push(a);a=a[b]}return f},nth:function(a,b,d){b=b||1;for(var f=0;a;a=a[d])if(a.nodeType===1&&++f===b)break;return a},sibling:function(a,b){for(var d=[];a;a=a.nextSibling)a.nodeType===1&&a!==b&&d.push(a);return d}});var Ja=/ jQuery\d+="(?:\d+|null)"/g,V=/^\s+/,Ka=/(<([\w:]+)[^>]*?)\/>/g,hb=/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,La=/<([\w:]+)/,ib=/<tbody/i,jb=/<|&#?\w+;/,ta=/<script|<object|<embed|<option|<style/i,ua=/checked\s*(?:[^=]|=\s*.checked.)/i,Ma=function(a,b,d){return hb.test(d)?
a:b+"></"+d+">"},F={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};F.optgroup=F.option;F.tbody=F.tfoot=F.colgroup=F.caption=F.thead;F.th=F.td;if(!c.support.htmlSerialize)F._default=[1,"div<div>","</div>"];c.fn.extend({text:function(a){if(c.isFunction(a))return this.each(function(b){var d=
c(this);d.text(a.call(this,b,d.text()))});if(typeof a!=="object"&&a!==w)return this.empty().append((this[0]&&this[0].ownerDocument||s).createTextNode(a));return c.text(this)},wrapAll:function(a){if(c.isFunction(a))return this.each(function(d){c(this).wrapAll(a.call(this,d))});if(this[0]){var b=c(a,this[0].ownerDocument).eq(0).clone(true);this[0].parentNode&&b.insertBefore(this[0]);b.map(function(){for(var d=this;d.firstChild&&d.firstChild.nodeType===1;)d=d.firstChild;return d}).append(this)}return this},
wrapInner:function(a){if(c.isFunction(a))return this.each(function(b){c(this).wrapInner(a.call(this,b))});return this.each(function(){var b=c(this),d=b.contents();d.length?d.wrapAll(a):b.append(a)})},wrap:function(a){return this.each(function(){c(this).wrapAll(a)})},unwrap:function(){return this.parent().each(function(){c.nodeName(this,"body")||c(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.appendChild(a)})},
prepend:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this)});else if(arguments.length){var a=c(arguments[0]);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,
this.nextSibling)});else if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,c(arguments[0]).toArray());return a}},remove:function(a,b){for(var d=0,f;(f=this[d])!=null;d++)if(!a||c.filter(a,[f]).length){if(!b&&f.nodeType===1){c.cleanData(f.getElementsByTagName("*"));c.cleanData([f])}f.parentNode&&f.parentNode.removeChild(f)}return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++)for(b.nodeType===1&&c.cleanData(b.getElementsByTagName("*"));b.firstChild;)b.removeChild(b.firstChild);
return this},clone:function(a){var b=this.map(function(){if(!c.support.noCloneEvent&&!c.isXMLDoc(this)){var d=this.outerHTML,f=this.ownerDocument;if(!d){d=f.createElement("div");d.appendChild(this.cloneNode(true));d=d.innerHTML}return c.clean([d.replace(Ja,"").replace(/=([^="'>\s]+\/)>/g,'="$1">').replace(V,"")],f)[0]}else return this.cloneNode(true)});if(a===true){ra(this,b);ra(this.find("*"),b.find("*"))}return b},html:function(a){if(a===w)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(Ja,
""):null;else if(typeof a==="string"&&!ta.test(a)&&(c.support.leadingWhitespace||!V.test(a))&&!F[(La.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Ka,Ma);try{for(var b=0,d=this.length;b<d;b++)if(this[b].nodeType===1){c.cleanData(this[b].getElementsByTagName("*"));this[b].innerHTML=a}}catch(f){this.empty().append(a)}}else c.isFunction(a)?this.each(function(e){var j=c(this),i=j.html();j.empty().append(function(){return a.call(this,e,i)})}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&
this[0].parentNode){if(c.isFunction(a))return this.each(function(b){var d=c(this),f=d.html();d.replaceWith(a.call(this,b,f))});if(typeof a!=="string")a=c(a).detach();return this.each(function(){var b=this.nextSibling,d=this.parentNode;c(this).remove();b?c(b).before(a):c(d).append(a)})}else return this.pushStack(c(c.isFunction(a)?a():a),"replaceWith",a)},detach:function(a){return this.remove(a,true)},domManip:function(a,b,d){function f(u){return c.nodeName(u,"table")?u.getElementsByTagName("tbody")[0]||
u.appendChild(u.ownerDocument.createElement("tbody")):u}var e,j,i=a[0],o=[],k;if(!c.support.checkClone&&arguments.length===3&&typeof i==="string"&&ua.test(i))return this.each(function(){c(this).domManip(a,b,d,true)});if(c.isFunction(i))return this.each(function(u){var z=c(this);a[0]=i.call(this,u,b?z.html():w);z.domManip(a,b,d)});if(this[0]){e=i&&i.parentNode;e=c.support.parentNode&&e&&e.nodeType===11&&e.childNodes.length===this.length?{fragment:e}:sa(a,this,o);k=e.fragment;if(j=k.childNodes.length===
1?(k=k.firstChild):k.firstChild){b=b&&c.nodeName(j,"tr");for(var n=0,r=this.length;n<r;n++)d.call(b?f(this[n],j):this[n],n>0||e.cacheable||this.length>1?k.cloneNode(true):k)}o.length&&c.each(o,Qa)}return this}});c.fragments={};c.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){c.fn[a]=function(d){var f=[];d=c(d);var e=this.length===1&&this[0].parentNode;if(e&&e.nodeType===11&&e.childNodes.length===1&&d.length===1){d[b](this[0]);
return this}else{e=0;for(var j=d.length;e<j;e++){var i=(e>0?this.clone(true):this).get();c.fn[b].apply(c(d[e]),i);f=f.concat(i)}return this.pushStack(f,a,d.selector)}}});c.extend({clean:function(a,b,d,f){b=b||s;if(typeof b.createElement==="undefined")b=b.ownerDocument||b[0]&&b[0].ownerDocument||s;for(var e=[],j=0,i;(i=a[j])!=null;j++){if(typeof i==="number")i+="";if(i){if(typeof i==="string"&&!jb.test(i))i=b.createTextNode(i);else if(typeof i==="string"){i=i.replace(Ka,Ma);var o=(La.exec(i)||["",
""])[1].toLowerCase(),k=F[o]||F._default,n=k[0],r=b.createElement("div");for(r.innerHTML=k[1]+i+k[2];n--;)r=r.lastChild;if(!c.support.tbody){n=ib.test(i);o=o==="table"&&!n?r.firstChild&&r.firstChild.childNodes:k[1]==="<table>"&&!n?r.childNodes:[];for(k=o.length-1;k>=0;--k)c.nodeName(o[k],"tbody")&&!o[k].childNodes.length&&o[k].parentNode.removeChild(o[k])}!c.support.leadingWhitespace&&V.test(i)&&r.insertBefore(b.createTextNode(V.exec(i)[0]),r.firstChild);i=r.childNodes}if(i.nodeType)e.push(i);else e=
c.merge(e,i)}}if(d)for(j=0;e[j];j++)if(f&&c.nodeName(e[j],"script")&&(!e[j].type||e[j].type.toLowerCase()==="text/javascript"))f.push(e[j].parentNode?e[j].parentNode.removeChild(e[j]):e[j]);else{e[j].nodeType===1&&e.splice.apply(e,[j+1,0].concat(c.makeArray(e[j].getElementsByTagName("script"))));d.appendChild(e[j])}return e},cleanData:function(a){for(var b,d,f=c.cache,e=c.event.special,j=c.support.deleteExpando,i=0,o;(o=a[i])!=null;i++)if(d=o[c.expando]){b=f[d];if(b.events)for(var k in b.events)e[k]?
c.event.remove(o,k):Ca(o,k,b.handle);if(j)delete o[c.expando];else o.removeAttribute&&o.removeAttribute(c.expando);delete f[d]}}});var kb=/z-?index|font-?weight|opacity|zoom|line-?height/i,Na=/alpha\([^)]*\)/,Oa=/opacity=([^)]*)/,ha=/float/i,ia=/-([a-z])/ig,lb=/([A-Z])/g,mb=/^-?\d+(?:px)?$/i,nb=/^-?\d/,ob={position:"absolute",visibility:"hidden",display:"block"},pb=["Left","Right"],qb=["Top","Bottom"],rb=s.defaultView&&s.defaultView.getComputedStyle,Pa=c.support.cssFloat?"cssFloat":"styleFloat",ja=
function(a,b){return b.toUpperCase()};c.fn.css=function(a,b){return X(this,a,b,true,function(d,f,e){if(e===w)return c.curCSS(d,f);if(typeof e==="number"&&!kb.test(f))e+="px";c.style(d,f,e)})};c.extend({style:function(a,b,d){if(!a||a.nodeType===3||a.nodeType===8)return w;if((b==="width"||b==="height")&&parseFloat(d)<0)d=w;var f=a.style||a,e=d!==w;if(!c.support.opacity&&b==="opacity"){if(e){f.zoom=1;b=parseInt(d,10)+""==="NaN"?"":"alpha(opacity="+d*100+")";a=f.filter||c.curCSS(a,"filter")||"";f.filter=
Na.test(a)?a.replace(Na,b):b}return f.filter&&f.filter.indexOf("opacity=")>=0?parseFloat(Oa.exec(f.filter)[1])/100+"":""}if(ha.test(b))b=Pa;b=b.replace(ia,ja);if(e)f[b]=d;return f[b]},css:function(a,b,d,f){if(b==="width"||b==="height"){var e,j=b==="width"?pb:qb;function i(){e=b==="width"?a.offsetWidth:a.offsetHeight;f!=="border"&&c.each(j,function(){f||(e-=parseFloat(c.curCSS(a,"padding"+this,true))||0);if(f==="margin")e+=parseFloat(c.curCSS(a,"margin"+this,true))||0;else e-=parseFloat(c.curCSS(a,
"border"+this+"Width",true))||0})}a.offsetWidth!==0?i():c.swap(a,ob,i);return Math.max(0,Math.round(e))}return c.curCSS(a,b,d)},curCSS:function(a,b,d){var f,e=a.style;if(!c.support.opacity&&b==="opacity"&&a.currentStyle){f=Oa.test(a.currentStyle.filter||"")?parseFloat(RegExp.$1)/100+"":"";return f===""?"1":f}if(ha.test(b))b=Pa;if(!d&&e&&e[b])f=e[b];else if(rb){if(ha.test(b))b="float";b=b.replace(lb,"-$1").toLowerCase();e=a.ownerDocument.defaultView;if(!e)return null;if(a=e.getComputedStyle(a,null))f=
a.getPropertyValue(b);if(b==="opacity"&&f==="")f="1"}else if(a.currentStyle){d=b.replace(ia,ja);f=a.currentStyle[b]||a.currentStyle[d];if(!mb.test(f)&&nb.test(f)){b=e.left;var j=a.runtimeStyle.left;a.runtimeStyle.left=a.currentStyle.left;e.left=d==="fontSize"?"1em":f||0;f=e.pixelLeft+"px";e.left=b;a.runtimeStyle.left=j}}return f},swap:function(a,b,d){var f={};for(var e in b){f[e]=a.style[e];a.style[e]=b[e]}d.call(a);for(e in b)a.style[e]=f[e]}});if(c.expr&&c.expr.filters){c.expr.filters.hidden=function(a){var b=
a.offsetWidth,d=a.offsetHeight,f=a.nodeName.toLowerCase()==="tr";return b===0&&d===0&&!f?true:b>0&&d>0&&!f?false:c.curCSS(a,"display")==="none"};c.expr.filters.visible=function(a){return!c.expr.filters.hidden(a)}}var sb=J(),tb=/<script(.|\s)*?\/script>/gi,ub=/select|textarea/i,vb=/color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week/i,N=/=\?(&|$)/,ka=/\?/,wb=/(\?|&)_=.*?(&|$)/,xb=/^(\w+:)?\/\/([^\/?#]+)/,yb=/%20/g,zb=c.fn.load;c.fn.extend({load:function(a,b,d){if(typeof a!==
"string")return zb.call(this,a);else if(!this.length)return this;var f=a.indexOf(" ");if(f>=0){var e=a.slice(f,a.length);a=a.slice(0,f)}f="GET";if(b)if(c.isFunction(b)){d=b;b=null}else if(typeof b==="object"){b=c.param(b,c.ajaxSettings.traditional);f="POST"}var j=this;c.ajax({url:a,type:f,dataType:"html",data:b,complete:function(i,o){if(o==="success"||o==="notmodified")j.html(e?c("<div />").append(i.responseText.replace(tb,"")).find(e):i.responseText);d&&j.each(d,[i.responseText,o,i])}});return this},
serialize:function(){return c.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?c.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||ub.test(this.nodeName)||vb.test(this.type))}).map(function(a,b){a=c(this).val();return a==null?null:c.isArray(a)?c.map(a,function(d){return{name:b.name,value:d}}):{name:b.name,value:a}}).get()}});c.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),
function(a,b){c.fn[b]=function(d){return this.bind(b,d)}});c.extend({get:function(a,b,d,f){if(c.isFunction(b)){f=f||d;d=b;b=null}return c.ajax({type:"GET",url:a,data:b,success:d,dataType:f})},getScript:function(a,b){return c.get(a,null,b,"script")},getJSON:function(a,b,d){return c.get(a,b,d,"json")},post:function(a,b,d,f){if(c.isFunction(b)){f=f||d;d=b;b={}}return c.ajax({type:"POST",url:a,data:b,success:d,dataType:f})},ajaxSetup:function(a){c.extend(c.ajaxSettings,a)},ajaxSettings:{url:location.href,
global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:A.XMLHttpRequest&&(A.location.protocol!=="file:"||!A.ActiveXObject)?function(){return new A.XMLHttpRequest}:function(){try{return new A.ActiveXObject("Microsoft.XMLHTTP")}catch(a){}},accepts:{xml:"application/xml, text/xml",html:"text/html",script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},lastModified:{},etag:{},ajax:function(a){function b(){e.success&&
e.success.call(k,o,i,x);e.global&&f("ajaxSuccess",[x,e])}function d(){e.complete&&e.complete.call(k,x,i);e.global&&f("ajaxComplete",[x,e]);e.global&&!--c.active&&c.event.trigger("ajaxStop")}function f(q,p){(e.context?c(e.context):c.event).trigger(q,p)}var e=c.extend(true,{},c.ajaxSettings,a),j,i,o,k=a&&a.context||e,n=e.type.toUpperCase();if(e.data&&e.processData&&typeof e.data!=="string")e.data=c.param(e.data,e.traditional);if(e.dataType==="jsonp"){if(n==="GET")N.test(e.url)||(e.url+=(ka.test(e.url)?
"&":"?")+(e.jsonp||"callback")+"=?");else if(!e.data||!N.test(e.data))e.data=(e.data?e.data+"&":"")+(e.jsonp||"callback")+"=?";e.dataType="json"}if(e.dataType==="json"&&(e.data&&N.test(e.data)||N.test(e.url))){j=e.jsonpCallback||"jsonp"+sb++;if(e.data)e.data=(e.data+"").replace(N,"="+j+"$1");e.url=e.url.replace(N,"="+j+"$1");e.dataType="script";A[j]=A[j]||function(q){o=q;b();d();A[j]=w;try{delete A[j]}catch(p){}z&&z.removeChild(C)}}if(e.dataType==="script"&&e.cache===null)e.cache=false;if(e.cache===
false&&n==="GET"){var r=J(),u=e.url.replace(wb,"$1_="+r+"$2");e.url=u+(u===e.url?(ka.test(e.url)?"&":"?")+"_="+r:"")}if(e.data&&n==="GET")e.url+=(ka.test(e.url)?"&":"?")+e.data;e.global&&!c.active++&&c.event.trigger("ajaxStart");r=(r=xb.exec(e.url))&&(r[1]&&r[1]!==location.protocol||r[2]!==location.host);if(e.dataType==="script"&&n==="GET"&&r){var z=s.getElementsByTagName("head")[0]||s.documentElement,C=s.createElement("script");C.src=e.url;if(e.scriptCharset)C.charset=e.scriptCharset;if(!j){var B=
false;C.onload=C.onreadystatechange=function(){if(!B&&(!this.readyState||this.readyState==="loaded"||this.readyState==="complete")){B=true;b();d();C.onload=C.onreadystatechange=null;z&&C.parentNode&&z.removeChild(C)}}}z.insertBefore(C,z.firstChild);return w}var E=false,x=e.xhr();if(x){e.username?x.open(n,e.url,e.async,e.username,e.password):x.open(n,e.url,e.async);try{if(e.data||a&&a.contentType)x.setRequestHeader("Content-Type",e.contentType);if(e.ifModified){c.lastModified[e.url]&&x.setRequestHeader("If-Modified-Since",
c.lastModified[e.url]);c.etag[e.url]&&x.setRequestHeader("If-None-Match",c.etag[e.url])}r||x.setRequestHeader("X-Requested-With","XMLHttpRequest");x.setRequestHeader("Accept",e.dataType&&e.accepts[e.dataType]?e.accepts[e.dataType]+", */*":e.accepts._default)}catch(ga){}if(e.beforeSend&&e.beforeSend.call(k,x,e)===false){e.global&&!--c.active&&c.event.trigger("ajaxStop");x.abort();return false}e.global&&f("ajaxSend",[x,e]);var g=x.onreadystatechange=function(q){if(!x||x.readyState===0||q==="abort"){E||
d();E=true;if(x)x.onreadystatechange=c.noop}else if(!E&&x&&(x.readyState===4||q==="timeout")){E=true;x.onreadystatechange=c.noop;i=q==="timeout"?"timeout":!c.httpSuccess(x)?"error":e.ifModified&&c.httpNotModified(x,e.url)?"notmodified":"success";var p;if(i==="success")try{o=c.httpData(x,e.dataType,e)}catch(v){i="parsererror";p=v}if(i==="success"||i==="notmodified")j||b();else c.handleError(e,x,i,p);d();q==="timeout"&&x.abort();if(e.async)x=null}};try{var h=x.abort;x.abort=function(){x&&h.call(x);
g("abort")}}catch(l){}e.async&&e.timeout>0&&setTimeout(function(){x&&!E&&g("timeout")},e.timeout);try{x.send(n==="POST"||n==="PUT"||n==="DELETE"?e.data:null)}catch(m){c.handleError(e,x,null,m);d()}e.async||g();return x}},handleError:function(a,b,d,f){if(a.error)a.error.call(a.context||a,b,d,f);if(a.global)(a.context?c(a.context):c.event).trigger("ajaxError",[b,a,f])},active:0,httpSuccess:function(a){try{return!a.status&&location.protocol==="file:"||a.status>=200&&a.status<300||a.status===304||a.status===
1223||a.status===0}catch(b){}return false},httpNotModified:function(a,b){var d=a.getResponseHeader("Last-Modified"),f=a.getResponseHeader("Etag");if(d)c.lastModified[b]=d;if(f)c.etag[b]=f;return a.status===304||a.status===0},httpData:function(a,b,d){var f=a.getResponseHeader("content-type")||"",e=b==="xml"||!b&&f.indexOf("xml")>=0;a=e?a.responseXML:a.responseText;e&&a.documentElement.nodeName==="parsererror"&&c.error("parsererror");if(d&&d.dataFilter)a=d.dataFilter(a,b);if(typeof a==="string")if(b===
"json"||!b&&f.indexOf("json")>=0)a=c.parseJSON(a);else if(b==="script"||!b&&f.indexOf("javascript")>=0)c.globalEval(a);return a},param:function(a,b){function d(i,o){if(c.isArray(o))c.each(o,function(k,n){b||/\[\]$/.test(i)?f(i,n):d(i+"["+(typeof n==="object"||c.isArray(n)?k:"")+"]",n)});else!b&&o!=null&&typeof o==="object"?c.each(o,function(k,n){d(i+"["+k+"]",n)}):f(i,o)}function f(i,o){o=c.isFunction(o)?o():o;e[e.length]=encodeURIComponent(i)+"="+encodeURIComponent(o)}var e=[];if(b===w)b=c.ajaxSettings.traditional;
if(c.isArray(a)||a.jquery)c.each(a,function(){f(this.name,this.value)});else for(var j in a)d(j,a[j]);return e.join("&").replace(yb,"+")}});var la={},Ab=/toggle|show|hide/,Bb=/^([+-]=)?([\d+-.]+)(.*)$/,W,va=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];c.fn.extend({show:function(a,b){if(a||a===0)return this.animate(K("show",3),a,b);else{a=0;for(b=this.length;a<b;a++){var d=c.data(this[a],"olddisplay");
this[a].style.display=d||"";if(c.css(this[a],"display")==="none"){d=this[a].nodeName;var f;if(la[d])f=la[d];else{var e=c("<"+d+" />").appendTo("body");f=e.css("display");if(f==="none")f="block";e.remove();la[d]=f}c.data(this[a],"olddisplay",f)}}a=0;for(b=this.length;a<b;a++)this[a].style.display=c.data(this[a],"olddisplay")||"";return this}},hide:function(a,b){if(a||a===0)return this.animate(K("hide",3),a,b);else{a=0;for(b=this.length;a<b;a++){var d=c.data(this[a],"olddisplay");!d&&d!=="none"&&c.data(this[a],
"olddisplay",c.css(this[a],"display"))}a=0;for(b=this.length;a<b;a++)this[a].style.display="none";return this}},_toggle:c.fn.toggle,toggle:function(a,b){var d=typeof a==="boolean";if(c.isFunction(a)&&c.isFunction(b))this._toggle.apply(this,arguments);else a==null||d?this.each(function(){var f=d?a:c(this).is(":hidden");c(this)[f?"show":"hide"]()}):this.animate(K("toggle",3),a,b);return this},fadeTo:function(a,b,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,d)},
animate:function(a,b,d,f){var e=c.speed(b,d,f);if(c.isEmptyObject(a))return this.each(e.complete);return this[e.queue===false?"each":"queue"](function(){var j=c.extend({},e),i,o=this.nodeType===1&&c(this).is(":hidden"),k=this;for(i in a){var n=i.replace(ia,ja);if(i!==n){a[n]=a[i];delete a[i];i=n}if(a[i]==="hide"&&o||a[i]==="show"&&!o)return j.complete.call(this);if((i==="height"||i==="width")&&this.style){j.display=c.css(this,"display");j.overflow=this.style.overflow}if(c.isArray(a[i])){(j.specialEasing=
j.specialEasing||{})[i]=a[i][1];a[i]=a[i][0]}}if(j.overflow!=null)this.style.overflow="hidden";j.curAnim=c.extend({},a);c.each(a,function(r,u){var z=new c.fx(k,j,r);if(Ab.test(u))z[u==="toggle"?o?"show":"hide":u](a);else{var C=Bb.exec(u),B=z.cur(true)||0;if(C){u=parseFloat(C[2]);var E=C[3]||"px";if(E!=="px"){k.style[r]=(u||1)+E;B=(u||1)/z.cur(true)*B;k.style[r]=B+E}if(C[1])u=(C[1]==="-="?-1:1)*u+B;z.custom(B,u,E)}else z.custom(B,u,"")}});return true})},stop:function(a,b){var d=c.timers;a&&this.queue([]);
this.each(function(){for(var f=d.length-1;f>=0;f--)if(d[f].elem===this){b&&d[f](true);d.splice(f,1)}});b||this.dequeue();return this}});c.each({slideDown:K("show",1),slideUp:K("hide",1),slideToggle:K("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(a,b){c.fn[a]=function(d,f){return this.animate(b,d,f)}});c.extend({speed:function(a,b,d){var f=a&&typeof a==="object"?a:{complete:d||!d&&b||c.isFunction(a)&&a,duration:a,easing:d&&b||b&&!c.isFunction(b)&&b};f.duration=c.fx.off?0:typeof f.duration===
"number"?f.duration:c.fx.speeds[f.duration]||c.fx.speeds._default;f.old=f.complete;f.complete=function(){f.queue!==false&&c(this).dequeue();c.isFunction(f.old)&&f.old.call(this)};return f},easing:{linear:function(a,b,d,f){return d+f*a},swing:function(a,b,d,f){return(-Math.cos(a*Math.PI)/2+0.5)*f+d}},timers:[],fx:function(a,b,d){this.options=b;this.elem=a;this.prop=d;if(!b.orig)b.orig={}}});c.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this);(c.fx.step[this.prop]||
c.fx.step._default)(this);if((this.prop==="height"||this.prop==="width")&&this.elem.style)this.elem.style.display="block"},cur:function(a){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];return(a=parseFloat(c.css(this.elem,this.prop,a)))&&a>-10000?a:parseFloat(c.curCSS(this.elem,this.prop))||0},custom:function(a,b,d){function f(j){return e.step(j)}this.startTime=J();this.start=a;this.end=b;this.unit=d||this.unit||"px";this.now=this.start;
this.pos=this.state=0;var e=this;f.elem=this.elem;if(f()&&c.timers.push(f)&&!W)W=setInterval(c.fx.tick,13)},show:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.show=true;this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur());c(this.elem).show()},hide:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(a){var b=J(),d=true;if(a||b>=this.options.duration+this.startTime){this.now=
this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;for(var f in this.options.curAnim)if(this.options.curAnim[f]!==true)d=false;if(d){if(this.options.display!=null){this.elem.style.overflow=this.options.overflow;a=c.data(this.elem,"olddisplay");this.elem.style.display=a?a:this.options.display;if(c.css(this.elem,"display")==="none")this.elem.style.display="block"}this.options.hide&&c(this.elem).hide();if(this.options.hide||this.options.show)for(var e in this.options.curAnim)c.style(this.elem,
e,this.options.orig[e]);this.options.complete.call(this.elem)}return false}else{e=b-this.startTime;this.state=e/this.options.duration;a=this.options.easing||(c.easing.swing?"swing":"linear");this.pos=c.easing[this.options.specialEasing&&this.options.specialEasing[this.prop]||a](this.state,e,0,1,this.options.duration);this.now=this.start+(this.end-this.start)*this.pos;this.update()}return true}};c.extend(c.fx,{tick:function(){for(var a=c.timers,b=0;b<a.length;b++)a[b]()||a.splice(b--,1);a.length||
c.fx.stop()},stop:function(){clearInterval(W);W=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){c.style(a.elem,"opacity",a.now)},_default:function(a){if(a.elem.style&&a.elem.style[a.prop]!=null)a.elem.style[a.prop]=(a.prop==="width"||a.prop==="height"?Math.max(0,a.now):a.now)+a.unit;else a.elem[a.prop]=a.now}}});if(c.expr&&c.expr.filters)c.expr.filters.animated=function(a){return c.grep(c.timers,function(b){return a===b.elem}).length};c.fn.offset="getBoundingClientRect"in s.documentElement?
function(a){var b=this[0];if(a)return this.each(function(e){c.offset.setOffset(this,a,e)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);var d=b.getBoundingClientRect(),f=b.ownerDocument;b=f.body;f=f.documentElement;return{top:d.top+(self.pageYOffset||c.support.boxModel&&f.scrollTop||b.scrollTop)-(f.clientTop||b.clientTop||0),left:d.left+(self.pageXOffset||c.support.boxModel&&f.scrollLeft||b.scrollLeft)-(f.clientLeft||b.clientLeft||0)}}:function(a){var b=
this[0];if(a)return this.each(function(r){c.offset.setOffset(this,a,r)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);c.offset.initialize();var d=b.offsetParent,f=b,e=b.ownerDocument,j,i=e.documentElement,o=e.body;f=(e=e.defaultView)?e.getComputedStyle(b,null):b.currentStyle;for(var k=b.offsetTop,n=b.offsetLeft;(b=b.parentNode)&&b!==o&&b!==i;){if(c.offset.supportsFixedPosition&&f.position==="fixed")break;j=e?e.getComputedStyle(b,null):b.currentStyle;
k-=b.scrollTop;n-=b.scrollLeft;if(b===d){k+=b.offsetTop;n+=b.offsetLeft;if(c.offset.doesNotAddBorder&&!(c.offset.doesAddBorderForTableAndCells&&/^t(able|d|h)$/i.test(b.nodeName))){k+=parseFloat(j.borderTopWidth)||0;n+=parseFloat(j.borderLeftWidth)||0}f=d;d=b.offsetParent}if(c.offset.subtractsBorderForOverflowNotVisible&&j.overflow!=="visible"){k+=parseFloat(j.borderTopWidth)||0;n+=parseFloat(j.borderLeftWidth)||0}f=j}if(f.position==="relative"||f.position==="static"){k+=o.offsetTop;n+=o.offsetLeft}if(c.offset.supportsFixedPosition&&
f.position==="fixed"){k+=Math.max(i.scrollTop,o.scrollTop);n+=Math.max(i.scrollLeft,o.scrollLeft)}return{top:k,left:n}};c.offset={initialize:function(){var a=s.body,b=s.createElement("div"),d,f,e,j=parseFloat(c.curCSS(a,"marginTop",true))||0;c.extend(b.style,{position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"});b.innerHTML="<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";
a.insertBefore(b,a.firstChild);d=b.firstChild;f=d.firstChild;e=d.nextSibling.firstChild.firstChild;this.doesNotAddBorder=f.offsetTop!==5;this.doesAddBorderForTableAndCells=e.offsetTop===5;f.style.position="fixed";f.style.top="20px";this.supportsFixedPosition=f.offsetTop===20||f.offsetTop===15;f.style.position=f.style.top="";d.style.overflow="hidden";d.style.position="relative";this.subtractsBorderForOverflowNotVisible=f.offsetTop===-5;this.doesNotIncludeMarginInBodyOffset=a.offsetTop!==j;a.removeChild(b);
c.offset.initialize=c.noop},bodyOffset:function(a){var b=a.offsetTop,d=a.offsetLeft;c.offset.initialize();if(c.offset.doesNotIncludeMarginInBodyOffset){b+=parseFloat(c.curCSS(a,"marginTop",true))||0;d+=parseFloat(c.curCSS(a,"marginLeft",true))||0}return{top:b,left:d}},setOffset:function(a,b,d){if(/static/.test(c.curCSS(a,"position")))a.style.position="relative";var f=c(a),e=f.offset(),j=parseInt(c.curCSS(a,"top",true),10)||0,i=parseInt(c.curCSS(a,"left",true),10)||0;if(c.isFunction(b))b=b.call(a,
d,e);d={top:b.top-e.top+j,left:b.left-e.left+i};"using"in b?b.using.call(a,d):f.css(d)}};c.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),d=this.offset(),f=/^body|html$/i.test(b[0].nodeName)?{top:0,left:0}:b.offset();d.top-=parseFloat(c.curCSS(a,"marginTop",true))||0;d.left-=parseFloat(c.curCSS(a,"marginLeft",true))||0;f.top+=parseFloat(c.curCSS(b[0],"borderTopWidth",true))||0;f.left+=parseFloat(c.curCSS(b[0],"borderLeftWidth",true))||0;return{top:d.top-
f.top,left:d.left-f.left}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||s.body;a&&!/^body|html$/i.test(a.nodeName)&&c.css(a,"position")==="static";)a=a.offsetParent;return a})}});c.each(["Left","Top"],function(a,b){var d="scroll"+b;c.fn[d]=function(f){var e=this[0],j;if(!e)return null;if(f!==w)return this.each(function(){if(j=wa(this))j.scrollTo(!a?f:c(j).scrollLeft(),a?f:c(j).scrollTop());else this[d]=f});else return(j=wa(e))?"pageXOffset"in j?j[a?"pageYOffset":
"pageXOffset"]:c.support.boxModel&&j.document.documentElement[d]||j.document.body[d]:e[d]}});c.each(["Height","Width"],function(a,b){var d=b.toLowerCase();c.fn["inner"+b]=function(){return this[0]?c.css(this[0],d,false,"padding"):null};c.fn["outer"+b]=function(f){return this[0]?c.css(this[0],d,false,f?"margin":"border"):null};c.fn[d]=function(f){var e=this[0];if(!e)return f==null?null:this;if(c.isFunction(f))return this.each(function(j){var i=c(this);i[d](f.call(this,j,i[d]()))});return"scrollTo"in
e&&e.document?e.document.compatMode==="CSS1Compat"&&e.document.documentElement["client"+b]||e.document.body["client"+b]:e.nodeType===9?Math.max(e.documentElement["client"+b],e.body["scroll"+b],e.documentElement["scroll"+b],e.body["offset"+b],e.documentElement["offset"+b]):f===w?c.css(e,d):this.css(d,typeof f==="string"?f:f+"px")}});A.jQuery=A.$=c})(window);
/*!
 * jQuery UI 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI
 */
 * jQuery UI 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI
 */
jQuery.ui||(function(a){a.ui={version:"1.8",plugin:{add:function(c,d,f){var e=a.ui[c].prototype;for(var b in f){e.plugins[b]=e.plugins[b]||[];e.plugins[b].push([d,f[b]])}},call:function(b,d,c){var f=b.plugins[d];if(!f||!b.element[0].parentNode){return}for(var e=0;e<f.length;e++){if(b.options[f[e][0]]){f[e][1].apply(b.element,c)}}}},contains:function(d,c){return document.compareDocumentPosition?d.compareDocumentPosition(c)&16:d!==c&&d.contains(c)},hasScroll:function(e,c){if(a(e).css("overflow")=="hidden"){return false}var b=(c&&c=="left")?"scrollLeft":"scrollTop",d=false;if(e[b]>0){return true}e[b]=1;d=(e[b]>0);e[b]=0;return d},isOverAxis:function(c,b,d){return(c>b)&&(c<(b+d))},isOver:function(g,c,f,e,b,d){return a.ui.isOverAxis(g,f,b)&&a.ui.isOverAxis(c,e,d)},keyCode:{BACKSPACE:8,CAPS_LOCK:20,COMMA:188,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38}};a.fn.extend({_focus:a.fn.focus,focus:function(b,c){return typeof b==="number"?this.each(function(){var d=this;setTimeout(function(){a(d).focus();(c&&c.call(d))},b)}):this._focus.apply(this,arguments)},enableSelection:function(){return this.attr("unselectable","off").css("MozUserSelect","").unbind("selectstart.ui")},disableSelection:function(){return this.attr("unselectable","on").css("MozUserSelect","none").bind("selectstart.ui",function(){return false})},scrollParent:function(){var b;if((a.browser.msie&&(/(static|relative)/).test(this.css("position")))||(/absolute/).test(this.css("position"))){b=this.parents().filter(function(){return(/(relative|absolute|fixed)/).test(a.curCSS(this,"position",1))&&(/(auto|scroll)/).test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",1))}).eq(0)}else{b=this.parents().filter(function(){return(/(auto|scroll)/).test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",1))}).eq(0)}return(/fixed/).test(this.css("position"))||!b.length?a(document):b},zIndex:function(e){if(e!==undefined){return this.css("zIndex",e)}if(this.length){var c=a(this[0]),b,d;while(c.length&&c[0]!==document){b=c.css("position");if(b=="absolute"||b=="relative"||b=="fixed"){d=parseInt(c.css("zIndex"));if(!isNaN(d)&&d!=0){return d}}c=c.parent()}}return 0}});a.extend(a.expr[":"],{data:function(d,c,b){return !!a.data(d,b[3])},focusable:function(c){var d=c.nodeName.toLowerCase(),b=a.attr(c,"tabindex");return(/input|select|textarea|button|object/.test(d)?!c.disabled:"a"==d||"area"==d?c.href||!isNaN(b):!isNaN(b))&&!a(c)["area"==d?"parents":"closest"](":hidden").length},tabbable:function(c){var b=a.attr(c,"tabindex");return(isNaN(b)||b>=0)&&a(c).is(":focusable")}})})(jQuery);;/*!
 * jQuery UI Widget 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Widget
 */
 * jQuery UI Widget 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Widget
 */
(function(b){var a=b.fn.remove;b.fn.remove=function(c,d){return this.each(function(){if(!d){if(!c||b.filter(c,[this]).length){b("*",this).add(this).each(function(){b(this).triggerHandler("remove")})}}return a.call(b(this),c,d)})};b.widget=function(d,f,c){var e=d.split(".")[0],h;d=d.split(".")[1];h=e+"-"+d;if(!c){c=f;f=b.Widget}b.expr[":"][h]=function(i){return !!b.data(i,d)};b[e]=b[e]||{};b[e][d]=function(i,j){if(arguments.length){this._createWidget(i,j)}};var g=new f();g.options=b.extend({},g.options);b[e][d].prototype=b.extend(true,g,{namespace:e,widgetName:d,widgetEventPrefix:b[e][d].prototype.widgetEventPrefix||d,widgetBaseClass:h},c);b.widget.bridge(d,b[e][d])};b.widget.bridge=function(d,c){b.fn[d]=function(g){var e=typeof g==="string",f=Array.prototype.slice.call(arguments,1),h=this;g=!e&&f.length?b.extend.apply(null,[true,g].concat(f)):g;if(e&&g.substring(0,1)==="_"){return h}if(e){this.each(function(){var i=b.data(this,d),j=i&&b.isFunction(i[g])?i[g].apply(i,f):i;if(j!==i&&j!==undefined){h=j;return false}})}else{this.each(function(){var i=b.data(this,d);if(i){if(g){i.option(g)}i._init()}else{b.data(this,d,new c(g,this))}})}return h}};b.Widget=function(c,d){if(arguments.length){this._createWidget(c,d)}};b.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",options:{disabled:false},_createWidget:function(d,e){this.element=b(e).data(this.widgetName,this);this.options=b.extend(true,{},this.options,b.metadata&&b.metadata.get(e)[this.widgetName],d);var c=this;this.element.bind("remove."+this.widgetName,function(){c.destroy()});this._create();this._init()},_create:function(){},_init:function(){},destroy:function(){this.element.unbind("."+this.widgetName).removeData(this.widgetName);this.widget().unbind("."+this.widgetName).removeAttr("aria-disabled").removeClass(this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled")},widget:function(){return this.element},option:function(e,f){var d=e,c=this;if(arguments.length===0){return b.extend({},c.options)}if(typeof e==="string"){if(f===undefined){return this.options[e]}d={};d[e]=f}b.each(d,function(g,h){c._setOption(g,h)});return c},_setOption:function(c,d){this.options[c]=d;if(c==="disabled"){this.widget()[d?"addClass":"removeClass"](this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").attr("aria-disabled",d)}return this},enable:function(){return this._setOption("disabled",false)},disable:function(){return this._setOption("disabled",true)},_trigger:function(d,e,f){var h=this.options[d];e=b.Event(e);e.type=(d===this.widgetEventPrefix?d:this.widgetEventPrefix+d).toLowerCase();f=f||{};if(e.originalEvent){for(var c=b.event.props.length,g;c;){g=b.event.props[--c];e[g]=e.originalEvent[g]}}this.element.trigger(e,f);return !(b.isFunction(h)&&h.call(this.element[0],e,f)===false||e.isDefaultPrevented())}}})(jQuery);;/*!
 * jQuery UI Mouse 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Mouse
 *
 * Depends:
 *	jquery.ui.widget.js
 */
 * jQuery UI Mouse 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Mouse
 *
 * Depends:
 *	jquery.ui.widget.js
 */
(function(a){a.widget("ui.mouse",{options:{cancel:":input,option",distance:1,delay:0},_mouseInit:function(){var b=this;this.element.bind("mousedown."+this.widgetName,function(c){return b._mouseDown(c)}).bind("click."+this.widgetName,function(c){if(b._preventClickEvent){b._preventClickEvent=false;c.stopImmediatePropagation();return false}});this.started=false},_mouseDestroy:function(){this.element.unbind("."+this.widgetName)},_mouseDown:function(d){d.originalEvent=d.originalEvent||{};if(d.originalEvent.mouseHandled){return}(this._mouseStarted&&this._mouseUp(d));this._mouseDownEvent=d;var c=this,e=(d.which==1),b=(typeof this.options.cancel=="string"?a(d.target).parents().add(d.target).filter(this.options.cancel).length:false);if(!e||b||!this._mouseCapture(d)){return true}this.mouseDelayMet=!this.options.delay;if(!this.mouseDelayMet){this._mouseDelayTimer=setTimeout(function(){c.mouseDelayMet=true},this.options.delay)}if(this._mouseDistanceMet(d)&&this._mouseDelayMet(d)){this._mouseStarted=(this._mouseStart(d)!==false);if(!this._mouseStarted){d.preventDefault();return true}}this._mouseMoveDelegate=function(f){return c._mouseMove(f)};this._mouseUpDelegate=function(f){return c._mouseUp(f)};a(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate);(a.browser.safari||d.preventDefault());d.originalEvent.mouseHandled=true;return true},_mouseMove:function(b){if(a.browser.msie&&!b.button){return this._mouseUp(b)}if(this._mouseStarted){this._mouseDrag(b);return b.preventDefault()}if(this._mouseDistanceMet(b)&&this._mouseDelayMet(b)){this._mouseStarted=(this._mouseStart(this._mouseDownEvent,b)!==false);(this._mouseStarted?this._mouseDrag(b):this._mouseUp(b))}return !this._mouseStarted},_mouseUp:function(b){a(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate);if(this._mouseStarted){this._mouseStarted=false;this._preventClickEvent=(b.target==this._mouseDownEvent.target);this._mouseStop(b)}return false},_mouseDistanceMet:function(b){return(Math.max(Math.abs(this._mouseDownEvent.pageX-b.pageX),Math.abs(this._mouseDownEvent.pageY-b.pageY))>=this.options.distance)},_mouseDelayMet:function(b){return this.mouseDelayMet},_mouseStart:function(b){},_mouseDrag:function(b){},_mouseStop:function(b){},_mouseCapture:function(b){return true}})})(jQuery);;/*
 * jQuery UI Position 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Position
 */
 * jQuery UI Draggable 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Draggables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Droppable 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Droppables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.mouse.js
 *	jquery.ui.draggable.js
 */
 * jQuery UI Resizable 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Resizables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Selectable 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Selectables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Sortable 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Sortables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Accordion 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Accordion
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Autocomplete 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Autocomplete
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 */
 * jQuery UI Button 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Button
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Dialog 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Dialog
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.ui.button.js
 *	jquery.ui.draggable.js
 *	jquery.ui.mouse.js
 *	jquery.ui.position.js
 *	jquery.ui.resizable.js
 */
 * jQuery UI Slider 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Slider
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Tabs 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Tabs
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
 * jQuery UI Datepicker 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Datepicker
 *
 * Depends:
 *	jquery.ui.core.js
 */
 * jQuery UI Progressbar 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Progressbar
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
 * jQuery UI Effects 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/
 */
 * jQuery UI Effects Blind 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Blind
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Bounce 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Bounce
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Clip 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Clip
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Drop 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Drop
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Explode 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Explode
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Fold 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Fold
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Highlight 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Highlight
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Pulsate 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Pulsate
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Scale 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Scale
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Shake 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Shake
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Slide 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Slide
 *
 * Depends:
 *	jquery.effects.core.js
 */
 * jQuery UI Effects Transfer 1.8
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Transfer
 *
 * Depends:
 *	jquery.effects.core.js
 */
jQuery.url=function(){var segments={};var parsed={};var options={url:window.location,strictMode:false,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}};var parseUri=function(){str=decodeURI(options.url);var m=options.parser[options.strictMode?"strict":"loose"].exec(str);var uri={};var i=14;while(i--){uri[options.key[i]]=m[i]||""}uri[options.q.name]={};uri[options.key[12]].replace(options.q.parser,function($0,$1,$2){if($1){uri[options.q.name][$1]=$2}});return uri};var key=function(key){if(!parsed.length){setUp()}if(key=="base"){if(parsed.port!==null&&parsed.port!==""){return parsed.protocol+"://"+parsed.host+":"+parsed.port+"/"}else{return parsed.protocol+"://"+parsed.host+"/"}}return(parsed[key]==="")?null:parsed[key]};var param=function(item){if(!parsed.length){setUp()}return(parsed.queryKey[item]===null)?null:parsed.queryKey[item]};var setUp=function(){parsed=parseUri();getSegments()};var getSegments=function(){var p=parsed.path;segments=[];segments=parsed.path.length==1?{}:(p.charAt(p.length-1)=="/"?p.substring(1,p.length-1):path=p.substring(1)).split("/")};return{setMode:function(mode){strictMode=mode=="strict"?true:false;return this},setUrl:function(newUri){options.url=newUri===undefined?window.location:newUri;setUp();return this},segment:function(pos){if(!parsed.length){setUp()}if(pos===undefined){return segments.length}return(segments[pos]===""||segments[pos]===undefined)?null:segments[pos]},attr:key,param:param}}();
/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
/* Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * $LastChangedDate: 2007-07-21 18:45:56 -0500 (Sat, 21 Jul 2007) $
 * $Rev: 2447 $
 *
 * Version 2.1.1
 */
(function($){$.fn.bgIframe=$.fn.bgiframe=function(s){if($.browser.msie&&/6.0/.test(navigator.userAgent)){s=$.extend({top:'auto',left:'auto',width:'auto',height:'auto',opacity:true,src:'javascript:false;'},s||{});var prop=function(n){return n&&n.constructor==Number?n+'px':n;},html='<iframe class="bgiframe"frameborder="0"tabindex="-1"src="'+s.src+'"'+'style="display:block;position:absolute;z-index:-1;'+(s.opacity!==false?'filter:Alpha(Opacity=\'0\');':'')+'top:'+(s.top=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')':prop(s.top))+';'+'left:'+(s.left=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')':prop(s.left))+';'+'width:'+(s.width=='auto'?'expression(this.parentNode.offsetWidth+\'px\')':prop(s.width))+';'+'height:'+(s.height=='auto'?'expression(this.parentNode.offsetHeight+\'px\')':prop(s.height))+';'+'"/>';return this.each(function(){if($('> iframe.bgiframe',this).length==0)this.insertBefore(document.createElement(html),this.firstChild);});}return this;};})(jQuery);
;(function(){

var $$;

$$ = jQuery.fn.flash = function(htmlOptions, pluginOptions, replace, update) {

	var block = replace || $$.replace;

	pluginOptions = $$.copy($$.pluginOptions, pluginOptions);

	if(!$$.hasFlash(pluginOptions.version)) {
		if(pluginOptions.expressInstall && $$.hasFlash(6,0,65)) {
			var expressInstallOptions = {
				flashvars: {
					MMredirectURL: location,
					MMplayerType: 'PlugIn',
					MMdoctitle: jQuery('title').text()
				}
			};
		} else if (pluginOptions.update) {
			block = update || $$.update;
		} else {
			return this;
		}
	}

	htmlOptions = $$.copy($$.htmlOptions, expressInstallOptions, htmlOptions);

	return this.each(function(){
		block.call(this, $$.copy(htmlOptions));
	});

};
$$.copy = function() {
	var options = {}, flashvars = {};
	for(var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if(arg == undefined) continue;
		jQuery.extend(options, arg);
		if(arg.flashvars == undefined) continue;
		jQuery.extend(flashvars, arg.flashvars);
	}
	options.flashvars = flashvars;
	return options;
};
/*
 * @name flash.hasFlash
 * @desc Check if a specific version of the Flash plugin is installed
 * @type Boolean
 *
**/
$$.hasFlash = function() {
	if(/hasFlash\=true/.test(location)) return true;
	if(/hasFlash\=false/.test(location)) return false;
	var pv = $$.hasFlash.playerVersion().match(/\d+/g);
	var rv = String([arguments[0], arguments[1], arguments[2]]).match(/\d+/g) || String($$.pluginOptions.version).match(/\d+/g);
	for(var i = 0; i < 3; i++) {
		pv[i] = parseInt(pv[i] || 0);
		rv[i] = parseInt(rv[i] || 0);
		if(pv[i] < rv[i]) return false;
		if(pv[i] > rv[i]) return true;
	}
	return true;
};
$$.hasFlash.playerVersion = function() {
	try {
		try {
			var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
			try { axo.AllowScriptAccess = 'always';	}
			catch(e) { return '6,0,0'; }
		} catch(e) {}
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
	} catch(e) {
		try {
			if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
				return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
			}
		} catch(e) {}
	}
	return '0,0,0';
};
$$.htmlOptions = {
	height: 240,
	flashvars: {},
	pluginspage: 'http://www.adobe.com/go/getflashplayer',
	src: '#',
	type: 'application/x-shockwave-flash',
	width: 320
};
$$.pluginOptions = {
	expressInstall: false,
	update: true,
	version: '6.0.65'
};
$$.replace = function(htmlOptions) {
	this.innerHTML = '<div class="alt">'+this.innerHTML+'</div>';
	jQuery(this)
		.addClass('flash-replaced')
		.prepend($$.transform(htmlOptions));
};
$$.update = function(htmlOptions) {
	var url = String(location).split('?');
	url.splice(1,0,'?hasFlash=true&');
	url = url.join('');
	var msg = '<p>This content requires the Flash Player. <a href="http://www.adobe.com/go/getflashplayer">Download Flash Player</a>. Already have Flash Player? <a href="'+url+'">Click here.</a></p>';
	this.innerHTML = '<span class="alt">'+this.innerHTML+'</span>';
	jQuery(this)
		.addClass('flash-update')
		.prepend(msg);
};
function toAttributeString() {
	var s = '';
	for(var key in this)
		if(typeof this[key] != 'function')
			s += key+'="'+this[key]+'" ';
	return s;
};
function toFlashvarsString() {
	var s = '';
	for(var key in this)
		if(typeof this[key] != 'function')
			s += key+'='+encodeURIComponent(this[key])+'&';
	return s.replace(/&$/, '');
};
$$.transform = function(htmlOptions) {
	htmlOptions.toString = toAttributeString;
	if(htmlOptions.flashvars) htmlOptions.flashvars.toString = toFlashvarsString;
	return '<embed ' + String(htmlOptions) + '/>';
};

if (window.attachEvent) {
	window.attachEvent("onbeforeunload", function(){
		__flash_unloadHandler = function() {};
		__flash_savedUnloadHandler = function() {};
	});
}

})();
(function (){
    RestDS = function (readKey,writeKey,_post_path){
        this.data = "";
        this.enableLoadAndSave = true;
        this.postPath = _post_path || "/models/";
        this.getPath = this.postPath;
        this.setKeys(readKey,writeKey);
    };

    RestDS.prototype =
    {
        setKeys: function (read,write) {
            if (read) {
                this.load(this,function (){});// just load data
                this.readKey = read;
            }
            if (write) {
                this.writeKey = write;
            }
            else {
                this.writeKey= this.randomString();
            }
        },

        randomString: function () {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var string_length = 8;
            var randomstring = '';
            for (var i=0; i<string_length; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum,rnum+1);
            }
            return randomstring;
        },

        save: function (_data) {
            this.data = _data;
            var post_to = this.postPath;
            debug('post_to=' + post_to);
            /*
            var xmlhttp = HTTP.newRequest();
            xmlhttp.open('PUT', post_to, false);
            xmlhttp.send(this.data);
            */
            jQuery.post(post_to, this.data);
            this.readKey = this.writeKey;
            $('#readKey').text("Your Key:" + this.readKey);
            debug("readKey written: " + this.readKey);
        },

        load: function (context,callback) {
            if (this.readKey) {
            	var key = this.readKey;
                this.writeKey = key;
                this.readKey = key;
            }
            else {
                if (this.writeKey) {
                    this.readKey = this.writeKey;
                }
                else {
                    this.readKey = this.writeKey = this.randomString();
                }
            }
            var get_from = this.getPath;
            var self = this;
            debug("just about to load with " + this.readKey);
            if (this.readKey) {
                self = this;
                /*
                new Ajax.Request(get_from, {
                    asynchronous: true,
                    method: 'GET',
                    onSuccess: function (rsp) {
                        var text = rsp.responseText;
                        var _data = eval(text);
                        self.data = _data;
                        callback(_data,context,callback);
                        debug("returned from load");
                    },
                    onFailure: function (req,err) {
                        debug("failed!");
                    }
                });
                */
                jQuery.get(get_from, function (rsp, textStatus) {
                    console.log('rsp=' + rsp);
                    var _data = eval(rsp);
                    self.data = _data;
                    callback(_data,context,callback);
                    debug("returned from load");
                });
            }
            else {
                debug("load caleld, but no read key specified...");
            }
        },

        toString: function () {
            return "Data Service (" + this.postPath + "" + this.writeKey + ")";
        }
    };
})();

/* FILE flash_version_dectection.js */


var isIE  = (navigator.appVersion.indexOf("MSIE") != -1) ? true : false;
var isWin = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
var isOpera = (navigator.userAgent.indexOf("Opera") != -1) ? true : false;

function ControlVersion()
{
    var version;
    var axo;
    try {
        axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
        version = axo.GetVariable("$version");
    } catch (e) {
    }
    if (!version)
    {
        try {
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");


            version = "WIN 6,0,21,0";
            axo.AllowScriptAccess = "always";
            version = axo.GetVariable("$version");
        } catch (e2) {
        }
    }
    if (!version)
    {
        try {
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
            version = axo.GetVariable("$version");
        } catch (e3) {
        }
    }
    if (!version)
    {
        try {
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
            version = "WIN 3,0,18,0";
        } catch (e4) {
        }
    }
    if (!version)
    {
        try {
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            version = "WIN 2,0,0,11";
        } catch (e5) {
            version = -1;
        }
    }

    return version;
}
function GetSwfVer(){
    var flashVer = -1;

    if (navigator.plugins && navigator.plugins.length > 0) {
        if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
            var swVer2 = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
            var flashDescription = navigator.plugins["Shockwave Flash" + swVer2].description;
            var descArray = flashDescription.split(" ");
            var tempArrayMajor = descArray[2].split(".");
            var versionMajor = tempArrayMajor[0];
            var versionMinor = tempArrayMajor[1];
            var versionRevision = descArray[3];
            if (versionRevision === "") {
                versionRevision = descArray[4];
            }
            if (versionRevision[0] == "d") {
                versionRevision = versionRevision.substring(1);
            } else if (versionRevision[0] == "r") {
                versionRevision = versionRevision.substring(1);
                if (versionRevision.indexOf("d") > 0) {
                    versionRevision = versionRevision.substring(0, versionRevision.indexOf("d"));
                }
            }
            var flashVer = versionMajor + "." + versionMinor + "." + versionRevision;
        }
    }
    else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.6") != -1) flashVer = 4;
    else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.5") != -1) flashVer = 3;
    else if (navigator.userAgent.toLowerCase().indexOf("webtv") != -1) flashVer = 2;
    else if ( isIE && isWin && !isOpera ) {
        flashVer = ControlVersion();
    }
    return flashVer;
}
function DetectFlashVer(reqMajorVer, reqMinorVer, reqRevision)
{
    versionStr = GetSwfVer();
    if (versionStr == -1 ) {
        return false;
    } else if (versionStr != 0) {
        if(isIE && isWin && !isOpera) {
            tempArray         = versionStr.split(" ");  // ["WIN", "2,0,0,11"]
            tempString        = tempArray[1];           // "2,0,0,11"
            versionArray      = tempString.split(",");  // ['2', '0', '0', '11']
        } else {
            versionArray      = versionStr.split(".");
        }
        var versionMajor      = versionArray[0];
        var versionMinor      = versionArray[1];
        var versionRevision   = versionArray[2];
        if (versionMajor > parseFloat(reqMajorVer)) {
            return true;
        } else if (versionMajor == parseFloat(reqMajorVer)) {
            if (versionMinor > parseFloat(reqMinorVer))
                return true;
            else if (versionMinor == parseFloat(reqMinorVer)) {
                if (versionRevision >= parseFloat(reqRevision))
                    return true;
            }
        }
        return false;
    }
}
function AC_AddExtension(src, ext)
{
  if (src.indexOf('?') != -1)
    return src.replace(/\?/, ext+'?');
  else
    return src + ext;
}
function AC_Generateobj(objAttrs, params, embedAttrs)
{
  var str = '';
  if (isIE && isWin && !isOpera)
  {
    str += '<object ';
    for (var i in objAttrs)
    {
      str += i + '="' + objAttrs[i] + '" ';
    }
    str += '>';
    for (var i in params)
    {
      str += '<param name="' + i + '" value="' + params[i] + '" /> ';
    }
    str += '</object>';
  }
  else
  {
    str += '<embed ';
    for (var i in embedAttrs)
    {
      str += i + '="' + embedAttrs[i] + '" ';
    }
    str += '> </embed>';
  }
  document.write(str);
}
function AC_FL_RunContent(){
  var ret =
    AC_GetArgs
    (  arguments, ".swf", "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
     , "application/x-shockwave-flash"
    );
  AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
}
function AC_SW_RunContent(){
  var ret =
    AC_GetArgs
    (  arguments, ".dcr", "src", "clsid:166B1BCA-3F9C-11CF-8075-444553540000"
     , null
    );
  AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
}
function AC_GetArgs(args, ext, srcParamName, classid, mimeType){
  var ret = new Object();
  ret.embedAttrs = new Object();
  ret.params = new Object();
  ret.objAttrs = new Object();
  for (var i=0; i < args.length; i=i+2){
    var currArg = args[i].toLowerCase();
    switch (currArg){
      case "classid":
        break;
      case "pluginspage":
        ret.embedAttrs[args[i]] = args[i+1];
        break;
      case "src":
      case "movie":
        args[i+1] = AC_AddExtension(args[i+1], ext);
        ret.embedAttrs["src"] = args[i+1];
        ret.params[srcParamName] = args[i+1];
        break;
      case "onafterupdate":
      case "onbeforeupdate":
      case "onblur":
      case "oncellchange":
      case "onclick":
      case "ondblclick":
      case "ondrag":
      case "ondragend":
      case "ondragenter":
      case "ondragleave":
      case "ondragover":
      case "ondrop":
      case "onfinish":
      case "onfocus":
      case "onhelp":
      case "onmousedown":
      case "onmouseup":
      case "onmouseover":
      case "onmousemove":
      case "onmouseout":
      case "onkeypress":
      case "onkeydown":
      case "onkeyup":
      case "onload":
      case "onlosecapture":
      case "onpropertychange":
      case "onreadystatechange":
      case "onrowsdelete":
      case "onrowenter":
      case "onrowexit":
      case "onrowsinserted":
      case "onstart":
      case "onscroll":
      case "onbeforeeditfocus":
      case "onactivate":
      case "onbeforedeactivate":
      case "ondeactivate":
      case "type":
      case "codebase":
      case "id":
        ret.objAttrs[args[i]] = args[i+1];
        break;
      case "width":
      case "height":
      case "align":
      case "vspace":
      case "hspace":
      case "class":
      case "title":
      case "accesskey":
      case "name":
      case "tabindex":
        ret.embedAttrs[args[i]] = ret.objAttrs[args[i]] = args[i+1];
        break;
      default:
        ret.embedAttrs[args[i]] = ret.params[args[i]] = args[i+1];
    }
  }
  ret.objAttrs["classid"] = classid;
  if (mimeType) ret.embedAttrs["type"] = mimeType;
  return ret;
}

/* FILE flash_comm.js */

(function () {

    sparks.flash = {};

    sparks.flash.getFlashMovie = function (movieName) {
      var isIE = navigator.appName.indexOf("Microsoft") != -1;
      return (isIE) ? window[movieName] : document[movieName];
    };

    sparks.flash.sendCommand = function () {
      try {
        var params = [];
        for (var i = 0; i < arguments.length; ++i) {
          params[i] = arguments[i];
        }
        var flash = sparks.flash.getFlashMovie(sparks.config.flash_id);
        var retVal = flash.sendMessageToFlash.apply(flash, params).split('|');
        console.log('Returned by flash: ' + retVal);
        if (retVal[0] == 'flash_error') {
          alert('Flash error:\n' + retVal[1]);
        }
      }
      catch (e) {
        alert('Error sending command to Flash:\n' + e.toString());
      }
    };

    this.receiveEvent = function (name, value, time) {
      if (sparks.flash.activity) {
          return sparks.flash.activity.receiveEvent(name, value, time);
      }

      console.log('Received: ' + name + ', ' + value + ', ' + new Date(parseInt(time, 10)));
      var activity = sparks.activity;
      var multimeter = activity.multimeter;
      var wasConnected = multimeter.allConnected();

      if (name == 'connect') {
          var ids = value.split('|');
          if (ids[0] == 'red_probe') {
              multimeter.redProbeConnection = ids[1];
          }
          else if (ids[0] == 'black_probe') {
              multimeter.blackProbeConnection = ids[1];
          }
          else if (ids[0] == 'red_plug') {
              multimeter.redPlugConnection = ids[1];
          }
          else if (ids[0] == 'black_plug') {
              multimeter.blackPlugConnection = ids[1];
          }
          multimeter.update();
          activity.log.add(name, { conn1 : ids[0], conn2 : ids[1] });
          if (multimeter.allConnected()) {
              activity.log.add('make_circuit');
          }
      }
      else if (name == 'disconnect') {
          if (value == 'red_probe') {
              multimeter.redProbeConnection = null;
          }
          else if (value == 'black_probe') {
              multimeter.blackProbeConnection = null;
          }
          else if (value == 'red_plug') {
              multimeter.redPlugConnection = null;
          }
          else if (value == 'black_plug') {
              multimeter.blackPlugConnection = null;
          }
          multimeter.update();
          activity.log.add(name, { value: value});
          if (wasConnected) {
              activity.log.add('break_circuit');
          }
      }
      else if (name == 'multimeter_dial') {
          multimeter.dialPosition = value;
          multimeter.update();
          activity.log.add(name, { value: multimeter.dialPosition });
      }
      else if (name == 'multimeter_power') {
          multimeter.powerOn = value == 'true' ? true : false;
          multimeter.update();
          activity.log.add(name, { value: multimeter.powerOn });
          if (value === 'true' && multimeter.allConnected()) {
              activity.log.add('make_circuit');
          }
          else if (value == 'false' && wasConnected) {
              activity.log.add('break_circuit');
          }
      }
      else if (name == 'not_ready') {
          alert('Sorry, you can only access the circuit after you have answered question #1.');
      }

      return null;
    };

})();

/* FILE util.js */

sparks.util.readCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length,c.length);
        }
    }
    return null;
};

/**
 * Naive deep-cloning of an object.
 * Doesn't check against infinite recursion.
 */
sparks.util.cloneSimpleObject = function (obj) {
    var ret, key;
    if (obj instanceof Array) {
        ret = [];
        for (key in obj) {
            ret.push(sparks.util.cloneSimpleObject(obj[key]));
        }
        return ret;
    }
    else if (typeof obj === 'object') {
        ret = {};
        for (key in obj) {
            ret[key] = sparks.util.cloneSimpleObject(obj[key]);
        }
        return ret;
    }
    else {
        return obj;
    }
};

/*
sparks.util.checkFlashVersion = function () {
    var major = 10;
    var minor = 0;
    var revision = 31;

    if (!DetectFlashVer(10, 0, 33)) {
        var msg = 'This activity requires Flash version ';
        msg += major + '.' + minor + '.' + revision + '. ';

        $('body').html('<p>' + msg + '</p>');
    }
    document.write('<p>Flash version: ' + GetSwfVer() + '</p>');
};
*/

sparks.util.Alternator = function (x, y)
{
    this.x = x;
    this.y = y;
    this.cnt = 0;
};
sparks.util.Alternator.prototype =
{
    next : function () {
        ++this.cnt;
        return this.cnt % 2 == 1 ? this.x : this.y;
    }
};

sparks.util.timeLapseStr = function (start, end) {
    var seconds = Math.floor((end - start) / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    var str = seconds + (seconds == 1 ? ' second' : ' seconds');
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
sparks.util.serializeForm = function (form) {
    var result = {};
    form.map(function () {
        return this.elements ? jQuery.makeArray(this.elements) : this;
    }).filter(function () {
        return this.name &&
        (this.checked || (/select|textarea/i).test(this.nodeName) ||
        (/text|hidden|password|search/i).test(this.type));
    }).each(function (i) {
        var val = jQuery(this).val();
        if(val === null){
            return;
        }

        if (jQuery.isArray(val)) {
            result[this.name] = jQuery.makeArray(val);
        }
        else {
            result[this.name] = val;
        }
    });
    return result;
};

sparks.util.formatDate = function (date) {
    function fillZero(val) {
        return val < 10 ? '0' + val : String(val);
    }
    if (typeof date === 'number') {
        date = new Date(date);
    }
    var s = fillZero(date.getMonth() + 1) + '/';

    s += fillZero(date.getDate()) + '/';
    s += String(date.getFullYear()) + ' ';
    s += fillZero(date.getHours()) + ':';
    s += fillZero(date.getMinutes()) + ':';
    s += fillZero(date.getSeconds()) + ' ';
    return s;
};

sparks.util.prettyPrint = function (obj, indent) {
    var t = '';
    if (typeof obj === 'object') {
        for (var key in obj) {
            if (typeof obj[key] !== 'function') {
                for (var i = 0; i < indent; ++i) {
                    t += ' ';
                }
                t += key + ': ';
                if (typeof obj[key] === 'object') {
                    t += '\n';
                }
                t += sparks.util.prettyPrint(obj[key], indent + 4);
            }
        }
        return t;
    }
    else {
        return obj + '\n';
    }
};

sparks.util.getRubric = function (id, callback, local) {
    var self = this;
    var url;

    if (local) {
        url = 'rubric.json';
    }
    else {
        url = unescape(sparks.util.readCookie('rubric_path') + '/' + id + '.json');
    }
    console.log('url=' + url);
    $.ajax({
        url: url,
        dataType: 'json',
        success: function (rubric) {
            callback(rubric);
        },
        error: function (request, status, error) {
            console.log('Activity#getRubric ERROR:\nstatus: ' + status + '\nerror: ' + error + '\nurl=' + url);
        }
    });
};

sparks.util.shuffle = function (o) {
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

/* FILE activity.js */

(function () {

    sparks.config.root_dir = '../..';

    $(document).ready(function () {
        init();
    });

    this.init = function () {
      console.log('ENTER init');
      try {
          var activity = new sparks.config.Activity();
          activity.learner_id = sparks.util.readCookie('learner_id');
          if (activity.learner_id) {
              var put_path = unescape(sparks.util.readCookie('save_path')) || 'undefined_path';
              console.log('initActivity: learner_id=' + activity.learner_id + ' put_path=' + put_path);
              activity.setDataService(new RestDS(null, null, put_path));
          }
          activity.onDocumentReady();
          activity.onFlashReady();
          sparks.activity = activity;
      }
      catch (e) {
          console.log('ERROR: init: ' + e);
      }
    };

    /*
     * This function gets called from Flash after Flash has set up the external
     * interface. Therefore all code that sends messages to Flash should be
     * initiated from this function.
     */
    this.initActivity = function () {
        console.log("flash loaded");
        sparks.activity.onActivityReady();
    };

    sparks.Activity = function () {

    };

    sparks.Activity.prototype = {

        init: function () {
        },

        setDataService: function () {
        },

        buttonize: function () {
            $('button').button();
        }
    };

})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {
  sparks.SparksActivity = function(){
    sparks.sparksActivity = this;

    sparks.activityLog = new sparks.Activity.ActivityLog();
    sparks.assessment = new sparks.Activity.Assessment();

    this.image = null;
    this.circuit = null;
    this.pages = [];
    this.variables = {};

    this.hide_circuit = false;

    this.activity_url = "";
    this.images_url = "";

    this.view = null;
  };

  sparks.SparksActivity.prototype = {
  };

})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksPage = function(){
    this.questions = [];
    this.notes = null;
    this.view = null;
    this.currentQuestion = null;
  };

  sparks.SparksPage.prototype = {
  };

})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {
  sparks.SparksQuestion = function(){
    this.id = 0;
    this.shownId = 0;

    this.prompt = '';
    this.shortPrompt = '';
    this.correct_answer = null;
    this.answer = '';
    this.correct_units = null;
    this.units = '';
    this.start_time = null;
    this.end_time = null;

    this.options = null;
    this.radio = false;
    this.checkbox = false;

    this.answerIsCorrect = false;
    this.unitsIsCorrect = false;
    this.points = 0;
    this.points_earned = -1;
    this.feedback = null;

    this.isSubQuestion = false;
    this.subquestionId = -1;
    this.commonPrompt = '';

    this.keepOrder = false;

    this.view = null;
  };

  sparks.SparksActivity.prototype = {
  };

})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksActivityView = function(activity){
    this.activity = activity;
  };

  sparks.SparksActivityView.prototype = {

    getImageView: function() {
      var $imagediv = $("<div>").addClass("question-image");
      $imagediv.append(
        $("<img>").attr('src', this.getImgSrc(this.activity.image))
      );
      return $imagediv;
    },

    getImgSrc: function(fileName) {
      if (fileName.indexOf("http") > -1){
        return fileName;
      } else if (!!this.activity.images_url) {
        return this.activity.images_url + "/" + fileName;
      }
      console.log(fileName + " appears to be a relative filename, but there is no base activity url.");
      return "";
    }

  };
})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksPageView = function(page){
    this.page = page;

    this.$view = null;
    this.$questionDiv = null;
    this.$notesDiv = null;
    this.$reportsDiv = null;

    this.questionViews = {};
    this.controller = new sparks.SparksPageController();
  };

  sparks.SparksPageView.prototype = {

    getView: function() {
      var page = this.page;

      var self = this;

      this.$view = $('<div>').addClass('page');

      this.$questionDiv = $('<div>').addClass('inner-questions').css('float', 'left').css('padding', '10px');
      this.$view.append(this.$questionDiv);

      $.each(page.questions, function(i, question){

        var $question = question.view.getView();
        var $form;

        if (!question.isSubQuestion){
          $form = $("<form>");
          $form.addClass("question_form");

          $form.append($question);

          $question.append($("<button>").addClass("submit").text("Submit").css('margin-left', '30px'));

          self.$questionDiv.append($form);
        } else {
          var $subForms = self.$questionDiv.find('.sub'+question.subquestionId);
          if ($subForms.length > 0){
            $form = $($subForms[0]);
          } else {
            $form = $("<form>");
            $form.addClass("question_form");
            $form.addClass("sub"+question.subquestionId);

            $form.append($("<span>").addClass("prompt").html((question.shownId+1) + ".  " + question.commonPrompt));

            $form.append($("<div>").addClass("subquestions"));

            $form.append($("<button>").addClass("submit").text("Submit").css('align', 'right'));

            self.$questionDiv.append($form);
          }

          $form.find('.subquestions').append($question);
        }

        $form.find('.submit').unbind('click');          // remove any previously-added listeners
        $form.find('.submit').click(function (event) {
          event.preventDefault();
          self.submitButtonClicked(event);
        });

        self.questionViews[question.id] = $form;
      });

      if (!!page.notes){
        this.$notesDiv = $('<div>').addClass('notes').css('float','right');
        this.$notesDiv.html(page.notes);
        this.$view.append(this.$notesDiv);
      }

      this.enableQuestion(page.currentQuestion);

      return this.$view;
    },

    clear: function() {
      if (!!this.$questionDiv) {this.$questionDiv.html('');}
      if (!!this.$notesDiv) {this.$notesDiv.html('');}
      if (!!this.$reportsDiv) {this.$reportsDiv.html('');}
      if (!!this.$view) {this.$view.html('');}
    },

    enableQuestion: function (question) {
      var self = this;
      $.each(self.questionViews, function(questionKey, view){
        self.enableView(view, false);
      });
      self.enableView(self.questionViews[question.id], true);
    },

    enableView: function($view, enable) {
      $view.find('input, select, button').attr('disabled', !enable);
      $view.css("background-color", enable ? "rgb(253,255,184)" : "");
    },

    showReport: function($table){

      var ac = new sparks.SparksActivityController();

      this.$questionDiv.hide();
      if (!!this.$notesDiv) {this.$notesDiv.hide();}

      this.$reportDiv = $('<div>').addClass('report').css('float', 'left').css('padding-top', '15px').css('padding-left', '40px');
      this.$reportDiv.append($table);

      var allCorrect = true;
      $.each(this.page.questions, function(i, question){
        if (!question.answerIsCorrect){
          allCorrect = false;
        }
      });

      var areMorePage = !!ac.areMorePage();

      var comment = allCorrect ? "You got all the questions correct!"+(areMorePage ? " Move on to the next page." : "") :
                              "You can get a higher score these questions. You can repeat the page by clicking the " +
                              "<b>Repeat</b> button" + (areMorePage ? ", or move on to the next page." : ".");
      this.$reportDiv.append($("<div>").html(comment).css('width', 700).css('padding-top', "20px"));

      var $buttonDiv = $("<div>").css("padding", "20px").css("text-align", "center");

      var $repeatButton = $("<button>").text("Repeat").css('padding-left', "10px")
                          .css('padding-right', "10px").css('margin-right', "10px");
      var $nextPageButton = $("<button>").text("Next Page »").css('padding-left', "10px")
                          .css('padding-right', "10px").css('margin-left', "10px");

      $repeatButton.click(function(evt){
        ac.repeatPage();
      });

      $nextPageButton.click(function(evt){
        ac.nextPage();
      });

      if (!!ac.areMorePage()){
        $buttonDiv.append($repeatButton, $nextPageButton);
      } else {
        $buttonDiv.append($repeatButton);
      }
      this.$reportDiv.append($buttonDiv);

      this.$view.append(this.$reportDiv);
    },

    submitButtonClicked: function (event) {
      this.controller.completedQuestion(this.page);
    }

  };
})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksQuestionView = function(question){
    this.question = question;
    this.$view = null;
  };

  sparks.SparksQuestionView.prototype = {

    getView: function() {
      var question = this.question;

      var $question = $("<div>").addClass("question");

      if (!!question.image){
        var $div = $("<div>").addClass("question-image");
        $div.append(
          $("<img>").attr('src', this._getImgSrc(question.image))
        );
        $question.append($div);
      }

      var prompt = question.isSubQuestion ? question.prompt : (question.shownId+1) + ".  " + question.prompt;

      $question.append(
        $("<span>").addClass("prompt").html(prompt), "   "
      );

      var self = this;

      if (!question.options){
        var $input = $("<input>").attr("id",question.id+"_input");
        $question.append($input);
        $input.change(function(args){
          self.valueChanged(args);
        });
      } else {
        if (!!question.checkbox || !!question.radio){
          $.each(question.options, function(i,answer_option){
            if (!answer_option.option){
            } else {
              answer_option = answer_option.option;
            }

            var type = question.checkbox ? "checkbox" : "radio";

            var groupName = type + "Group" + question.id;

            $question.append($("<br>"));
            var $input = $("<input>").attr("type", type).attr("name", groupName).attr("value", answer_option);
            $question.append($input);
            $question.append("<span> " + answer_option + "</span>");

            $input.change(function(args){
              self.valueChanged(args);
            });
          });
          $question.append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        } else {
          var $select = $("<select>").attr("id",question.id+"_options");

          $select.append($("<option>").attr("value", "").html("").attr("defaultSelected",true));

          console.log("question.keepOrder = "+question.keepOrder);
          if (!question.keepOrder){
            question.options = sparks.util.shuffle(question.options);
          }

          $.each(question.options, function(i,answer_option){
            if (!answer_option.option){
              answer_option = sparks.mathParser.calculateMeasurement(answer_option);
            } else {
              answer_option = sparks.mathParser.calculateMeasurement(answer_option.option);
            }
            $select.append($("<option>").attr("value", answer_option).html(answer_option).attr("defaultSelected",false));
          });
          $question.append($select, "   ");
          $select.change(function(args){
            self.valueChanged(args);
          });
        }
      }

      if (!!question.correct_units){
         var $unitsSelect = $("<select>").attr("id", question.id+"_units");
         var options = ["Units...","&#x00b5;V","mV","V","&#x2126;","k&#x2126;","M&#x2126;","&#x00b5;A","mA","A"];
         $.each(options, function(i, val){
           $unitsSelect.append($("<option>").html(val).attr("defaultSelected", i===0));
         });
         $question.append($unitsSelect, "   ");
      }

      return $question;
    },

    _getImgSrc: function(fileName) {
      if (fileName.indexOf("http") > -1){
        return fileName;
      } else if (!!this.jsonActivity.images_url) {
        return this.jsonActivity.images_url + "/" + fileName;
      }
      console.log(fileName + " appears to be a relative filename, but there is no base activity url.");
      return "";
    },

    valueChanged: function(args) {
      var value = $(args.target).val();
      this.question.answer = value;
    }

  };

})();

/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksActivityControllerCurrentPage = null;
  sparks.SparksActivityControllerCurrentPageIndex = -1;

  sparks.SparksActivityController = function(){
    this.currentPage = null;
  };

  sparks.SparksActivityController.prototype = {

    createActivity: function(jsonActivity) {
      var activity = new sparks.SparksActivity();

      if (!!jsonActivity.activity_url){
        activity.activity_url = jsonActivity.activity_url;
      } else {
        activity.activity_url = sparks.jsonActivity.activity_url;
      }

      if (!!jsonActivity.images_url){
        activity.images_url = jsonActivity.images_url;
      } else {
        activity.images_url = sparks.jsonActivity.images_url;
      }

      activity.image = jsonActivity.image;

      if (!!jsonActivity.circuit){
        activity.circuit = jsonActivity.circuit;
        breadModel("createCircuit", activity.circuit);
      }

      activity.hide_circuit = !!jsonActivity.hide_circuit;


      if (!!jsonActivity.pages){
        var pc = new sparks.SparksPageController();

        $.each(jsonActivity.pages, function(i, jsonPage){
          var page = pc.createPage(jsonPage);
          activity.pages.push(page);
        });

        if (sparks.SparksActivityControllerCurrentPageIndex == -1){
          sparks.SparksActivityControllerCurrentPageIndex = 0;
        }
        sparks.SparksActivityControllerCurrentPage = activity.pages[sparks.SparksActivityControllerCurrentPageIndex];
      }

      if (!!jsonActivity.formulas){
        $.each(this.jsonActivity.formulas, function(i, formula){
          var variables = {};
          var variable = formula.match(/.* =/)[0];
          variable = variable.substring(0,variable.length-2);
          formula = "variables."+formula;
          eval(formula);
          var value = variables[0];
          this.sparksActivity.variables[variable] = value;
        });
      }

      activity.view = new sparks.SparksActivityView(activity);

      return activity;
    },

    areMorePage: function() {
      var nextPage;
      for (var i = 0; i < sparks.sparksActivity.pages.length-1; i++){
        if (sparks.sparksActivity.pages[i] == sparks.SparksActivityControllerCurrentPage){
          nextPage = sparks.sparksActivity.pages[i+1];
        }
      }
      if (!nextPage){
        return false;
      }
      return nextPage;
    },

    nextPage: function() {
      var nextPage = this.areMorePage();
      if (!nextPage){
        console.log("No more pages");
      }
      sparks.SparksActivityControllerCurrentPageIndex = sparks.SparksActivityControllerCurrentPageIndex+1;
      sparks.SparksActivityControllerCurrentPage = nextPage;
      sparks.activityContstructor.layoutPage();
    },

    repeatPage: function() {
      console.log("repeating page");
      console.log("this.currentPage = "+this.currentPage);
      $('#breadboard').html('');
      sparks.SparksActivityControllerCurrentPage.view.clear();

      if (!sparks.jsonActivity.hide_circuit){
        breadModel('clear');
        sparks.flash.activity.loadFlash();
      } else {
        sparks.flash.activity.onActivityReady();
      }
    }

  };
})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksPageController = function(){
    this.qc = new sparks.SparksQuestionController();
  };

  sparks.SparksPageController.prototype = {

    createPage: function(jsonPage) {
      var page = new sparks.SparksPage();

      page.questions = this.qc.createQuestionsArray(jsonPage.questions);
      page.currentQuestion = page.questions[0];

      if (!!jsonPage.notes){
        var notes = sparks.mathParser.calculateMeasurement(jsonPage.notes);
        page.notes = notes;
      }

      page.view = new sparks.SparksPageView(page);

      return page;
    },

    enableQuestion: function(page, question) {
      page.view.enableQuestion(question);
    },

    completedQuestion: function(page) {
      for (var i = 0; i < page.questions.length; i++){
        if (page.questions[i] === page.currentQuestion){
          if (i < page.questions.length - 1){
            page.currentQuestion = page.questions[i+1];
            if (page.currentQuestion.isSubQuestion){
              var subquestionId = page.currentQuestion.subquestionId;
              i++;
              while (i < page.questions.length && page.questions[i].isSubQuestion &&
                  page.questions[i].subquestionId == subquestionId){
                page.currentQuestion = page.questions[i];
                i++;
              }
            }
            this.enableQuestion(page, page.currentQuestion);
            return;
          } else {
            this.showReport(page);
            return;
          }
        }
      }
    },

    showReport: function(page){
      console.log("showing report")
      var $report = this.createReportForPage(page);
      page.view.showReport($report);
    },

    createReportForPage: function(page) {
      var self = this;
      $.each(page.questions, function(i, question){
        self.qc.gradeQuestion(question);
      });

      var $report = $('<table>').addClass('reportTable');

      $report.append(
        $('<tr>').append(
          $('<th>').text("Question"),
          $('<th>').text("Your answer"),
          $('<th>').text("Correct answer"),
          $('<th>').text("Score"),
          $('<th>').text("Notes")
        )
      );

      var totalScore = 0;
      var totalPossibleScore = 0;

      $.each(page.questions, function(i, question){
        var answer = !!question.answer ? question.answer + (!!question.units ? " "+question.units : '') : '';
        var correctAnswer = question.correct_answer + (!!question.correct_units ? " "+question.correct_units : '');
        var score = question.points_earned;
        totalScore += score;
        totalPossibleScore += question.points;
        var feedback = "";


        if(!question.feedback){
        	if (answer === '') {

        	} else if (!question.answerIsCorrect){
        	  feedback += "The value was wrong";
        	}
        } else {
          feedback = question.feedback;
        }

        $report.append(
          $('<tr>').append(
            $('<td>').html(question.shortPrompt),
            $('<td>').html(answer),
            $('<td>').html(correctAnswer),
            $('<td>').html(score +"/" + question.points),
            $('<td>').html(feedback)
          ).addClass(question.answerIsCorrect ? "correct" : "incorrect")
        );
      });

      $report.append(
        $('<tr>').append(
          $('<th>').text("Total Score:"),
          $('<th>').text(""),
          $('<th>').text(""),
          $('<th>').text(totalScore + "/" + totalPossibleScore),
          $('<th>').text("")
        )
      );

      return $report;
    }

  };
})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {

  sparks.SparksQuestionController = function(){
  };

  sparks.SparksQuestionController.prototype = {

    createQuestionsArray: function(jsonQuestions) {
      var questionsArray = [];
      var self = this;
      $.each(jsonQuestions, function(i, jsonQuestion){
        self.createQuestion(jsonQuestion, questionsArray);
      });

      return questionsArray;
    },

    _id: 0,

    _subquestionId: 0,

    _shownId: 0,

    createQuestion: function(jsonQuestion, questionsArray) {
      var self = this;


      function addSingleQuestion(jsonQuestion, preprompt){
        var question = new sparks.SparksQuestion();

        question.id = self._id;
        question.shownId = self._shownId;
        self._id++;

        var oldPrompt = jsonQuestion.prompt;
        if (!!preprompt){
          question.prompt = preprompt + " " + jsonQuestion.prompt;
          question.commonPrompt = preprompt;
          question.isSubQuestion = true;
          question.subquestionId = self._subquestionId;
        } else {
          question.prompt = jsonQuestion.prompt;
        }

        question.shortPrompt = !!jsonQuestion.shortPrompt ? jsonQuestion.shortPrompt : question.prompt;

        function html_entity_decode(str) {
          return $("<div>").html(str).text();
        }

        if (!!jsonQuestion.correct_units){
          question.correct_answer = sparks.mathParser.calculateMeasurement(jsonQuestion.correct_answer);
          if (!isNaN(Number(question.correct_answer))){
            var converted = sparks.unit.toEngineering(question.correct_answer, jsonQuestion.correct_units);
            question.correct_answer = converted.value;
            question.correct_units = sparks.mathParser.standardizeUnits(converted.units);
          }
        } else if (!!jsonQuestion.correct_answer){
          question.correct_answer = sparks.mathParser.calculateMeasurement(jsonQuestion.correct_answer);
        }

        if (!!question.correct_units){
          question.correct_units = question.correct_units.replace("ohms",html_entity_decode("&#x2126;"));
        }

        if (!!jsonQuestion.options){
          question.options = [];
          $.each(jsonQuestion.options, function(i, choice){
            question.options[i] = {};
            if (!!jsonQuestion.options[i].option){
              question.options[i].option = ""+jsonQuestion.options[i].option;
              question.options[i].option = sparks.mathParser.calculateMeasurement(question.options[i].option);
              question.options[i].points = jsonQuestion.options[i].points | 0;
            } else {
              question.options[i] = sparks.mathParser.calculateMeasurement(choice);
            }
          });
          if (jsonQuestion.radio){
            question.radio = true;
          } else if (jsonQuestion.checkbox){
            question.checkbox = true;
          }
          if (jsonQuestion.keepOrder){
            question.keepOrder = true;
          }
        }

        question.points = (jsonQuestion.points | 0);
        question.image = jsonQuestion.image;

        questionsArray.push(question);
        sparks.assessment.questions.push(question);

        question.prompt = oldPrompt;

        question.view = new sparks.SparksQuestionView(question);
      }

      if (!jsonQuestion.subquestions){
        addSingleQuestion(jsonQuestion);
      } else {
        $.each(jsonQuestion.subquestions, function(i, subquestion){
          addSingleQuestion(subquestion, jsonQuestion.prompt);
        });
        this._subquestionId++;
      }
      this._shownId++;
    },

    gradeQuestion: function(question) {
      if (!question.options || !question.options[0].option) {
        if (question.answer === question.correct_answer){
          question.answerIsCorrect = true;
          question.points_earned = question.points;
        } else {
          question.answerIsCorrect = false;
          question.points_earned = 0;
        }
      } else {
        var maxPoints = 0;
        $.each(question.options, function(i, option){
          if (option.option === question.answer){
            question.points_earned = option.points;
            question.feedback = option.feedback;
          }
          var points = option.points;
          if (points > maxPoints){
            maxPoints = points;
            question.points = points;
            question.correct_answer = option.option;
          }
        });
        if (question.points_earned == maxPoints){
          question.answerIsCorrect = true;
        }
      }
      if (question.points_earned < 0) question.points_earned = 0;

    }

  };
})();
/*globals console sparks $ breadModel getBreadBoard */

(function() {
  sparks.ActivityConstructor = function(jsonActivity){
    this.sparksActivityController = new sparks.SparksActivityController();
    this.activity = this.sparksActivityController.createActivity(jsonActivity);

    this.jsonActivity = jsonActivity;

    this.embeddingTargets = {
      $breadboardDiv: null,
      $imageDiv: null,
      $questionsDiv: null
    };
    sparks.activityContstructor = this;

  };

  sparks.ActivityConstructor.prototype = {

    layoutActivity: function() {
      console.log("THIS IS OBSOLETE. USE layoutActivity");
    },

    setEmbeddingTargets: function(targets) {
      if (!!targets.$breadboardDiv){
        this.embeddingTargets.$breadboardDiv = targets.$breadboardDiv;
      }
      if (!!targets.$imageDiv){
        this.embeddingTargets.$imageDiv = targets.$imageDiv;
      }
      if (!!targets.$questionsDiv){
        this.embeddingTargets.$questionsDiv = targets.$questionsDiv;
      }
    },

   layoutActivity: function() {
     if (!this.embeddingTargets.$imageDiv){
         this.embeddingTargets.$imageDiv = $('#image');
      }
     if (!this.embeddingTargets.$questionsDiv){
        this.embeddingTargets.$questionsDiv = $('#questions_area');
     }

     if (!!this.activity.image){
       var $imagediv = this.activity.view.getImageView();
       this.embeddingTargets.$imageDiv.append($imagediv);
     }

     this.layoutPage();
   },

   layoutPage: function() {
     if (!!sparks.SparksActivityControllerCurrentPage){
        this.embeddingTargets.$questionsDiv.html('');
        var $page = sparks.SparksActivityControllerCurrentPage.view.getView();
        this.embeddingTargets.$questionsDiv.append($page);
      }
   }
  };
})();
(function () {

    this.sparks.mathParser = {};

    var p = sparks.mathParser;

    p.calculateMeasurement = function(answer2){
      if (answer2 === undefined || answer2 === null || answer2 === ""){
        return "";
      }
      if (!isNaN(Number(answer2))){
        return answer2;
      }

      answer = ""+answer2;

      var sumPattern = /\[[^\]]+\]/g  // find anything between [ ]
      var matches= answer.match(sumPattern);
      if (!!matches){
        $.each(matches, function(i, match){
          var expression = match;
          var result = p.calculateSum(expression);
          answer = answer.replace(match,result);
        });
      }


      answer = sparks.unit.convertMeasurement(answer);   // convert 1000 V to 1 kiloV, for instance

      answer = p.standardizeUnits(answer);

      return answer;
    };

    p.standardizeUnits = function(string) {
      string = string.replace(/ohms/gi,"&#x2126;");
      string = string.replace("micro","&#x00b5;");
      string = string.replace("milli","m");
      string = string.replace("kilo","k");
      string = string.replace("mega","M");
      return string;
    };


    /*
      When passed a string such as "100 + ${r1.resistance} / ${r2.nominalResistance}"
      this will first substitute the actual values of the variables in ${...}, assuming
      the components and their properties exist in the circuit, and then perform the
      calculation.
    */
   p.calculateSum = function(sum){
   	  var varPattern = /\${[^}]+}/g  //  ${ X } --> value of X
      var matches = sum.match(varPattern);
      if(!!matches){
       $.each(matches, function(i, match){
        var variable = match.substring(2,match.length-1).split('.');
        var component = variable[0];
        var property = variable[1];

        var components = getBreadBoard().components;

        if (!components[component]){
          console.log("ERROR calculating sum: No component name '"+component+"' in circuit");
          sum = -1;
          return;
        }

        if (components[component][property] === undefined || components[component][property] === null){
          console.log("ERROR calculating sum: No property name '"+property+"' in component '"+component+"'");
          sum = -1;
          return;
        }

        var value = components[component][property];
        console.log("Got a new value: "+value)
        sum = sum.replace(match, value);
       });
      }

      var calculatedSum = eval(sum);
      if (!isNaN(Number(calculatedSum))){
        return calculatedSum;
      }

      console.log("ERROR calculating Sum: Cannot compute the value of "+sum);
      return -1;
   };


})();

/* FILE string.js */

(function () {

    this.sparks.string = {};

    var str = sparks.string;

    str.strip = function (s) {
        s = s.replace(/\s*([^\s]*)\s*/, '$1');
        return s;
    };

    str.stripZerosAndDots = function (s) {
        s = s.replace('.', '');
        s = s.replace(/0*([^0].*)/, '$1');
        s = s.replace(/(.*[^0])0*/, '$1');
        return s;
    };

    str.stripZeros = function (s) {
        s = s.replace(/0*([^0].*)/, '$1');
        s = s.replace(/(.*[^0])0*/, '$1');
        return s;
    };


})();

/* FILE ui.js */

(function () {

    this.sparks.ui = {};

    sparks.ui.alert = function (title, msg) {
        var div = $('<div>' + msg + '</div>').attr('title', title);
        var okButton = $('<button>OK</button>)').button().addClass('dialog_button');
        okButton.click(function (event) {
            div.dialog('close');
        });
        div.append($('<p />')).append(okButton);
        div.dialog({ dialogClass: 'alert', modal: true });
    };

})();
/* FILE qucsator.js */

(function () {

  this.sparks.circuit.qucsator = {};
  var q = sparks.circuit.qucsator;

  var inGroupsOf = function (ary, n) {
    var grouped = [];
    for(i in ary) {
      if (!grouped[Math.floor(i / 3)]) { grouped[Math.floor(i / 3)] = []; }
      grouped[Math.floor(i / 3)][i % 3] = ary[i];
    }
    return grouped;
  };

  q.qucsate = function (netlist, callback, type) {
    type = type || 'qucs';
    var data = {};
    data[type || 'qucs'] = netlist;
    $.ajax({
        async: false,
        url: sparks.config.qucsate_server_url,
        data: data,
        success: q.parser(callback),
        error: function (request, status, error) {
                  debug('ERROR: url=' + sparks.config.qucsate_server_url + '\nstatus=' + status + '\nerror=' + error);
              }
    });
  };


  q.parser = function(callback) {
    return(function(data) {
      var results = {};

      if ( data.result ) { data = data.result; }

      var chunks = data.split("\n");
      chunks = inGroupsOf(chunks.slice(1, chunks.length - 1), 3);
      for (var i in chunks) {
        var key = /<indep (.+)\./.exec(chunks[i][0]);
        key = key && key[1];
        if(key) {
          results[key] = parseFloat(chunks[i][1]);
        }
      }
      callback(results);
    });
  };

  q.makeNetlist = function(board) {
    var netlist = '# QUCS Netlist\n';
    $.each(board.components, function(name, component) {
      var line = '';

      var nodes = [];
      $.each(component.connections, function(i, hole){
        nodes.push(hole.nodeName());
      });

      switch (component.kind) {
        case "resistor":
          if (!(nodes.length == 2 && component.UID)) { return; }
          var resistance = !component.resistance ? 0 : component.resistance;
          line = 'R:' + component.UID + ' ';
          line = line + nodes.join(' ');
          line = line + ' R="' + component.resistance + ' Ohm"' ;
          break;
        case "wire":
          if (!(nodes.length == 2 && component.UID)) { return; }
          line = 'TLIN:' + component.UID + ' ';
          line = line + nodes.join(' ');
          line = line + ' Z="0 Ohm" L="1 mm" Alpha="0 dB"' ;
          break;
        case "battery":
          if (!(nodes.length == 2 && component.voltage && component.UID)) { return; }
          line = 'Vdc:' + component.UID + ' ';
          line = line + nodes.join(' ');
          line = line + ' U="' + component.voltage + ' V"' ;
          break;
        case "vprobe":
          if (!(nodes.length == 2 && component.UID)) { return; }
          line = 'VProbe:' + component.UID + ' ';
          line = line + nodes.join(' ');
          break;
        case "iprobe":
          if (!(nodes.length == 2 && component.UID)) { return; }
          line = 'IProbe:' + component.UID + ' ';
          line = line + nodes.join(' ');
          break;

      }

      netlist = netlist + "\n" + line;
    });
    return netlist + "\n.DC:DC1";
  };

  q.ppNetlist = function (s) {
      return s.replace('\\u000a', '\n');
  };

})();

/* FILE breadboard.js */

(function () {

    var q = sparks.circuit.qucsator;


      var defs = {
        rows            : 31,
        powerRailHoles  : 25,
        debug           : true
      };


      var remove = function(array, from, to) {
        var rest = array.slice((to || from) + 1 || array.length);
        array.length = from < 0 ? array.length + from : from;
        return array.push.apply(array, rest);
      };

      var HTMLLog = undefined, HTMLbody = undefined;
      this.debug = function(){
      };


      this.Resistor = {
        colorMap : { '-1': 'gold', '-2': 'silver',
            0 : 'black', 1 : 'brown', 2 : 'red', 3 : 'orange',
            4 : 'yellow', 5 : 'green', 6 : 'blue', 7 : 'violet', 8 : 'grey',
            9 : 'white' },
        toleranceColorMap : { 0.01 : 'brown', 0.02 : 'red', 5e-3 : 'green',
            2.5e-3 : 'blue', 1e-3 : 'violet', 5e-4 : 'gray', 5e-2 : 'gold',
            0.1 : 'silver', 0.2 : 'none' },
        getColors4Band: function (ohms, tolerance) {
            var s = ohms.toString();
            var decIx = s.indexOf('.');
            var decLoc = decIx > -1 ? decIx : s.length;
            s = s.replace('.', '');
            var len = s.length;
            for (var i = 0; i < 2 - len; ++i){ s += '0'; }
            var mult = decLoc > 1 ? decLoc - 2 : 10;
            return [ this.colorMap[s.charAt(0)],
                     this.colorMap[s.charAt(1)],
                     this.colorMap[decLoc - 2],
                     this.toleranceColorMap[tolerance]
                   ];
        },
        getColors5Band: function (ohms, tolerance) {
            var s = ohms.toString();
            var decIx = s.indexOf('.');
            var decLoc = decIx > -1 ? decIx : s.length;
            s = s.replace('.', '');
            var len = s.length;
            for (var i = 0; i < 3 - len; ++i) { s += '0'; }
            return [ this.colorMap[s.charAt(0)],
                     this.colorMap[s.charAt(1)],
                     this.colorMap[s.charAt(2)],
                     this.colorMap[decLoc - 3],
                     this.toleranceColorMap[tolerance]
                   ];
        },
        colorToNumber: function (color) {
          for (n in Resistor.colorMap) {
            if (Resistor.colorMap[n] == color) { return parseInt(n); }
          }
          if (color == "gray") return 8;
          return null;
        },
        getResistance: function(colors){
          if (typeof(colors)==="string"){
            colors = colors.split(",");
          }
          var resistance = Resistor.colorToNumber(colors[0]);
          for (var i = 1; i < colors.length - 2; i++) {
            resistance = resistance * 10;
            resistance += Resistor.colorToNumber(colors[i]);
          }
          return resistance * Math.pow(10, Resistor.colorToNumber(colors[i]));
        }
      };


      this.breadBoard = {};

      var Hole = function Hole( strip, name ){
        this.type ='hole';
        this.strip = strip;
        this.name = name;
        this.connections = [];
        return this;
      };

      Hole.prototype.nodeName = function() {
        return this.strip && this.strip.name;
      };

      Hole.prototype.getName = function() {
        return this.name;
      };

      var GhostHole = function GhostHole(name) {
        this.name = !!name ? name : interfaces.getUID('node');
        return this;
      };

      GhostHole.prototype.nodeName = function() {
        return this.name;
      };

      GhostHole.prototype.getName = function() {
        return this.name;
      };

      var Strip = function Strip( holes, name ){
        this.type ='strip';
        this.holes={};
        this.name = name;
        if (holes) {
          for (var i=0, l=holes; i < l; i++) {
            this.holes[''+i] = new Hole();
            this.holes[''+i].strip = this;
          }
        }
        return this;
      };

      var Breadboard = function Breadboard(){
        var i;
        this.type ='Breadboard';

        this.powerRail = { // I was told these were called power-rails
          left:{
            positive: new Strip( null, "powerPosL"),
            negative: new Strip( null, "powerNegL")
          },
          right:{
            positive: new Strip( null, "powerPosR" ),
            negative: new Strip( null, "powerNegR" )
          }
        };

        for (i=0, l=defs.powerRailHoles; i < l; i++) {
          for (side in this.powerRail) {
            for (sign in this.powerRail[side]) {
              var h = side + '_' + sign + i;
              this.powerRail[side][sign][h] = this.holes[h] = new Hole(this.powerRail[side][sign], h);
            }
          }
        }

        for (i=0, l=defs.rows; i < l; i++) {
          newStripL = this.makeStrip("L" + i);
          newStripR = this.makeStrip("R" + i);
          for (var a=0, ll=5; a < ll; a++ ) {
            var mapCode = String.fromCharCode(a+97)+i;
            newStripL.holes[mapCode] = this.holes[ mapCode ] = new Hole( newStripL, mapCode );
            mapCode = String.fromCharCode(a+102)+i;
            newStripR.holes[mapCode] = this.holes[ mapCode ] = new Hole( newStripR, mapCode );
          }
        }
        return this;
      };

      Breadboard.prototype.strips=[];
      Breadboard.prototype.components={};
      Breadboard.prototype.holes={};
      Breadboard.prototype.holeMap={};  // map of holes where one replaces the other, e.g. {a1: 'newGhostHole'}

      Breadboard.prototype.makeStrip = function (name) {
        var stripLen = this.strips.length;
        this.strips[ stripLen ] = new Strip(null, name);
        return this.strips[ stripLen ];
      };

      Breadboard.prototype.component = function (props) {
        if(typeof props=='string'){
          return this.components[props];
        }else {
          return new Component(props);
        }
      };

      Breadboard.prototype.clear = function () {
        var destroyed = 0;
        for( k in this.components ){
          destroyed += !!this.component(k).destroy();
        }
        this.components = {};
        return !!destroyed;
      };

      Breadboard.prototype.getHole = function(hole) {
        if (hole.name){
          if (!!this.holeMap[hole.name]){
            return this.getHole(this.holeMap[hole.getName()]);
          }
          return hole;
        }


        if (!!this.holeMap[hole]){
          hole = this.holeMap[hole]
        }

        if (!!this.holes[hole]){
          return this.holes[hole];
        }

        return new GhostHole(hole);

      };

      Breadboard.prototype.resetConnections = function(oldHoleName, newHoleName) {
        for( i in this.components ){
          var comp = this.component(i);
          for (j in comp.connections){
            if (!!comp.connections[j] && comp.connections[j].getName() === oldHoleName) {
              comp.connections[j] = this.getHole(newHoleName);
            }
          }
        }
      };

      var Component = function (props) {
        var i;
        for (i in props) {
          this[i]=props[i];
        }
        this.breadBoard = breadBoard;
        this.breadBoard.components[props.UID] = this;

        this.connections=[];
        for (i in props.connections) {
          this.connections[i] = this.breadBoard.getHole(props.connections[i]);

          if (!!this.breadBoard.holes[props.connections[i]]) {
            this.breadBoard.holes[props.connections[i]].connections[this.breadBoard.holes[props.connections[i]].connections.length] = this;
          }
        }

        return this;
      };

      Component.prototype.move = function (connections) {
        var i;
        for (i in this.connections) {
          for (var j in this.connections[i].connections) {
            if (this.connections[i].connections[j] === this) {
              this.connections[i].connections = [];
            }
          }
          this.connections[i] = [];
        }
        this.connections = [];
        for (i in connections){
          this.connections[i] = this.breadBoard.holes[connections[i]];
          this.breadBoard.holes[connections[i]].connections[this.breadBoard.holes[connections[i]].connections.length] = this;
        }
        return this;
      };

      Component.prototype.destroy = function destroy(){
        for(var i in this.connections){
          for( var j in this.connections[i].connections ){
            if( this.connections[i].connections[j] === this ){
              this.connections[i].connections = [];
            }
          }
          this.connections[i] = [];
        }
        this.connections = [];
        return delete this.breadBoard.components[this.name];
      };

      var breadBoard = new Breadboard();

      var interfaces = {
        insertComponent: function(kind, properties){
          var props = {};
          $.each(properties, function(key, property){
            props[key] = property;
          });

          props.kind = kind;

          props.UID = interfaces.getUID(!!props.UID ? props.UID : props.kind);

          if (!props.label){
            props.label = !!props.UID.split("/")[1] ? props.UID.split("/")[1] : null;
          }

          if (typeof(props.connections) === "string"){
            props.connections = props.connections.split(",");
          }

          function ensureInt(val){
            if (!!props[val] && typeof(props[val]) === "string")
              props[val] = parseInt(props[val]);
          }

          ensureInt("resistance");
          ensureInt("voltage");

          switch(kind) {
            case "resistor":
              console.log(" creating new resistor, "+props.nominalResistance+", "+props.resistance)
              if ((props.resistance === undefined) && props.colors){
                props.resistance = Resistor.getResistance( props.colors );
              }

              if ((props.resistance === undefined) && !props.colors) {
                var resistor = new sparks.circuit.Resistor4band(name);
                resistor.randomize(null);
                props.resistance = resistor.getRealValue()
                props.colors = resistor.colors;
              }

              if (!props.colors){
                props.colors = Resistor.getColors4Band( props.resistance, (!!props.tolerance ? props.tolerance : 0.05));
              }

              props.nominalResistance =  Resistor.getResistance( props.colors );
              console.log("    created new resistor, "+props.nominalResistance)
          }

          var newComponent;
          newComponent = breadBoard.component(props);
          return newComponent.UID;
        },
        createCircuit: function(jsonCircuit){
          $.each(jsonCircuit, function(i, spec){
            interfaces.insertComponent(spec.type, spec);
          });
        },
        insert: function(type, connections){
          console.log("WARNING: 'insert' is deprecated. Use 'insertComponent'");
          var props = {
            UID         : interfaces.getUID(type),
            kind        : type,
            connections : connections.split(",")
          };

          switch(props.kind) {
            case "resistor":
              if (typeof(arguments[2])==="string") {
                props.resistance = Resistor.getResistance( arguments[2].split(",") );
                props.colors = arguments[2];
              }
              else if (typeof(arguments[2])=="number") {
                props.resistance = arguments[2];
                props.colors = Resistor.getColors4Band( arguments[2], 0.01);
              }

              if (!!arguments[4]) {
                props.colors = arguments[4].toString();
              }

              if (typeof(arguments[3])==="string") {
                props.UID = arguments[3].split("/")[0];
                props.label = !!arguments[3].split("/")[1] ? arguments[3].split("/")[1] : null;
              }
              break;
            case "wire":
              break;
            case 'battery':
              props.voltage = arguments[2];
              break;
          }
          var newComponent;
          newComponent = breadBoard.component(props);
          return newComponent.UID;
        },
        getUID: function(name){
          if (!breadBoard.components[name]){
            return name;
          }

          var i = 0;
          while (!!breadBoard.components[""+name+i]){
            i++;
          }
          return ""+name+i;
        },
        remove: function(type, connections){
          var comp = interfaces.findComponent(type, connections)
          if (!!comp){
            comp.destroy();
          }
        },
        findComponent: function(type, connections){
          if (!!type && !!connections && connections.split(",").length === 2){
            connections = connections.split(",");
            for (i in breadBoard.components){
              var component = breadBoard.components[i];
              if (component.kind === type && !!component.connections[0] &&
                ((component.connections[0].getName() === connections[0]
                && component.connections[1].getName() === connections[1]) ||
                (component.connections[0].getName() === connections[1]
                  && component.connections[1].getName() === connections[0]))){
                  return component;
                }
            }
          }
          return null;
        },
        destroy: function(component){
          breadBoard.component(component).destroy();
        },
        clear: function() {
          breadBoard.clear();
        },
        move: function(component, connections){
          breadBoard.component(component).move(connections.split(','));
        },
        getGhostHole: function(name){
          return new GhostHole(name);
        },
        mapHole: function(oldHoleName, newHoleName){
          breadBoard.holeMap[oldHoleName] = newHoleName;
          breadBoard.resetConnections(oldHoleName, newHoleName);
        },
        unmapHole: function(oldHoleName){
          var newHoleName = breadBoard.holeMap[oldHoleName];
          breadBoard.holeMap[oldHoleName] = undefined;
          breadBoard.resetConnections(newHoleName, oldHoleName);
        },
        addRandomResistor: function(name, location, options){
          var resistor = new sparks.circuit.Resistor4band(name);
          resistor.randomize((options | null));
          interfaces.insert('resistor', location, resistor.getRealValue(), name, resistor.colors);
          return resistor;
        },
        query: function(type, connections){



          var tempComponents = [];

          if (type === 'resistance') {
            connections = connections.split(',');
            var ghost = new GhostHole();
            var ohmmeterBattery = breadBoard.component({
              UID: 'ohmmeterBattery',
              kind: 'battery',
              voltage: 1,
              connections: [connections[0], ghost]});
            var currentProbe = breadBoard.component({
              UID: 'meter',
              kind: 'iprobe',
              connections: [ghost, connections[1]]});
            tempComponents.push(ohmmeterBattery, currentProbe);
          } else {
            if (type === 'voltage'){
              var voltmeterResistor = breadBoard.component({
                UID: 'voltmeterResistor',
                kind: 'resistor',
                resistance: 1000000000000,
                connections: connections.split(',')});
              tempComponents.push(voltmeterResistor);
            }
            var probe = breadBoard.component({
              UID: 'meter',
              kind: {'current' : 'iprobe', 'voltage' : 'vprobe'}[type],
              connections: connections.split(',')});
            tempComponents.push(probe);
          }

          tempComponents.push(breadBoard.component({
            UID: 'leftRailPower',
            kind: 'battery',
            voltage: 9,
            connections: ["left_positive1", "left_negative1"]}));

          tempComponents.push(breadBoard.component({
            UID: 'rightRailPower',
            kind: 'battery',
            voltage: 9,
            connections:  ["right_positive1", "right_negative1"]}));

          var result;

          q.qucsate(q.makeNetlist(breadBoard),
                  function (r) { result = r.meter; } );

          console.log('result=' + result);

          $.each(tempComponents, function(i, component){
            component.destroy();
          });

          if (type === 'resistance') {
            result = (1 / result);
          }
          result = -1 * result;

          result = Math.round(result*Math.pow(10,5))/Math.pow(10,5);
          return  result;
        },
        updateFlash: function() {
          $.each(breadBoard.components, function(name, component) {

            if (!!component.connections[0] && !!component.connections[1]){
              var location = component.connections[0].getName() + "," + component.connections[1].getName();

              switch (component.kind) {
                case "resistor":
                  if (component.resistance > 0){
                    sparks.flash.sendCommand('insert_component', 'resistor', name, location, '4band', component.label, component.colors);
                  } else {
                    sparks.flash.sendCommand('insert_component', 'resistor', name, location, 'wire', component.label, null);
                  }
                  break;
                case "wire":
                  var color;
                  if (location.indexOf("positive") > -1){
                    color = "0xaa0000";
                  } else if (location.indexOf("negative") > -1){
                    color = "0x000000";
                  } else {
                    if (Math.random() < 0.5){
                      color = "0x008800";
                    } else {
                      color = "0x000088";
                    }
                  }
                  sparks.flash.sendCommand('insert_component', 'wire', component.UID, location, color);
                  break;
              }
            }
          });
        }
      };

      this.breadModel = function () {
        debug(arguments);
        var newArgs = [];
        for(var i=1,l=arguments.length;i< l;i++){
          newArgs[newArgs.length] = arguments[i];
        }
        var func = arguments[0];

        if (func === 'query') {
            var conns = arguments[2].split(',');

            if (conns[0] === 'null' || conns[1] === 'null') {
                return 0;
            }
            var v = interfaces.query.apply(window, newArgs);
            return v;
        }
        else {
          return interfaces[func].apply(window, newArgs);
        }
      };

      this.getBreadBoard = function() {
        return breadBoard;
      };

})();
/* FILE multimeter-base.js */

(function () {

    var flash = sparks.flash;

    /*
     * Digital Multimeter
     * Base for the Centech DMM
     */
    sparks.circuit.MultimeterBase = function () {
    };

    sparks.circuit.MultimeterBase.prototype = {

        modes : { ohmmeter : 0, voltmeter : 1, ammeter : 2 },

        init: function () {
            this.mode = this.modes.ohmmeter;

            this.v_value = 0; //voltage value
            this.i_value = 0; //current value
            this.r_value = 0; //resistance value

            this.displayText = '       ';

            this.redProbeConnection = null;
            this.blackProbeConnection = null;
            this.redPlugConnection = null;
            this.blackPlugConnecton = null;
            this.dialPosition = 'acv_750';
            this.powerOn = false;
            this.disabledPositions = [];
        },

        update : function () {
            console.log('ENTER MultimeterBase#update');
        },

        updateDisplay : function () {
            if (!this.powerOn) {
                this.displayText = '       ';
                flash.sendCommand('set_multimeter_display', '       ');
                return;
            }
            console.log('Multimeter.update: v=' + this.v_value + ' i=' + this.i_value + ' r=' + this.r_value + ' dial=' + this.dialPosition);

            var text = '';
            if (this.allConnected()) {
                if (this.dialPosition === 'dcv_20') {
                    if (this.v_value < 19.995) {
                        text = (Math.round(this.v_value * 100) * 0.01).toString();
                        text = this.toDisplayString(text, 2);
                    }
                    else {
                        text = ' 1 .   ';
                    }

                } else if (this.dialPosition === 'dcv_200') {
                     if (this.v_value < 199.95) {
                        text = (Math.round(this.v_value * 10) * 0.1).toString();
                        text = this.toDisplayString(text, 1);
                    }
                    else {
                        text = ' 1 .   ';
                    }

                } else if (this.dialPosition === 'dcv_1000') {
                     if (this.v_value < 999.95) {
                        text = Math.round(this.v_value).toString();
                        text = this.toDisplayString(text, 0);
                    }
                    else {
                        text = 'h1 .   ';
                    }

                } else if (this.dialPosition === 'dcv_2000m') {
                    var vm = this.v_value * 1000;
                    if (vm < 1999.5) {
                        text = Math.round(vm).toString();
                        text = this.toDisplayString(text, 0);
                    }
                    else {
                        text = ' 1 .   ';
                    }

                } else if (this.dialPosition === 'dcv_200m') {
                    var vm = this.v_value * 1000;
                    if (vm < 195){
                      text = (Math.round(vm * 100) * 0.01).toString();
                      text = this.toDisplayString(text, 1);
                    }
                    else {
                        text = ' 1 .   ';
                    }

                } else if (this.dialPosition === 'r_200') {
                    if (this.r_value < 199.95) {
                        text = (Math.round(this.r_value * 10) * 0.1).toString();
                        text = this.toDisplayString(text, 1);
                    }
                    else {
                        text = ' 1   . ';
                    }
                } else if (this.dialPosition === 'r_2000') {
                    if (this.r_value < 1999.5) {
                        text = Math.round(this.r_value).toString();
                        text = this.toDisplayString(text, 0);
                    }
                    else {
                        text = ' 1     ';
                    }
                }
                else if (this.dialPosition === 'r_20k') {
                    if (this.r_value < 19995) {
                        text = (Math.round(this.r_value * 0.1) * 0.01).toString();
                        text = this.toDisplayString(text, 2);
                    }
                    else {
                        text = ' 1 .   ';
                    }
                }
                else if (this.dialPosition === 'r_200k') {
                    if (this.r_value < 199950) {
                        text = (Math.round(this.r_value * 0.01) * 0.1).toString();
                        text = this.toDisplayString(text, 1);
                    }
                    else {
                        text = ' 1   . ';
                    }
                }
                else if (this.dialPosition === 'r_2000k') {
                    if (this.r_value < 1999500) {
                        text = Math.round(this.r_value * 0.001).toString();
                        text = this.toDisplayString(text, 0);
                    }
                    else {
                        text = ' 1     ';
                    }
                }
                else if (this.dialPosition === 'dca_200mc') {
                  var imc = this.i_value * 1000000
                  if (imc < 195){
                    text = (Math.round(imc * 100) * 0.01).toString();
                    text = this.toDisplayString(text, 1);
                  }
                  else {
                      text = ' 1     ';
                  }
                }
                else if (this.dialPosition === 'dca_2000mc') {
                  var imc = this.i_value * 1000000
                  if (imc < 1950){
                    text = (Math.round(imc * 10) * 0.1).toString();
                    text = this.toDisplayString(text, 0);
                  }
                  else {
                      text = ' 1     ';
                  }
                }
                else if (this.dialPosition === 'dca_20m') {
                  var im = this.i_value * 1000
                  if (im < 19.5){
                    text = (Math.round(im * 100) * 0.01).toString();
                    text = this.toDisplayString(text, 2);
                  }
                  else {
                      text = ' 1     ';
                  }
                }
                else if (this.dialPosition === 'dca_200m') {
                  var im = this.i_value * 1000
                  if (im < 195){
                    text = (Math.round(im * 10) * 0.1).toString();
                    text = this.toDisplayString(text, 1);
                  }
                  else {
                      text = ' 1     ';
                  }
                }
                else if (this.dialPosition === 'dcv_200m' || this.dialPosition === 'dcv_200' ||
                        this.dialPosition === 'acv_200' || this.dialPosition === 'p_9v' ||
                        this.dialPosition === 'dca_200mc' || this.dialPosition === 'dca_200m') {
                    text = '  0 0.0';
                }
                else if (this.dialPosition === 'dcv_2000m' || this.dialPosition === 'dca_2000mc' ||
                        this.dialPosition === 'hfe') {
                    text = '  0 0 0';
                }
                else if (this.dialPosition === 'dcv_20' || this.dialPosition === 'dca_20m' ||
                        this.dialPosition === 'c_10a') {
                    text = '  0.0 0';
                }
                else if (this.dialPosition === 'dcv_1000' || this.dialPosition === 'acv_750') {
                    text = 'h 0 0 0';
                }
                else if (this.dialPosition === 'diode') {
                  text = ' 1     ';
                }
                else {
                    text = '       ';
                }
            }
            else {    // if not connected
                if (this.dialPosition === 'dcv_20') {
                    text = '  0.0 0';
                }
                else if (this.dialPosition === 'r_200') {
                    text = ' 1   . ';
                }
                else if (this.dialPosition === 'r_2000' || this.dialPosition === 'diode') {
                    text = ' 1     ';
                }
                else if (this.dialPosition === 'r_20k') {
                    text = ' 1 .   ';
                }
                else if (this.dialPosition === 'r_200k') {
                    text = ' 1   . ';
                }
                else if (this.dialPosition === 'r_2000k') {
                    text = ' 1     ';
                }
                else if (this.dialPosition === 'dcv_200m' || this.dialPosition === 'dcv_200' ||
                        this.dialPosition === 'acv_200' || this.dialPosition === 'p_9v' ||
                        this.dialPosition === 'dca_200mc' || this.dialPosition === 'dca_200m') {
                    text = '  0 0.0';
                }
                else if (this.dialPosition === 'dcv_2000m' || this.dialPosition === 'dca_2000mc' ||
                        this.dialPosition === 'hfe') {
                    text = '  0 0 0';
                }
                else if (this.dialPosition === 'dcv_20' || this.dialPosition === 'dca_20m' ||
                        this.dialPosition === 'c_10a') {
                    text = '  0.0 0';
                }
                else if (this.dialPosition === 'dcv_1000' || this.dialPosition === 'acv_750') {
                    text = 'h 0 0 0';
                }
                else {
                    text = '       ';
                }
            }
            console.log('text=' + text);
            text = this.disable_multimeter_position(text);
            flash.sendCommand('set_multimeter_display', text);
            this.displayText = text;
        },


		set_disable_multimeter_position: function (disabled) {
			this.disabledPositions = disabled.split(',');
			for(i=0;i<this.disabledPositions.length;i++){
			}
		},


        disable_multimeter_position : function (displayText) {

        	switch (this.dialPosition)
        	{
 			case 'dcv_20':
			case 'dcv_200':
			case 'dcv_1000':
			case 'dcv_2000m':
			case 'dcv_200m':
				for(i=0;i<this.disabledPositions.length;i++){
					if(this.disabledPositions[i] == 'dcv'){
						displayText = '-------';
						break;
					}
				}
				break;
			case 'r_200':
			case 'r_2000':
			case 'r_20k':
			case 'r_200k':
			case 'r_2000k':
				for(i=0;i<this.disabledPositions.length;i++){
					if(this.disabledPositions[i] == 'r'){
						displayText = '-------';
						break;
					}
				}
				break;
			case 'dca_200mc':
			case 'dca_2000mc':
			case 'dca_20m':
			case 'dca_200m':
				for(i=0;i<this.disabledPositions.length;i++){
					if(this.disabledPositions[i] == 'dca'){
						displayText = '-------';
						break;
					}
				}
				break;
			case 'acv_750':
			case 'acv_200':
				for(i=0;i<this.disabledPositions.length;i++){
					if(this.disabledPositions[i] == 'acv'){
						displayText = '-------';
						break;
					}
				}
				break;
			case 'diode':
			case 'hfe':
			case 'c_10a':
			case 'p_9v':
			default:
        	}
        	return displayText;
        },

        toDisplayString : function (s, dec) {
            var i;
            var sign = s.charAt(0) === '-' ? s.charAt(0) : ' ';
            s = s.replace('-', '');

            var pointLoc = s.indexOf('.');
            var decLen = pointLoc == -1 ? 0 : s.substring(pointLoc+1).length;
            if (decLen === 0) {
                s = s.concat('.');
            }
            if (dec < decLen) {
                s = s.substring(0, pointLoc + dec + 1);
            }
            else {
                for (i = 0; i < dec - decLen; ++i) {
                    s = s.concat('0');
                }
            }
            s = s.replace('.', '');
            var len = s.length;
            if (len < 4) {
                for (i = 0; i < 3 - len; ++i) {
                    s = '0' + s;
                }
                s = ' ' + s;
            }

            var dot1;
            var dot2;

            switch (dec) {
            case 0:
                dot1 = ' ';
                dot2 = ' ';
                break;
            case 1:
                dot1 = ' ';
                dot2 = '.';
                break;
            case 2:
                dot1 = '.';
                dot2 = ' ';
                break;
            default:
                console.log('ERROR: invalid dec ' + dec);
            }

            s = sign + s.substring(0, 2) + dot1 + s.charAt(2) + dot2 + s.charAt(3);
            return s;

        },

        formatDecimalString : function (s, dec) {
            var pointLoc = s.indexOf('.');
            var decLen = pointLoc == -1 ? 0 : s.substring(pointLoc+1).length;
            if (decLen === 0) {
                s = s.concat('.');
            }
            if (dec < decLen) {
                s = s.substring(0, pointLoc + dec + 1);
            }
            else {
                for (var i = 0; i < dec - decLen; ++i) {
                    s = s.concat('0');
                }
            }
            return s;
        },

        getDisplayText : function () {
            return this.displayText;
        },

        /*
         * Return value to be shown under optimal setting.
         * This value is to be compared with the student answer for grading.
         *
         * Take three significant digits, four if the first digit is 1.
         */
        makeDisplayText : function (value) {
            var text;
            if (value < 199.95) {
                text = (Math.round(value * 10) * 0.1).toString();
                text = this.formatDecimalString(text, 1);
            }
            else if (value < 1999.5) {
                text = Math.round(value).toString();
                text = this.formatDecimalString(text, 0);
            }
            else if (value < 19995) {
                text = (Math.round(value * 0.1) * 10).toString();
            }
            else if (value < 199950) {
                text = (Math.round(value * 0.01) * 100).toString();
            }
            else if (value < 1999500) {
                text = (Math.round(value * 0.001) * 1000).toString();
            }
            else {
                text = 'NaN';
            }
            return parseFloat(text);
        },

        allConnected : function () {
            return this.redProbeConnection !== null &&
                this.blackProbeConnection !== null &&
                this.redProbeConnection !== this.blackProbeConnection &&
                (this.redPlugConnection === 'voma_port' &&
                 this.blackPlugConnection === 'common_port' ||
                 this.redPlugConnection === 'common_port' &&
                 this.blackPlugConnection === 'voma_port') &&
                this.powerOn;
        }
    };

})();

/* FILE multimeter2.js */

(function () {

    var circuit = sparks.circuit;
    var flash = sparks.flash;

    /*
     * Digital Multimeter for breadboard activities
     *
     */
    circuit.Multimeter2 = function () {
        circuit.Multimeter2.uber.init.apply(this);
        this.dialPosition = 'dcv_20';
        this.powerOn = true;
        this.update();
    };

    sparks.extend(circuit.Multimeter2, circuit.MultimeterBase, {

        update: function () {
            console.log('ENTER Multimeter2#update');
            console.log('redProbeConnection=' + this.redProbeConnection);
            console.log('blackProbeConnection=' + this.blackProbeConnection);

            if (this.redProbeConnection && this.blackProbeConnection) {
                var measurement = null;
                if (this.dialPosition.indexOf('dcv_') > -1){
                  measurement = "voltage"
                } else if (this.dialPosition.indexOf('dca_') > -1){
                   measurement = "current"
                } else if (this.dialPosition.indexOf('r_') > -1){
                      measurement = "resistance"
                }
                console.log("measurement = "+measurement+", this.dialPosition = "+this.dialPosition);

                if (!!measurement){
                  if (measurement === "voltage"){
                    console.log("going to measure voltage, m="+measurement);
                    this.v_value = Math.abs(breadModel('query', measurement, this.redProbeConnection + ',' + this.blackProbeConnection));
                  } else if (measurement === "current"){
                      console.log("going to measure current, m="+measurement);
                    this.i_value = Math.abs(breadModel('query', measurement, this.redProbeConnection + ',' + this.blackProbeConnection));
                  } else if (measurement === "resistance"){
                      console.log("going to measure resistance, m="+measurement);
                    this.r_value = Math.abs(breadModel('query', measurement, this.redProbeConnection + ',' + this.blackProbeConnection));
                    console.log("r_value = "+this.r_value);
                  }
                }
            }
            else {
                this.v_value = 0;
            }
            this.updateDisplay();
        },

        allConnected: function () {
            return this.redProbeConnection !== null &&
                this.blackProbeConnection !== null &&
                this.powerOn;
        }
    });

})();
/* FILE resistor.js */

(function () {

    var circuit = sparks.circuit;
    var flash = sparks.flash;

    circuit.Resistor = function () {
    };

    circuit.Resistor.prototype =
    {
    	nominalValueMagnitude: -1,

        colorMap: { '-1': 'gold', '-2': 'silver',
            0 : 'black', 1 : 'brown', 2 : 'red', 3 : 'orange',
            4 : 'yellow', 5 : 'green', 6 : 'blue', 7 : 'violet', 8 : 'grey',
            9 : 'white' },

        toleranceColorMap: { 0.01 : 'brown', 0.02 : 'red', 5e-3 : 'green',
            2.5e-3 : 'blue', 1e-3 : 'violet', 5e-4 : 'gray', 5e-2 : 'gold',
            0.1 : 'silver', 0.2 : 'none' },

        toleranceValues: [ 0.01, 0.02 ],

        init: function (id) {
              this.id = id;
              this.nominalValue = 0.0; //resistance value specified by band colors;
              this.realValue = 0.0; //real resistance value in Ohms
              this.tolerance = 0.0; //tolerance value
              this.colors = []; //colors for each resistor band
        },

        getNumBands: function () {
            return this.numBands;
        },

        getNominalValue: function () {
            return this.nominalValue;
        },

        setNominalValue: function (value) {
            this.nominalValue = value;
        },

        getTolerance: function () {
            return this.tolerance;
        },

        setTolerance: function(value) {
            this.tolerance = value;
        },

        getRealValue: function () {
            return this.realValue;
        },

        setRealValue: function (value) {
            this.realValue = value;
        },

        updateColors: function (resistance, tolerance) {
            this.colors = this.getColors(resistance, tolerance);
        },

        show : function() {
        },

        calcRealValue: function (nominalValue, tolerance) {
            var chance = Math.random();
            if (chance > 0.8) {
                var chance2 = Math.random();
                if (chance2 < 0.5) {
                    return nominalValue + nominalValue * (tolerance + Math.random() * tolerance);
                }
                else {
                    return nominalValue - nominalValue * (tolerance + Math.random() * tolerance);
                }
            }

            var realTolerance = tolerance * 0.9;
            return nominalValue * this.randFloat(1 - realTolerance, 1 + realTolerance);
        },

        randInt: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        randFloat: function (min, max) {
            return this.randPseudoGaussian(3) * (max - min) + min;
        },

        randPseudoGaussian: function (n) {
            var r = 0.0;
            for (var i = 0; i < n; ++i) {
                r += Math.random();
            }
            return r / n;
        },

        filter: function (in_values) {
            var values = [];
            for (var i = 0; i < in_values.length; ++i) {
                if (in_values[i] >= 10.0 && in_values[i] < 2e6) {
                    values.push(in_values[i]);
                }
            }
            return values;
        }
    };

})();
/* FILE r-values.js */

(function () {


    this.sparks.circuit.r_values = {};

    var rv = sparks.circuit.r_values;

    rv.r_values5band1pct = [
        1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27,
        1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69,
        1.74, 1.78, 1.82, 1.87, 1.91, 1.96,
        2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55, 2.61,
        2.67, 2.74, 2.80, 2.87, 2.94,
        3.01, 3.09, 3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92,
        4.02, 4.12, 4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99,
        5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65,
        6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87,
        9.09, 9.31, 9.53, 9.76, 10.0, 10.2, 10.5, 10.7, 11.0, 11.3, 11.5, 11.8,
        12.1, 12.4, 12.7, 13.0, 13.3, 13.7, 14.0, 14.3, 14.7,
        15.0, 15.4, 15.8, 16.2, 16.5, 16.9, 17.4, 17.8, 18.2, 18.7, 19.1, 19.6,
        20.0, 20.5, 21.0, 21.5, 22.1, 22.6, 23.2, 23.7, 24.3, 24.9, 25.5, 26.1,
        26.7, 27.4, 28.0, 28.7, 29.4, 30.1, 30.9, 31.6, 32.4, 33.2, 34.0, 34.8,
        35.7, 36.5, 37.4, 38.3, 39.2, 40.2, 41.2, 42.2, 43.2, 44.2, 45.3, 46.4,
        47.5, 48.7, 49.9, 51.1, 52.3, 53.6, 54.9, 56.2, 57.6, 59.0,
        60.4, 61.9, 63.4, 64.9, 66.5, 68.1, 69.8, 71.5, 73.2, 75.0, 76.8, 78.7,
        80.6, 82.5, 84.5, 86.6, 88.7, 90.9, 93.1, 95.3, 97.6,
        100, 102, 105, 107, 110, 113, 115, 118, 121, 124,
        127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169,
        174, 178, 182, 187, 191, 196,
        200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274,
        280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383,
        392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499,
        511, 523, 536, 549, 562,
        576, 590, 604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787,
        806, 825, 845, 866, 887, 909, 931, 953, 976,
        1000, 1020, 1050, 1070, 1100, 1130, 1150, 1180, 1210, 1240, 1270,
        1300, 1330, 1370, 1400, 1430, 1470, 1500, 1540, 1580, 1620, 1650, 1690,
        1740, 1780, 1820, 1870, 1910, 1960, 2000, 2050, 2100, 2150, 2210, 2260,
        2320, 2370, 2430, 2490, 2550, 2610, 2670, 2740, 2800, 2870, 2940,
        3010, 3090, 3160, 3240, 3320, 3400, 3480, 3570, 3650, 3740, 3830, 3920,
        4020, 4120, 4220, 4320, 4420, 4530, 4640, 4750, 4870, 4990,
        5110, 5230, 5360, 5490, 5620, 5760, 5900,
        6040, 6190, 6340, 6490, 6650, 6810, 6980, 7150, 7320, 7500, 7680, 7870,
        8060, 8250, 8450, 8660, 8870, 9090, 9310, 9530, 9760,
        10000, 10200, 10500, 10700, 11000, 11300, 11500, 11800, 12100, 12400,
        12700, 13000, 13300, 13700, 14000, 14300, 14700, 15000, 15400, 15800,
        16200, 16500, 16900, 17400, 17800, 18200, 18700, 19100, 19600,
        20000, 20500, 21000, 21500, 22100, 22600, 23200, 23700, 24300, 24900,
        25500, 26100, 26700, 27400, 28000, 28700, 29400, 30100, 30900, 31600,
        32400, 33200, 34000, 34800, 35700, 36500, 37400, 38300, 39200,
        40200, 41200, 42200, 43200, 44200, 45300, 46400, 47500, 48700, 49900,
        51100, 52300, 53600, 54900, 56200, 57600, 59000, 60400, 61900, 63400,
        64900, 66500, 68100, 69800, 71500, 73200, 75000, 76800, 78700,
        80600, 82500, 84500, 86600, 88700, 90900, 93100, 95300, 97600,
        100e3, 102e3, 105e3, 107e3, 110e3, 113e3, 115e3, 118e3, 121e3, 124e3,
        127e3, 130e3, 133e3, 137e3, 140e3, 143e3, 147e3, 150e3, 154e3, 158e3,
        162e3, 165e3, 169e3, 174e3, 178e3, 182e3, 187e3, 191e3, 196e3,
        200e3, 205e3, 210e3, 215e3, 221e3, 226e3, 232e3, 237e3, 243e3, 249e3,
        255e3, 261e3, 267e3, 274e3, 280e3, 287e3, 294e3,
        301e3, 309e3, 316e3, 324e3, 332e3, 340e3, 348e3, 357e3, 365e3, 374e3,
        383e3, 392e3,
        402e3, 412e3, 422e3, 432e3, 442e3, 453e3, 464e3, 475e3, 487e3, 499e3,
        511e3, 523e3, 536e3, 549e3, 562e3,
        576e3, 590e3, 604e3, 619e3, 634e3, 649e3, 665e3, 681e3, 698e3,
        715e3, 732e3, 750e3, 768e3, 787e3, 806e3, 825e3, 845e3, 866e3, 887e3,
        909e3, 931e3, 953e3, 976e3,
        1.00e6, 1.02e6, 1.05e6, 1.07e6, 1.10e6, 1.13e6, 1.15e6, 1.18e6,
        1.21e6, 1.24e6, 1.27e6, 1.30e6, 1.33e6, 1.37e6, 1.40e6, 1.43e6, 1.47e6,
        1.50e6, 1.54e6, 1.58e6, 1.62e6, 1.65e6, 1.69e6, 1.74e6, 1.78e6,
        1.82e6, 1.87e6, 1.91e6, 1.96e6,
        2.00e6, 2.05e6, 2.10e6, 2.15e6, 2.21e6, 2.26e6, 2.32e6, 2.37e6,
        2.43e6, 2.49e6, 2.55e6, 2.61e6, 2.67e6, 2.74e6, 2.80e6, 2.87e6, 2.94e6,
        3.01e6, 3.09e6, 3.16e6, 3.24e6, 3.32e6, 3.40e6, 3.48e6, 3.57e6, 3.65e6,
        3.74e6, 3.83e6, 3.92e6,
        4.02e6, 4.12e6, 4.22e6, 4.32e6, 4.42e6, 4.53e6, 4.64e6, 4.75e6, 4.87e6,
        4.99e6, 5.11e6, 5.23e6, 5.36e6, 5.49e6, 5.62e6, 5.76e6, 5.90e6,
        6.04e6, 6.19e6, 6.34e6, 6.49e6, 6.65e6, 6.81e6, 6.98e6,
        7.15e6, 7.32e6, 7.50e6, 7.68e6, 7.87e6, 8.06e6, 8.25e6, 8.45e6, 8.66e6,
        8.87e6, 9.09e6, 9.31e6, 9.53e6, 9.76e6,
        10.0e6, 10.2e6, 10.5e6, 10.7e6, 11.0e6, 11.3e6, 11.5e6, 11.8e6,
        12.1e6, 12.4e6, 12.7e6, 13.0e6, 13.3e6, 13.7e6, 14.0e6, 14.3e6, 14.7e6,
        15.0e6, 15.4e6, 15.8e6, 16.2e6, 16.5e6, 16.9e6, 17.4e6, 17.8e6,
        18.2e6, 18.7e6, 19.1e6, 19.6e6, 20.0e6, 20.5e6, 21.0e6, 21.5e6,
        22.1e6, 22.6e6, 23.2e6, 23.7e6, 24.3e6, 24.9e6, 25.5e6, 26.1e6, 26.7e6,
        27.4e6, 28.0e6, 28.7e6, 29.4e6, 30.1e6, 30.9e6, 31.6e6, 32.4e6, 33.2e6,
        34.0e6, 34.8e6, 35.7e6, 36.5e6, 37.4e6, 38.3e6, 39.2e6,
        40.2e6, 41.2e6, 42.2e6, 43.2e6, 44.2e6, 45.3e6, 46.4e6, 47.5e6, 48.7e6,
        49.9e6, 51.1e6, 52.3e6, 53.6e6, 54.9e6, 56.2e6, 57.6e6, 59.0e6,
        60.4e6, 61.9e6, 63.4e6, 64.9e6, 66.5e6, 68.1e6, 69.8e6, 71.5e6, 73.2e6,
        75.0e6, 76.8e6, 78.7e6, 80.6e6, 82.5e6, 84.5e6, 86.6e6, 88.7e6,
        90.9e6, 93.1e6, 95.3e6, 97.6e6,
        100e6, 102e6, 105e6, 107e6, 110e6, 113e6, 115e6, 118e6, 121e6, 124e6,
        127e6, 130e6, 133e6, 137e6, 140e6, 143e6, 147e6, 150e6, 154e6, 158e6,
        162e6, 165e6, 169e6, 174e6, 178e6, 182e6, 187e6, 191e6, 196e6, 200e6
    ];

    rv.r_values5band2pct = [
        1.00, 1.05, 1.10, 1.15, 1.21, 1.27, 1.33, 1.40,
        1.47, 1.54, 1.62, 1.69, 1.78, 1.87, 1.96,
        2.05, 2.15, 2.26, 2.37, 2.49, 2.61, 2.74, 2.87,
        3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02, 4.22, 4.42, 4.64, 4.87,
        5.11, 5.36, 5.62, 5.90, 6.19, 6.49, 6.81, 7.15, 7.50, 7.87,
        8.25, 8.66, 9.09, 9.53, 10.0, 10.5, 11.0, 11.5, 12.1, 12.7, 13.3,
        14.0, 14.7, 15.4, 16.2, 16.9, 17.8, 18.7, 19.6,
        20.5, 21.5, 22.6, 23.7, 24.9, 26.1, 27.4,
        28.7, 30.1, 31.6, 33.2, 34.8, 36.5, 38.3, 40.2, 42.2, 44.2, 46.4, 48.7,
        51.1, 53.6, 56.2, 59.0, 61.9, 64.9, 68.1, 71.5, 75.0, 78.7, 82.5, 86.6,
        90.9, 95.3, 100, 105, 110, 115, 121, 127, 133, 140, 147, 154, 162, 169,
        178, 187, 196, 205, 215, 226, 237, 249, 261, 274, 287,
        301, 316, 332, 348, 365, 383, 402, 422, 442, 464, 487,
        511, 536, 562, 590, 619, 649, 681, 715, 750, 787, 825, 866, 909, 953,
        1000, 1050, 1100, 1150, 1210, 1270, 1330, 1400, 1470, 1540, 1620, 1690,
        1780, 1870, 1960, 2050, 2150, 2260, 2370, 2490, 2610, 2740, 2870,
        3010, 3160, 3320, 3480, 3650, 3830,
        4020, 4220, 4420, 4640, 4870, 5110, 5360, 5620, 5900, 6190, 6490, 6810,
        7150, 7500, 7870, 8250, 8660, 9090, 9530,
        10000, 10500, 11000, 11500, 12100, 12700, 13300, 14000, 14700, 15400,
        16200, 16900, 17800, 18700, 19600,
        20500, 21500, 22600, 23700, 24900, 26100, 27400, 28700,
        30100, 31600, 33200, 34800, 36500, 38300,
        40200, 42200, 44200, 46400, 48700,
        51100, 53600, 56200, 59000, 61900, 64900, 68100, 71500, 75000, 78700,
        82500, 86600, 90900, 95300, 100e3, 105e3, 110e3, 115e3, 121e3, 127e3,
        133e3, 140e3, 147e3, 154e3, 162e3, 169e3, 178e3, 187e3, 196e3,
        205e3, 215e3, 226e3, 237e3, 249e3, 261e3, 274e3, 287e3,
        301e3, 316e3, 332e3, 348e3, 365e3, 383e3, 402e3, 422e3, 442e3, 464e3,
        487e3, 511e3, 536e3, 562e3, 590e3, 619e3, 649e3, 681e3,
        715e3, 750e3, 787e3,
        825e3, 866e3, 909e3, 953e3, 1e6, 1.05e6, 1.1e6, 1.15e6, 1.21e6, 1.27e6,
        1.33e6, 1.40e6, 1.47e6, 1.54e6, 1.62e6, 1.69e6, 1.78e6, 1.87e6, 1.96e6,
        2.05e6, 2.15e6, 2.26e6, 2.37e6, 2.49e6, 2.61e6, 2.74e6, 2.87e6,
        3.01e6, 3.16e6, 3.32e6, 3.48e6, 3.65e6, 3.83e6,
        4.02e6, 4.22e6, 4.42e6, 4.64e6, 4.87e6, 5.11e6, 5.36e6, 5.62e6, 5.90e6,
        6.19e6, 6.49e6, 6.81e6, 7.15e6, 7.50e6, 7.87e6, 8.25e6, 8.66e6,
        9.09e6, 9.53e6, 10.0e6, 10.5e6, 11.0e6, 11.5e6, 12.1e6, 12.7e6, 13.3e6,
        14.0e6, 14.7e6, 15.4e6, 16.2e6, 16.9e6, 17.8e6, 18.7e6, 19.6e6,
        20.5e6, 21.5e6, 22.6e6, 23.7e6, 24.9e6, 26.1e6, 27.4e6, 28.7e6,
        30.1e6, 31.6e6, 33.2e6, 34.8e6, 36.5e6, 38.3e6,
        40.2e6, 42.2e6, 44.2e6, 46.4e6, 48.7e6, 51.1e6, 53.6e6, 56.2e6, 59.0e6,
        61.9e6, 64.9e6, 68.1e6, 71.5e6, 75e6, 78.7e6, 82.5e6, 86.6e6,
        90.9e6, 95.3e6,
        100e6, 105e6, 110e6, 115e6, 121e6, 127e6, 133e6, 140e6, 147e6, 154e6,
        162e6, 169e6, 178e6, 187e6, 196e6
    ];

    rv.r_values4band5pct = [
        1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7,
        3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
        10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39,
        43, 47, 51, 56, 62, 68, 75, 82, 91,
        100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270,
        300, 330, 360, 390, 430, 470, 510, 560, 620, 680, 750, 820, 910,
        1.0e3, 1.1e3, 1.2e3, 1.3e3, 1.5e3, 1.6e3, 1.8e3,
        2.0e3, 2.2e3, 2.4e3, 2.7e3, 3.0e3, 3.3e3, 3.6e3, 3.9e3,
        4.3e3, 4.7e3, 5.1e3, 5.6e3, 6.2e3, 6.8e3, 7.5e3, 8.2e3, 9.1e3,
        10e3, 11e3, 12e3, 13e3, 15e3, 16e3, 18e3, 20e3, 22e3, 24e3, 27e3, 30e3,
        33e3, 36e3, 39e3, 43e3, 47e3, 51e3, 56e3, 62e3, 68e3, 75e3, 82e3, 91e3,
        100e3, 110e3, 120e3, 130e3, 150e3, 160e3, 180e3, 200e3, 220e3, 240e3,
        270e3, 300e3, 330e3, 360e3, 390e3, 430e3, 470e3, 510e3, 560e3,
        620e3, 680e3, 750e3, 820e3, 910e3,
        1.0e6, 1.1e6, 1.2e6, 1.3e6, 1.5e6, 1.6e6, 1.8e6, 2.0e6, 2.2e6, 2.4e6,
        2.7e6, 3.0e6, 3.3e6, 3.6e6, 3.9e6, 4.3e6, 4.7e6, 5.1e6, 5.6e6,
        6.2e6, 6.8e6, 7.5e6, 8.2e6, 9.1e6, 10e6, 11e6, 12e6, 13e6, 15e6, 16e6,
        18e6, 20e6, 22e6, 24e6, 27e6, 30e6, 33e6, 36e6, 39e6, 43e6, 47e6,
        51e6, 56e6, 62e6, 68e6, 75e6, 82e6, 91e6
    ];

    rv.r_values4band10pct = [
        1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2,
        10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82,
        100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820,
        1.0e3, 1.2e3, 1.5e3, 1.8e3, 2.2e3, 2.7e3, 3.3e3, 3.9e3, 4.7e3, 5.6e3,
        6.8e3, 8.2e3,
        10e3, 12e3, 15e3, 18e3, 22e3, 27e3, 33e3, 39e3, 47e3, 56e3, 68e3, 82e3,
        100e3, 120e3, 150e3, 180e3, 220e3, 270e3, 330e3, 390e3, 470e3, 560e3,
        680e3, 820e3,
        1.0e6, 1.2e6, 1.5e6, 1.8e6, 2.2e6, 2.7e6, 3.3e6, 3.9e6, 4.7e6, 5.6e6,
        6.8e6, 8.2e6,
        10e6, 12e6, 15e6, 18e6, 22e6, 27e6, 33e6, 39e6, 47e6, 56e6, 68e6, 82e6
    ];

})();

/* FILE resistor-4band.js */

(function () {

    var circuit = sparks.circuit;

    circuit.Resistor4band = function (id) {
        var superclass = sparks.circuit.Resistor4band.uber;
        superclass.init.apply(this, [id]);
        this.numBands = 4;

        this.r_values5pct = this.filter(circuit.r_values.r_values4band5pct);
        this.r_values10pct = this.filter(circuit.r_values.r_values4band10pct);
    };

    sparks.extend(circuit.Resistor4band, circuit.Resistor, {

        toleranceValues: [0.05, 0.1],

        randomize: function (options) {
            var ix = this.randInt(0, 1);
            var values;

            this.tolerance = this.toleranceValues[ix];

            if (options && options.rvalues) {
                values = options.rvalues;
            }
            else if (this.tolerance == 0.05) {
                values = this.r_values5pct;
            }
            else {
                values = this.r_values10pct;
            }



			var firstNominal = circuit.Resistor.prototype.nominalValueMagnitude;
            if(circuit.Resistor.prototype.nominalValueMagnitude == -1){
	            this.nominalValue = Math.random()*2000;  // I switched this because some values were too large to measure with the multimeter
	           	circuit.Resistor.prototype.nominalValueMagnitude = this.nominalValue;
            }
            this.nominalValue = (Math.floor((500-1)*Math.random()) ) * circuit.Resistor.prototype.nominalValueMagnitude;


            if (options && options.realEqualsNominal) {
                this.realValue = this.nominalValue;
            }
            else {
                this.realValue = this.calcRealValue(this.nominalValue, this.tolerance);
            }
            console.log('r=' + this.nominalValue + ' t=' + this.tolerance);

            this.colors = this.getColors(this.nominalValue, this.tolerance);
        },

        getColors: function (ohms, tolerance) {
            var s = ohms.toString();
            var decIx = s.indexOf('.'); // real location of the dot in the string
            var decLoc = decIx > -1 ? decIx : s.length;

            s = s.replace('.', '');
            var len = s.length;

            for (var i = 0; i < 2 - len; ++i) {
                s += '0';
            }

            var mult = decLoc > 1 ? decLoc - 2 : 10;

            return [ this.colorMap[s.charAt(0)],
                     this.colorMap[s.charAt(1)],
                     this.colorMap[decLoc - 2],
                     this.toleranceColorMap[tolerance]
                   ];
        }

    });

})();

/* FILE resistor-5band.js */

(function () {

    var circuit = sparks.circuit;

    circuit.Resistor5band = function (id) {
        var superclass = sparks.circuit.Resistor5band.uber;
        superclass.init.apply(this, [id]);
        this.numBands = 5;

        this.r_values1pct = this.filter(circuit.r_values.r_values5band1pct);
        this.r_values2pct = this.filter(circuit.r_values.r_values5band2pct);
    };

    sparks.extend(circuit.Resistor5band, circuit.Resistor, {

        randomize : function() {
          var ix = this.randInt(0, 1);
          var values;

          this.tolerance = this.toleranceValues[ix];
          if (this.tolerance == 0.01) {
              values = this.r_values1pct;
          }
          else {
              values = this.r_values2pct;
          }
          this.nominalValue = values[this.randInt(0, values.length-1)];
          this.realValue = this.calcRealValue(this.nominalValue, this.tolerance);
          this.colors = this.getColors(this.nominalValue, this.tolerance);

          this.colors = this.getColors(this.nominalValue, this.tolerance);
        },

        getColors: function(ohms, tolerance) {
            var s = ohms.toString();
            var decIx = s.indexOf('.'); // real location of the dot in the string
            var decLoc = decIx > -1 ? decIx : s.length;

            s = s.replace('.', '');
            var len = s.length;

            for (var i = 0; i < 3 - len; ++i) {
                s += '0';
            }

            return [ this.colorMap[s.charAt(0)],
                     this.colorMap[s.charAt(1)],
                     this.colorMap[s.charAt(2)],
                     this.colorMap[decLoc - 3],
                     this.toleranceColorMap[tolerance]
                   ];
        }
    });
})();

/* FILE setup-common.js */

(function () {

    this.sparks.activities.sm = {};
    this.sparks.activities.sm.config = {};

    sparks.config.root_dir = '../../..';
    sparks.activities.sm.config.root_dir = sparks.config.root_dir + '/activities/module-2';

})();

/* FILE activity-log.js */

(function () {

    var sm = sparks.activities.sm;

    /* Log object structure
     * - session is the unit of upload to server
     *
     *   SESSION
     *     start_time:
     *     end_time:
     *       events:
     *         - event
     *             name:
     *             value:
     *             time:
     */
    sm.Session = function () {
        this.start_time = null;
        this.end_time = null;
    };


    sm.ActivityLog = function () {
        this.session = new sm.Session();
    };

    sm.ActivityLog.prototype = {
    };

})();

/* FILE feedback.js */

(function () {

    var util = sparks.util;
    var sm = sparks.activities.sm;

    sm.Feedback = function (rubric) {
        this.root = util.cloneSimpleObject(rubric);
    };

    sm.Feedback.prototype = {

    };

})();

/* FILE grader.js */

(function () {

    var sm = sparks.activities.sm;

    sm.Grader = function (session, rubric) {
        this.session = session;
        this.rubric = rubric;

        this.feedback = new sm.Feedback(rubric);
    };

    sm.Grader.prototype = {

        grade: function () {
            return this.feedback;
        }

    };

})();

/* FILE unit.js */

(function () {

    this.sparks.unit = {};

    var u = sparks.unit;

    u.labels = { ohms : '\u2126', kilo_ohms : 'k\u2126', mega_ohms : 'M\u2126' };

    u.toEngineering = function (value, units){
      value = Number(value);

      if (value >= 1000000){
        var MUnits = "mega"+units;
        units = MUnits;
        value = u.round(value/1000000,2);
      } else if (value >= 1000){
        var kUnits = "kilo"+units;
        units = kUnits;
        value = u.round(value/1000,2);
      } else if (value === 0 ) {
        units = units;
        value = 0;
      } else if (value < 0.000001){
        var nUnits = "nano"+units;
        units = nUnits;
        value = u.round(value * 1000000000,2);
      } else if (value < 0.001){
        var uUnits = "micro"+units;
        units = uUnits;
        value = u.round(value * 1000000,2);
      } else if (value < 1) {
        var mUnits = "milli"+units;
        units = mUnits;
        value = u.round(value * 1000,2);
      } else {
        units = units;
        value = u.round(value,2);
      }

      return {"value": value, "units": units};
    };

    u.round = function(num, dec) {
    	var result = Math.round( Math.round( num * Math.pow( 10, dec + 2 ) ) / Math.pow( 10, 2 ) ) / Math.pow(10,dec);
    	return result;
    };

    u.sigFigs = function(n, sig) {
        var mult = Math.pow(10,
            sig - Math.floor(Math.log(n) / Math.LN10) - 1);
        return Math.round(n * mult) / mult;
    };

    u.isMeasurement = function(string) {
      var isMeasurementPattern = /^\s?\d+.?\d*\s?\D+\s?$/
      var matched = string.match(isMeasurementPattern);
      return !!matched;
    };

    /**
    * assumes this will be in the form ddd uu
    * i.e. a pure number and a unit, separated by an optional space
    * '50 ohms' and '50V' are both valid
    */
    u.convertMeasurement = function(measurement) {
      if (!this.isMeasurement(measurement)){
        return measurement
      }

      var numPattern = /\d+\.?\d*/g
      var nmatched = measurement.match(numPattern);
      if (!nmatched){
        return measurement;
      }
      var value = nmatched[0];

      var unitPattern =  /(?=\d*.?\d*)[^\d\.\s]+/g
      var umatched = measurement.match(unitPattern);
      if (!umatched){
        return measurement;
      }
      var unit = umatched[0];

      var eng = u.toEngineering(value, unit)
      return eng.value + " " + eng.units;
    };

    u.normalizeToOhms = function (value, unit) {
        switch (unit) {
        case u.labels.ohms:
            return value;
        case u.labels.kilo_ohms:
            return value * 1000;
        case u.labels.mega_ohms:
            return value * 1e6;
        }
        return null;
    };

    u.ohmCompatible = function (unit) {
        if (unit == u.labels.ohms || unit == u.labels.kilo_ohms ||
            unit == u.labels.mega_ohms)
        {
            return true;
        }
        return false;
    };

    u.res_str = function (value) {
        var vstr, unit, val;

        if (typeof value !== 'number' || isNaN(Number(value))) {
            return 'Invalid Value ' + String(value);
        }

        if (value < 1000) {
            val = value;
            unit = u.labels.ohms;
        }
        else if (value < 1e6) {
            val = value / 1000;
            unit = u.labels.kilo_ohms;
        }
        else {
            val = value / 1e6;
            unit = u.labels.mega_ohms;
        }

        if (val.toFixed) {
            val = val.toFixed(6);
        }

        vstr = String(val).replace(/(\.[0-9]*[1-9])0*/, '$1');
        vstr = vstr.replace(/([0-9])\.0+$/, '$1');
        return vstr + ' ' + unit;
    };

    u.res_unit_str = function (value, mult) {
        var vstr;
        var unit = u.labels.ohms;

        if (mult === 'k') {
            vstr = String(value / 1000.0);
            unit = u.labels.kilo_ohms;
        }
        else if (mult === 'M') {
            vstr = String(value / 1000000.0);
            unit = u.labels.mega_ohms;
        }
        else {
            vstr = String(value);
            unit = u.labels.ohms;
        }
        return vstr + ' ' + unit;
    };

    u.pct_str = function (value) {
        return (value * 100) + ' %';
    };


})();

/* FILE reporter.js */

(function () {

    var unit = sparks.unit;
    var sm = sparks.activities.sm;

    sm.Reporter = function (reportElem) {
        this.template = sm.config.root_dir + '/report-template.html';
        this.reportElem = reportElem;
    };

    sm.Reporter.prototype = {

        red : '#cc3300',
        red2 : '#cc9933',
        orange : '#ff6600',
        blue : '#0099cc',
        green :'#339933',

        dialLabels : { r_2000k: '\u2126 - 2000k',
            r_200k: '\u2126 - 200k',
            r_20k: '\u2126 - 20k',
            r_2000: '\u2126 - 2000',
            r_200: '\u2126 - 200',
            dcv_1000: 'DCV - 1000',
            dcv_200: 'DCV - 200',
            dcv_20: 'DCV - 20',
            dcv_2000m: 'DCV - 2000m',
            dcv_200m: 'DCV - 200m',
            acv_750: 'ACV - 750',
            acv_200: 'ACV - 200',
            p_9v: '1.5V 9V',
            dca_200mc: 'DCA - 200\u03bc',
            dca_2000mc: 'DCA - 2000\u03bc',
            dca_20m: 'DCA - 20m',
            dca_200m: 'DCA - 200m',
            c_10a: '10A',
            hfe: 'hFE',
            diode: 'Diode'
        },

        report: function (session, feedback) {
            var reporter = this;
            this.reportElem.load(this.template, '', function () {
                reporter.sessionReport(session, feedback);
            });
        },

        sessionReport: function (session, feedback) {
            var studentName = jQuery.cookie('student_name');
            if (studentName) {
                $('#student_name').text(studentName.replace('+', ' '));
            }
            var activityName = jQuery.cookie('activity_name');
            if (activityName) {
                $('#activity_name').text(activityName.replace('+', ' '));
            }
            var attemptNum = jQuery.cookie('attempt_num');
            if (attemptNum) {
                $('#attempt_num').text(attemptNum);
            }
            $('#date').text(new Date().toString().slice(0, 15));
        },

        setAnswerTextWithColor: function (elemId, text, feedback) {
            var color;
            switch (feedback.correct)
            {
            case 0: color = this.red; break;
            case 1: color = this.red2; break;
            case 2: color = this.orange; break;
            case 3: color = this.blue; break;
            case 4: color = this.green; break;
            }
            this.setTextWithColor(elemId, text, color);
        },

        setTextWithColor: function (elemId, text, color) {
            $(elemId).text(text);
            $(elemId).attr('style', 'color: ' + color + ';');
        },

        imageLink: function (container, imageUrl, linkUrl) {
          var a = $('<a></a>').addClass('no_deco');
          a.attr({ href: linkUrl, title: 'Click for SPARKS Help!', target: 'feedback' });
          var img = $('<img></img>').addClass('no_border');
          img.attr({ src: imageUrl, align: 'ABSMIDDLE' });
          img.css({ margin: '4px' });
          a.append(img);
          container.html(a);
        }
    };

})();

/*globals sparks */

/* FILE activity-log.js */

(function () {

    var activity = sparks.Activity;

    activity.Event = function (name, value, time) {
        this.name = name;
        this.value = value;
        this.time = time;
    };

    /* Log object structure
     * - session is the unit of upload to server
     *
     *   SESSION
     *     start_time:
     *     end_time:
     *     sections:
     *       - section
     *           start_time:
     *           end_time:
     *           events:
     *             - event
     *                 name:
     *                 value:
     *                 time:
     *           questions:
     *             - question
     *                 id:
     *                 correct_answer:
     *                 answer:
     *                 unit:
     *                 correct:
     *                 start_time:
     *                 end_time:
     */
    activity.Session = function () {
        this.events = [];
        this.properties = [];
        this.start_time = null;
        this.end_time = null;
    };

    activity.ActivityLog = function ()
    {

        this.sessions = [];
        this.numSessions = 0;
    };

    activity.ActivityLog.prototype =
    {
        eventNames : { start_session: 1,
                       end_session: 1,
                       start_section: 1,
                       end_section: 1,
                       start_question: 1,
                       end_question: 1,
                       connect: 1,
                       disconnect: 1,
                       make_circuit: 1,
                       break_circuit: 1,
                       multimeter_dial: 1,
                       multimeter_power: 1,
                       resistor_nominal_value: 1,
                       resistor_real_value: 1,
                       resistor_display_value: 1 },

        beginSession : function() {
            var session = new activity.Session();


            this.sessions.push(session);
            this.numSessions += 1;
            this.log('start_session');
        },

        endSession : function() {
            this.log('end_session');
        },

        currentSession : function() {
            return this.sessions[this.numSessions - 1];
        },

        setValue : function(name, value) {
          this.currentSession().properties[name] = value;
        },

        log : function(name) {
            var now = new Date().valueOf();
            var session = this.currentSession();

            if (!this.eventNames[name]) {
                console.log('ERROR: add: Unknown log event name ' + name);
                session.events.push(new activity.Event('UNREGISTERED_NAME', name, now));
                return;
            }

            switch (name)
            {
            case 'connect':
              if (arguments.length < 3){
                console.log("ERROR: logging conection needs to have two parameters");
                return;
              }
              console.log('connect ' + arguments[1] + ' to ' + arguments[2]);
              session.events.push(new activity.Event('connect', arguments[1] + '|' + arguments[2], now));
              break;
            case 'make_circuit':
                session.events.push(new activity.Event('make_circuit', '', now));
                break;
            case 'break_circuit':
                session.events.push(new activity.Event('break_circuit', '', now));
                break;
            case 'start_session':
                session.start_time = now;
                break;
            case 'end_session':
                session.end_time = now;
                break;
            default:
                session.events.push(new activity.Event(name, arguments[1], now));
            }
        }
    };

})();
/*globals sparks $ */

(function() {

  var activity = sparks.Activity;

  activity.Question = function () {
  	  this.id = 0;
      this.prompt = '';
      this.shortPrompt = '';
      this.correct_answer = null;
      this.answer = '';
      this.correct_units = null;
      this.units = '';
      this.answerIsCorrect = false;
      this.unitsIsCorrect = false;
      this.start_time = null;
      this.end_time = null;
      this.score = 0;
      this.options = null;
      this.points_earned = -1;
      this.feedback = null;
      this.isSubQuestion = false;
      this.commonPrompt = '';
  };

  activity.Assessment = function (activityLog) {
    this.activityLog = activityLog;
    this.questions = [];
    this.forms = [];
    this.userQuestions = [];
  };

  activity.Assessment.prototype =
  {
    createQuestion: function(jsonQuestion, id){
      function html_entity_decode(str) {
        return $("<div>").html(str).text();
      }

      var question = new activity.Question();
      question.id = id;
      question.prompt = jsonQuestion.prompt;
      question.shortPrompt = (jsonQuestion.shortPrompt || jsonQuestion.prompt);
      question.commonPrompt = jsonQuestion.commonPrompt;
      question.isSubQuestion= jsonQuestion.isSubQuestion;
      if (jsonQuestion.correct_answer != null) {
        question.correct_answer = "" + jsonQuestion.correct_answer;
      }

      question.correct_units = jsonQuestion.correct_units;
      if (!!question.correct_units){
        question.correct_units = question.correct_units.replace("ohms",html_entity_decode("&#x2126;"));
      }
      if (!!jsonQuestion.options) {
      	question.options = jsonQuestion.options;
      }

      question.score = (jsonQuestion.score | 0);

      return question;
    },

    addQuestion: function(jsonQuestion,id) {
    	var question = this.createQuestion(jsonQuestion,id);
      this.questions.push(question);
    },

    serializeQuestions: function(jqForms) {
      var self = this;
      var form = $(this);
      form.questions = [];
      self.forms.push(form);

      var id = 0;
      $.each(this.questions, function(i, question) {
     	if(!question.options){
     		question.answer = $("#"+id + "_input").val();
     	} else if(question.options) {
     		console.log('else if options');
     		question.answer = $("#"+id + "_options").val();
     	}
     	if(question.correct_units){
     		question.units = $("#"+id + "_units").val();
     	}
     	id++;

     	form.questions.push(question);
        self.userQuestions.push(question);
      });
    },

    scoreAnswers: function() {
      var self = this;
      $.each(this.questions, function(i, question) {
        if (!!self.userQuestions[i]){
          var userQuestion = self.userQuestions[i];

          if(!question.options){
          	question.answer = parseFloat(question.answer);

          	console.log('question '+ i + ', question.answer, ' +question.answer +' question.correct_answer '+question.correct_answer);

          	var dif = self._sigFigs(question.answer,3) - self._sigFigs(question.correct_answer,3);
            if(dif <= 15 && dif >= -15){
          	  question.answerIsCorrect = true;
          	}
          } else if(!!question.options) {
            if (!!question.options[0].option){
              var optionChosen;
              var maxPoints = 0;
              question.feedback = "";
              $.each(question.options, function(i, option){
                if (option.option == question.answer){
                  optionChosen = option;
                }
                var points = option.points;
                if (points > maxPoints){
                  maxPoints = points;
                  question.score = points;
                  question.correct_answer = option.option;
                }
              });
              question.points_earned = optionChosen.points;
              question.feedback = optionChosen.feedback;
            }
          	if(question.answer == question.correct_answer){
          		question.answerIsCorrect = true;
          	}

          }

          if (!!question.correct_units){
            if (question.units == question.correct_units){
              question.unitsIsCorrect = true;
            }
          } else {
            question.unitsIsCorrect = true;
          }
        }
      });
    },

    generateReport: function() {
      var $tbl = $('<table>').attr('id', 'basicTable');

      $tbl.append(
        $('<tr>').append(
          $('<th>').text("Question"),
          $('<th>').text("Your answer"),
          $('<th>').text("Correct answer"),
          $('<th>').text("Score"),
          $('<th>').text("Notes")
        )
      );

      var totalScore = 0;
      var totalPossibleScore = 0;

      $.each(this.questions, function(i, question){
        var answer = !!question.answer ? question.answer + (!!question.units ? " "+question.units : '') : '';
        var correctAnswer = question.correct_answer + (!!question.correct_units ? " "+question.correct_units : '');
        var score;
        if (question.points_earned > -1){
          score = question.points_earned;
        } else {
          score = question.answerIsCorrect && question.unitsIsCorrect ? question.score : 0;
        }
        totalScore += score;
        totalPossibleScore += question.score;
        var feedback = "";


        if(!question.feedback){
        	if (answer === '') {

        	} else if (!question.answerIsCorrect){
        	  feedback += "The value was wrong";
        	  if (!question.unitsIsCorrect){
        	    feedback += " and the units were wrong";
        	  }
        	} else if (!question.unitsIsCorrect){
        	  feedback += "The units were wrong";
        	}
        } else {
          feedback = question.feedback;
        }


        $tbl.append(
          $('<tr>').append(
            $('<td>').text(question.shortPrompt),
            $('<td>').html(answer),
            $('<td>').html(correctAnswer),
            $('<td>').text(score +"/" + question.score),
            $('<td>').text(feedback)
          )
        );
      });

      $tbl.append(
        $('<tr>').append(
          $('<th>').text("Total Score:"),
          $('<th>').text(""),
          $('<th>').text(""),
          $('<th>').text(totalScore + "/" + totalPossibleScore),
          $('<th>').text("")
        )
      );

      return $tbl;
    },

    _round: function(num, dec) {
    	var result = Math.round( Math.round( num * Math.pow( 10, dec + 1 ) ) / Math.pow( 10, 1 ) ) / Math.pow(10,dec);
    	return result;
    },

    _sigFigs: function(n, sig) {
        var mult = Math.pow(10,
            sig - Math.floor(Math.log(n) / Math.LN10) - 1);
        return Math.round(n * mult) / mult;
    },

    readingHintPath: sparks.config.root_dir + '/common/resources/hint1_colorcode.html',
    measuringHintPath: sparks.config.root_dir + '/common/resources/hint1_dmm.html'

  };
})();

/* FILE activity.js */

(function () {

    var sm = sparks.activities.sm;
    var flash = sparks.flash;
    var str = sparks.string;
    var util = sparks.util;

    sparks.activity_base_url = "http://couchdb.cosmos.concord.org/sparks/_design/app/_show/activity/";
    sparks.activity_images_base_url = "http://couchdb.cosmos.concord.org/sparks/";

    sparks.config.flash_id = 'breadboardActivity1';

    sparks.config.debug = jQuery.url.param("debug") !== undefined;

    sm.Activity = function () {
        sm.Activity.uber.init.apply(this);

        sparks.flash.activity = this;
    };

    sparks.config.Activity = sparks.activities.sm.Activity;

    sparks.extend(sm.Activity, sparks.Activity, {

        onDocumentReady: function () {
          console.log("document ready")
            var self = this;

            var jsonActivityName = window.location.hash;
            jsonActivityName = jsonActivityName.substring(1,jsonActivityName.length);
            if (!jsonActivityName){
              jsonActivityName = "series-interpretive";
            }

            if (sparks.debug && !!sparks.jsonActivity){
              self.activityLoaded();
            } else {
              console.log("loading script for "+jsonActivityName);
              var self = this;
              $.getScript(sparks.activity_base_url+jsonActivityName, function() {
                if (!sparks.jsonActivity){
                  console.log("Activity failed to load from "+sparks.activity_base_url+jsonActivityName);
                  return;
                }
                sparks.jsonActivity.activity_url = sparks.activity_base_url+jsonActivityName
                sparks.jsonActivity.images_url = sparks.activity_images_base_url+jsonActivityName
                self.activityLoaded();
              });
            }
        },

        activityLoaded: function() {
          console.log("ENTER: activityLoaded")
          if (!!sparks.jsonActivity.circuit && !sparks.jsonActivity.hide_circuit){
            this.loadFlash();
          } else {
            this.onActivityReady();
          }
        },

        loadFlash: function () {
          $('#breadboard').flash({
              src: 'breadboardActivity1.swf',
              id: 'breadboardActivity1',
              name: 'breadboardActivity1',
              width: 900,
              height: 600,
              quality: 'high',
              allowFullScreen: false,
              allowScriptAccess: 'sameDomain'
          });
        },

        onActivityReady: function () {
          console.log("activity ready")
          $('#title').text(sparks.jsonActivity.title);

          var ac = new sparks.ActivityConstructor(sparks.jsonActivity);

          ac.layoutActivity();

          if (!!sparks.jsonActivity.circuit && !sparks.jsonActivity.hide_circuit){
            this.multimeter = new sparks.circuit.Multimeter2();

            if (sparks.jsonActivity.show_multimeter === "true"){
              sparks.flash.sendCommand('set_multimeter_visibility','true');
              sparks.flash.sendCommand('set_probe_visibility','true');

              if(sparks.jsonActivity.disable_multimeter_position){
                this.multimeter.set_disable_multimeter_position(sparks.jsonActivity.disable_multimeter_position);
              }
            }
          }


          if (sparks.config.debug) {
              $('.debug_area').show();
          }
          else {
             $('.debug_area').hide();
          }
          $('#popup').hide();
          $('.next_button').click(function () {
              window.location.reload();
          });

          this.root_dir = sparks.config.root_dir + '/activities/module-2';
          $('body').scrollTop(0); //scroll to top

          this.forms = $('form');
          this.questionsArea = $('#questions_area');
          this.reportArea = $('#report_area').hide();

          var self = this;


          this.startTry();
        },

        onFlashReady: function () {
        },


        startTry: function () {
            $('.next_button').hide();

            var options = null;

            if (!sparks.jsonActivity.hide_circuit){
              breadModel('updateFlash');
            }

            this.currentQuestion = 0;

            $('.next-questions').attr('disabled', 'disabled');
        },

        completedTry: function () {
            this.logResults();
            this.questionsArea.hide();
            this.reportArea.show();
            $('.next_button').show();
        },

        resetCircuit: function () {
        },



        logResults: function () {
          console.log("generatingReport");
          var pc = new sparks.SparksPageController();
          var $report = pc.createReportForPage(sparks.sparksActivity.pages[0]);
          this.reportArea.append($report);
        },

        receiveEvent: function (name, value, time) {
            console.log('ENTER sm.Activity#receiveEvent');
            console.log('Received: ' + name + ', ' + value + ', ' + new Date(parseInt(time, 10)));

            var v;
            var t = '';
            var args = value.split('|');

            if (name === 'connect') {
                if (args[0] === 'probe') {
                    if (args[1] === 'probe_red') {
                        this.multimeter.redProbeConnection = args[2];
                    }
                    else if (args[1] === 'probe_black') {
                        this.multimeter.blackProbeConnection = args[2];
                    }
                    else {
                        alert('Activity#receiveEvent: connect: unknonw probe name ' + args[1]);
                    }
                }
                if (args[0] === 'component') {
                    if (!!args[2]){
                      breadModel('unmapHole', args[2]);
                    }
                }
                this.multimeter.update();
            } else if (name === 'disconnect') {
                if (args[0] === 'probe') {
                    if (args[1] === 'probe_red') {
                        this.multimeter.redProbeConnection = null;
                    }
                    else if (args[1] === 'probe_black') {
                        this.multimeter.blackProbeConnection = null;
                    }
                    else {
                        alert('Activity#receiveEvent: disconnect: Unknonw probe name ' + args[1]);
                    }
                } else if (args[0] === 'component') {
                  var hole = args[2];
                  var newHole = breadModel('getGhostHole', hole+"ghost");

                  breadModel('mapHole', hole, newHole.nodeName());
                }
                this.multimeter.update();
            } else if (name === 'probe') {
                $('#popup').dialog();

                v = breadModel('query', 'voltage', 'a23,a17');
                t += v.toFixed(3);
                v = breadModel('query', 'voltage', 'b17,b11');
                t += ' ' + v.toFixed(3);
                v = breadModel('query', 'voltage', 'c11,c5');
                t += ' ' + v.toFixed(3);
                $('#dbg_voltage').text(t);

                breadModel('move', 'wire1', 'left_positive1,a22');

                v = breadModel('query', 'resistance', 'a23,a17');
                t = v.toFixed(3);
                v = breadModel('query', 'resistance', 'b17,b11');
                t += ' ' + v.toFixed(3);
                v = breadModel('query', 'resistance', 'c11,c5');
                t += ' ' + v.toFixed(3);

                $('#dbg_resistance').text(t);

                v = breadModel('query', 'current', 'a22,a23');
                t = v.toFixed(3);

                breadModel('move', 'wire1', 'left_positive1,a23');
                breadModel('move', 'resistor1', 'a23,a16');
                v = breadModel('query', 'current', 'a16,b17');
                t += ' ' + v.toFixed(3);

                breadModel('move', 'resistor1', 'a23,a17');
                breadModel('move', 'resistor2', 'b17,b10');
                v = breadModel('query', 'current', 'b10,c11');
                t += ' ' + v.toFixed(3);

                breadModel('move', 'resistor2', 'b17,b11');

                $('#dbg_current').text(t);

                $('#popup').dialog('close');
            } else if (name == 'multimeter_dial') {
                console.log('changed multimeter dial'+value);
                this.multimeter.dialPosition = value;
                this.multimeter.update();
            } else if (name == 'multimeter_power') {
                this.multimeter.powerOn = value == 'true' ? true : false;
                this.multimeter.update();
            }
        }

    });

})();