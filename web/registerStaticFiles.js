/* eslint-disable capitalized-comments */
/* eslint-disable max-len */
/* eslint-disable n/no-missing-import */

/* eslint-disable @stylistic/max-len */
// The content file is returned as is
import Courier from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Courier.afm';
// import CourierBold from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Courier-Bold.afm'
// import CourierBoldOblique from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Courier-BoldOblique.afm'
// import CourierOblique from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Courier-Oblique.afm'
import Helvetica from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Helvetica.afm';
// Import HelveticaBold from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Helvetica-Bold.afm'
// import HelveticaBoldOblique from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Helvetica-BoldOblique.afm'
// import HelveticaOblique from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Helvetica-Oblique.afm'
// import Symbol from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Symbol.afm'
// import TimesBold from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Times-Bold.afm'
// import TimesBoldItalic from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Times-BoldItalic.afm'
// import TimesItalic from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Times-Italic.afm'
import TimesRoman from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/Times-Roman.afm';
// Import ZapfDingbats from 'bundle-text:./node_modules/quence/node_modules/pdfkit/js/data/ZapfDingbats.afm'
/* eslint-enable @stylistic/max-len */

// The fs here is not node fs but "./virtual-fs.js"
import fs from 'fs';

// fs.writeFileSync('Courier-Bold.afm', CourierBold)
// fs.writeFileSync('Courier-BoldOblique.afm', CourierBoldOblique)
// fs.writeFileSync('Courier-Oblique.afm', CourierOblique)
fs.writeFileSync('Courier.afm', Courier);
// fs.writeFileSync('Helvetica-Bold.afm', HelveticaBold)
// fs.writeFileSync('Helvetica-BoldOblique.afm', HelveticaBoldOblique)
// fs.writeFileSync('Helvetica-Oblique.afm', HelveticaOblique)
fs.writeFileSync('Helvetica.afm', Helvetica);
// fs.writeFileSync('Symbol.afm', Symbol)
// fs.writeFileSync('Times-Bold.afm', TimesBold)
// fs.writeFileSync('Times-BoldItalic.afm', TimesBoldItalic)
// fs.writeFileSync('Times-Italic.afm', TimesItalic)
fs.writeFileSync('Times-Roman.afm', TimesRoman);
// fs.writeFileSync('ZapfDingbats.afm', ZapfDingbats)
