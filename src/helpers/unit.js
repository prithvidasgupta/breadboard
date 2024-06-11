let unit = {};

let u = unit;

u.labels = { ohms: '\u2126', kilo_ohms: 'k\u2126', mega_ohms: 'M\u2126' };

u.toEngineering = function (value, units) {
  value = Number(value);
  let isShort = (units.length === 1 || units === "Hz"),
    prefix = "";

  if (value >= 1000000) {
    prefix = isShort ? "M" : "mega";
    value = u.round(value / 1000000, 2);
  } else if (value >= 1000) {
    prefix = isShort ? "k" : "kilo";
    value = u.round(value / 1000, 2);
  } else if (value === 0) {
    value = 0;
  } else if (value < 0.000000001) {
    prefix = isShort ? "p" : "pico";
    value = u.round(value * 1000000000000, 2);
  } else if (value < 0.000001) {
    prefix = isShort ? "n" : "nano";
    value = u.round(value * 1000000000, 2);
  } else if (value < 0.001) {
    prefix = isShort ? "μ" : "micro";
    value = u.round(value * 1000000, 2);
  } else if (value < 1) {
    prefix = isShort ? "m" : "milli";
    value = u.round(value * 1000, 2);
  } else {
    value = u.round(value, 2);
  }
  units = prefix + units;

  return { "value": value, "units": units };
};

u.round = function (num, dec) {
  let result = Math.round(Math.round(num * Math.pow(10, dec + 2)) / Math.pow(10, 2)) / Math.pow(10, dec);
  return result;
};

u.sigFigs = function (n, sig) {
  let mult = Math.pow(10,
    sig - Math.floor(Math.log(n) / Math.LN10) - 1);
  return Math.round(n * mult) / mult;
};

// returns true if string is of form "50 ohms" or "0.1V"
u.isMeasurement = function (string) {
  let isMeasurementPattern = /^\s?\d+.?\d*\s?\D+\s?$/
  let matched = string.match(isMeasurementPattern);
  return !!matched;
};

/**
* assumes this will be in the form ddd uu
* i.e. a pure number and a unit, separated by an optional space
* '50 ohms' and '50V' are both valid
*/
u.convertMeasurement = function (measurement) {
  if (!this.isMeasurement(measurement)) {
    return measurement
  }

  let numPattern = /\d+\.?\d*/g
  let nmatched = measurement.match(numPattern);
  if (!nmatched) {
    return measurement;
  }
  let value = nmatched[0];

  let unitPattern = /(?=\d*.?\d*)[^\d.\s]+/g
  let umatched = measurement.match(unitPattern);
  if (!umatched) {
    return measurement;
  }
  let unit = umatched[0];

  let eng = u.toEngineering(value, unit)
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
    unit == u.labels.mega_ohms) {
    return true;
  }
  return false;
};

// Return a string with a unit representing the resistance value.
// value: resistance value in ohms
u.res_str = function (value) {
  let vstr, unit, val;

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
  let vstr;
  let unit = u.labels.ohms;

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

u.unitEquivalents = {
  "V": ["v", "volts", "volt", "vol", "vs"],
  "A": ["a", "amps", "amp", "amper", "ampers", "as"],
  "Ohms": ["ohms", "oms", "o", "Ω", "os"],
  "deg": ["deg", "degs", "degree", "degrees", "º"],
  "F": ["f", "farads", "farad", "fared", "fareds", "fered", "fereds", "feret", "ferets", "ferret", "ferrets", "fs"],
  "H": ["h", "henries", "henry", "henrys", "hs"],
  "Hz": ["hz", "herz", "hertz"],
  "%": ["%", "perc", "percent"]
}

u.prefixEquivalents = {
  "femto": ["femto", "fempto", "f"],
  "pico": ["pico", "picco", "p"],
  "nano": ["nano", "nanno", "n"],
  "micro": ["micro", "micron", "μ"],
  "milli": ["mili", "milli", "millli"],
  "kilo": ["kilo", "killo", "killlo", "k"],
  "mega": ["mega", "meg"],
  "giga": ["giga", "gigga", "g"]
};

u.prefixValues = {
  "femto": 1E-15,
  "pico": 1E-12,
  "nano": 1E-9,
  "micro": 1E-6,
  "milli": 1E-3,
  "kilo": 1E3,
  "mega": 1E6,
  "giga": 1E9
};

u.parse = function (string) {
  let value, units, prefix, currPrefix, unit, equivalents, equiv, regex;

  string = string.replace(/ /g, '');                    // rm all whitespace
  string = string.replace(/['";:,/?\\]/g, '');         // rm all non-period, non-dash puncutation
  string = string.replace(/[^\d.-]*(\d.*)/, '$1');      // if there are numbers, if there are letters before them remove them
  value = string.match(/^-?[\d.]+/);                  // find all numbers before the first letter, parse them to a number, store it
  if (value) {
    value = parseFloat(value[0]);
  }
  string = string.replace(/^-?[\d.]*/, '');             // everything after the first value is the units
  string = string.replace(/['";:,./?\\-]/g, '');       // rm all puncutation

  for (unit in this.unitEquivalents) {                // if the unit can be found in the equivalents table, replace
    equivalents = this.unitEquivalents[unit];
    if (equivalents.length > 0) {
      for (let i = 0, ii = equivalents.length; i < ii; i++) {
        equiv = equivalents[i];
        regex = new RegExp('.*(' + equiv + ')$', 'i');
        let hasUnits = string.match(regex)
        if (hasUnits && hasUnits.length > 1) {
          units = unit;
          string = string.replace(hasUnits[1], '');
          break;
        }
      }
    }
    if (units) {
      break;
    }
  }

  if (!units) {
    units = string;
  }

  for (currPrefix in this.prefixEquivalents) {                 // if we can find a prefix at the start of the string, store it and delete it
    equivalents = this.prefixEquivalents[currPrefix];
    if (equivalents.length > 0) {
      for (let i = 0, ii = equivalents.length; i < ii; i++) {
        equiv = equivalents[i];
        regex = new RegExp('^(' + equiv + ').*', 'i');
        let prefixes = string.match(regex);
        if (prefixes && prefixes.length > 1) {
          prefix = currPrefix;
          units = units.replace(prefixes[1], '');
          break;
        }
      }
    }
    if (prefix) {
      break;
    }
  }

  if (!prefix) {                                      // if we haven't found a prefix yet, check for case-sensitive m or M at start
    if (string.match(/^m/)) {
      prefix = "milli";
      units = units.replace(/^m/, "");
    } else if (string.match(/^M/)) {
      prefix = "mega";
      units = units.replace(/^M/, "");
    }
  }

  if (prefix) {
    value = value * this.prefixValues[prefix];        // if we have a prefix, multiply by that;
  }

  if (!value) {
    value = NaN;
  }

  return { val: value, units: units }
};

module.exports = unit;

