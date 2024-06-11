//= require helpers/string
/* FILE math.js */

let str = {};

str.strip = function (s) {
    s = s.replace(/\s*([^\s]*)\s*/, '$1');
    return s;
};

// Remove a dot in the string, and then remove 0's on both sides
// e.g. '20100' => '201', '0.0020440' => '2044'
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

let math = {};

// Return true if number x is 10^z times y where z is an int
math.equalExceptPowerOfTen = function(x, y) {
    let sx = str.stripZerosAndDots(x.toString());
    let sy = str.stripZerosAndDots(y.toString());

    return sx === sy;
};

 // Get 10's power of the most significant digit.
 // e.g. For 4: 0, for 77: 1, for 3753: 3, for 0.02.
 // NOTE: The most significant digit is assumed to be the first non-zero digit,
 // which may be unacceptable for certain applications.
 // NOTE: x is a non-negative number.
 math.leftMostPos = function (x) {
     x = Number(x);
     if (isNaN(x) || x < 0) {
         console.log('ERROR: math.leftMostPos: Invalid input ' + x);
         return 0;
     }
     if (x === 0) {
         return 0;
     }
     let n = 0;
     let y = x;
     if (x < 1) {
         while (y < 1) {
             y *= 10;
             n -= 1;
         }
     }
     else {
         while (y >= 10) {
             y /= 10;
             n += 1;
         }
     }
     return n;
 };

 // Round x to n significant digits
 // e.g. Returns 12700 for 12678 when n = 3.
math.roundToSigDigits = function(x, n) {
  if (x === 0) {
    return 0;
  }
  let order = Math.ceil(Math.log10(x)),
      factor;

  // Divide into 2 cases to get numerically sane results (i.e., no .xxx999999s)
  if (n - order > 0) {
    // Ex. order of x = 1e-4, n = 3 sig digs: so multiply by 1e7, round, then divide by 1e7
    factor = Math.pow(10, n - order);
    return Math.round(x * factor) / factor;
  } else {
    // Ex. order of x = 1e6, n = 2 sig digs: so divide by 1e4, round, then multiply by 1e4
    factor = Math.pow(10, order - n);
    return Math.round(x / factor) * factor;
  }
};

 // Similar to roundToSigDigits but returns number composed only of the n
 // significant digits; e.g., returns 127 for 12678 when n = 3.
 math.getRoundedSigDigits = function (x, n) {
     return Math.round(x * Math.pow(10, n - math.leftMostPos(x) - 1));
 };


 // *** extend the Math object with useful methods ***

 Math.log10 = function(x){
   return Math.log(x)/Math.LN10;
 };

 Math.orderOfMagnitude = function(x) {
   if (x === 0) return 0;
   return Math.floor( Math.log(Math.abs(x))/Math.LN10 );
 };

 Math.powNdigits = function(x,n){
   return Math.pow(10,Math.floor(Math.log(x)/Math.LN10-n+1));
 };

 // Rounds to n sig figs (including adding on trailing zeros if necessary),
 // and returns a string representation of the number.
 Math.toSigFigs = function(num, sigFigs) {
   num = num.toPrecision(sigFigs);
   return sigFigs > Math.log(num) * Math.LOG10E ? num : ""+parseFloat(num);
 };

 Math.close = function(num, expected, perc) {
   let percentage = perc || 5,
        dif = expected * (percentage/100);
   return (num >= (expected-dif) && num <= (expected+dif));
 };

 // *** extend the Array object with useful methods ***

 Array.max = function( array ){
     return Math.max.apply( Math, array );
 };
 Array.min = function( array ){
     return Math.min.apply( Math, array );
 };

 module.exports = math;

