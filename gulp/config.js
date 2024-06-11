const dest = './dist';
const src = './src';
const common = './common';
const jquery = './lib/jquery/css';

module.exports = {
  app: {
    src: src + '/**/*.js',
    init: src + '/init.js',
    dest: dest + '/js'
  },
  resources: {
    common: [
        common + '/icons/*.*',
        common + '/images/*.*',
        common + '/resources/*.*',
        common + '/sounds/*.*',
    ],
    jqueryUI: [
      jquery + '/ui-lightness/images/*.*'
    ],
    jqueryUIBase: jquery + '/ui-lightness/',
    commonDest: dest,
    jqueryDest: dest + '/css'
  },
  css: {
    src: [jquery + '/**/*.css', common + '/stylesheets/*.css'],
    dest: dest + '/css'
  },
  dest: dest,
  examples: {
    src: './examples/*.*',
    base: './examples/',
    dest: dest
  }
};
