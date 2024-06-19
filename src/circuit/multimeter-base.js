const workbenchController = require('../controllers/workbench-controller');
/*
 * Digital Multimeter
 * Base for the Centech DMM
 */
class MultimeterBase {
    modes = { ohmmeter: 0, voltmeter: 1, ammeter: 2 };

    constructor() {


        this.mode = this.modes.ohmmeter;

        this.absoluteValue = 0;   // current absolute meter value
        this.value = 0;           // current real meter value
        this.displayText = '       ';

        this.redProbeConnection = null;
        this.blackProbeConnection = null;
        this.redPlugConnection = null;
        this.blackPlugConnecton = null;
        this.dialPosition = 'acv_750';
        this.powerOn = false;
        this.disabledPositions = [];
        this.hideDisplayText = false;
    }

    // @probe Either "red" or "black"
    // @location hole name (e.g. 'a1') or null
    setProbeLocation(probe, location) {
        if (probe === "probe_red") {
            this.redProbeConnection = location;
        } else if (probe === "probe_black") {
            this.blackProbeConnection = location;
        }
        this.update();
    }

    moveProbe(oldLoc, newLoc) {
        if (this.redProbeConnection === oldLoc) {
            this.redProbeConnection = newLoc;
        }
        if (this.blackProbeConnection === oldLoc) {
            this.blackProbeConnection = newLoc;
        }
        this.update();
    }

    update() {
    }

    updateDisplay() {
        let text = '',
            self = this,
            toSignedDisplayString = function (s, dec) {
                return self.toDisplayString((self.value < 0 ? '-' : '') + s, dec);
            },
            prependHV = function (s) {
                // if there is a leading negative place it in the second position so that both HV and the negative sign will display
                return s.substr(0, 1) === '-' ? 'h-' + text.substring(2) : 'h' + text.substring(1)
            },
            vm, imc, im;

        if (workbenchController.breadboardView && this.hideDisplayText) {
            workbenchController.breadboardView.hideDMMText();
        }

        if (!this.powerOn) {
            this.displayText = '       ';
            return;
        }

        if (this.allConnected()) {
            if (this.dialPosition === 'dcv_20') {
                if (this.absoluteValue < 19.995) {
                    text = (Math.round(this.absoluteValue * 100) * 0.01).toString();
                    text = toSignedDisplayString(text, 2);
                }
                else {
                    text = ' 1 .   ';
                }
                this.currentUnits = "V";

            } else if (this.dialPosition === 'dcv_200') {
                if (this.absoluteValue < 199.95) {
                    text = (Math.round(this.absoluteValue * 10) * 0.1).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1 .   ';
                }
                this.currentUnits = "V";

            } else if (this.dialPosition === 'dcv_1000') {
                if (this.absoluteValue < 999.95) {
                    text = Math.round(this.absoluteValue).toString();
                    text = prependHV(toSignedDisplayString(text, 0));
                }
                else {
                    text = 'h1 .   ';
                }
                this.currentUnits = "V";

            } else if (this.dialPosition === 'dcv_2000m') {
                vm = this.absoluteValue * 1000;
                if (vm < 1999.5) {
                    text = Math.round(vm).toString();
                    text = toSignedDisplayString(text, 0);
                }
                else {
                    text = ' 1 .   ';
                }
                this.currentUnits = "mV";

            } else if (this.dialPosition === 'dcv_200m') {
                vm = this.absoluteValue * 1000;
                if (vm < 195) {
                    text = (Math.round(vm * 100) * 0.01).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1 .   ';
                }
                this.currentUnits = "mV";

            } else if (this.dialPosition === 'acv_200') {
                if (this.absoluteValue < 199.95) {
                    text = (Math.round(this.absoluteValue * 10) * 0.1).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1 .   ';
                }
                this.currentUnits = "V";

            } else if (this.dialPosition === 'acv_750') {
                if (this.absoluteValue < 699.5) {
                    text = (Math.round(this.absoluteValue)).toString();
                    text = prependHV(toSignedDisplayString(text, 0));
                }
                else {
                    text = 'h1 .   ';
                }
                this.currentUnits = "V";

            } else if (this.dialPosition === 'r_200') {
                if (this.absoluteValue < 199.95) {
                    text = (Math.round(this.absoluteValue * 10) * 0.1).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1   . ';
                }
                this.currentUnits = "Ohms";
            } else if (this.dialPosition === 'r_2000') {
                if (this.absoluteValue < 1999.5) {
                    text = Math.round(this.absoluteValue).toString();
                    text = toSignedDisplayString(text, 0);
                }
                else {
                    text = ' 1     ';
                }
                this.currentUnits = "Ohms";
            }
            else if (this.dialPosition === 'r_20k') {
                if (this.absoluteValue < 19995) {
                    text = (Math.round(this.absoluteValue * 0.1) * 0.01).toString();
                    text = toSignedDisplayString(text, 2);
                }
                else {
                    text = ' 1 .   ';
                }
                this.currentUnits = "kOhms";
            }
            else if (this.dialPosition === 'r_200k') {
                if (this.absoluteValue < 199950) {
                    text = (Math.round(this.absoluteValue * 0.01) * 0.1).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1   . ';
                }
                this.currentUnits = "kOhms";
            }
            else if (this.dialPosition === 'r_2000k') {
                if (this.absoluteValue < 1999500) {
                    text = Math.round(this.absoluteValue * 0.001).toString();
                    text = toSignedDisplayString(text, 0);
                }
                else {
                    text = ' 1     ';
                }
                this.currentUnits = "kOhms";
            }
            else if (this.dialPosition === 'dca_200mc') {
                imc = this.absoluteValue * 1000000;
                if (imc < 195) {
                    text = (Math.round(imc * 100) * 0.01).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1     ';
                }
                this.currentUnits = "μA";
            }
            else if (this.dialPosition === 'dca_2000mc') {
                imc = this.absoluteValue * 1000000;
                if (imc < 1950) {
                    text = (Math.round(imc * 10) * 0.1).toString();
                    text = toSignedDisplayString(text, 0);
                }
                else {
                    text = ' 1     ';
                }
                this.currentUnits = "μA";
            }
            else if (this.dialPosition === 'dca_20m') {
                im = this.absoluteValue * 1000;
                if (im < 19.5) {
                    text = (Math.round(im * 100) * 0.01).toString();
                    text = toSignedDisplayString(text, 2);
                }
                else {
                    text = ' 1     ';
                }
                this.currentUnits = "mA";
            }
            else if (this.dialPosition === 'dca_200m') {
                im = this.absoluteValue * 1000;
                if (im < 195) {
                    text = (Math.round(im * 10) * 0.1).toString();
                    text = toSignedDisplayString(text, 1);
                }
                else {
                    text = ' 1     ';
                }
                this.currentUnits = "mA";
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
        text = this.disable_multimeter_position(text);
        if (text !== this.displayText) {
            if (workbenchController.breadboardView) {
                workbenchController.breadboardView.setDMMText(text);
            }
            this.displayText = text;
            this.currentValue = parseFloat(text.replace(/[^\d\.]/g, ""));
        }
    }


    set_disable_multimeter_position(disabled) {
        this.disabledPositions = disabled.split(',');
        for (let i = 0; i < this.disabledPositions.length; i++) {
        }
    }


    disable_multimeter_position(displayText) {
        let i;
        // how do I pass a variable from the "series" file into here?
        // something like: sparks.jsonSection.disable_multimeter_position  ??

        // right now this is hard wired to disable R dial positions
        switch (this.dialPosition) {
            case 'dcv_20':
            case 'dcv_200':
            case 'dcv_1000':
            case 'dcv_2000m':
            case 'dcv_200m':
                for (i = 0; i < this.disabledPositions.length; i++) {
                    if (this.disabledPositions[i] == 'dcv') {
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
                for (i = 0; i < this.disabledPositions.length; i++) {
                    if (this.disabledPositions[i] == 'r') {
                        displayText = '-------';
                        break;
                    }
                }
                break;
            case 'dca_200mc':
            case 'dca_2000mc':
            case 'dca_20m':
            case 'dca_200m':
                for (i = 0; i < this.disabledPositions.length; i++) {
                    if (this.disabledPositions[i] == 'dca') {
                        displayText = '-------';
                        break;
                    }
                }
                break;
            case 'acv_750':
            case 'acv_200':
                for (i = 0; i < this.disabledPositions.length; i++) {
                    if (this.disabledPositions[i] == 'acv') {
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
    }

    toDisplayString(s, dec) {
        //console.log('s1=' + s + ' dec=' + dec);
        let i;
        let sign = s.charAt(0) === '-' ? s.charAt(0) : ' ';
        s = s.replace('-', '');

        //console.log('s2=' + s);
        let pointLoc = s.indexOf('.');
        let decLen = pointLoc == -1 ? 0 : s.substring(pointLoc + 1).length;
        if (decLen === 0) {
            s = s.concat('.');
        }
        //console.log('s3=' + s);
        if (dec < decLen) {
            s = s.substring(0, pointLoc + dec + 1);
        }
        else {
            for (i = 0; i < dec - decLen; ++i) {
                s = s.concat('0');
            }
        }
        //console.log('s4=' + s);
        s = s.replace('.', '');
        //console.log('s5=' + s);
        let len = s.length;
        if (len < 4) {
            for (i = 0; i < 3 - len; ++i) {
                s = '0' + s;
            }
            s = ' ' + s;
        }
        //console.log('s6=' + s);

        let dot1;
        let dot2;

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
        //console.log('s7=' + s);
        return s;

    }

    // Pad 0's to the number text
    // sig: number of significant digits
    // dec: number of digits after decimal points
    formatDecimalString(s, dec) {
        //console.log('s=' + s + ' dec=' + dec);
        let pointLoc = s.indexOf('.');
        //console.log('pointLoc=' + pointLoc);
        let decLen = pointLoc == -1 ? 0 : s.substring(pointLoc + 1).length;
        //console.log('decLen=' + decLen);
        if (decLen === 0) {
            s = s.concat('.');
        }
        if (dec < decLen) {
            s = s.substring(0, pointLoc + dec + 1);
        }
        else {
            for (let i = 0; i < dec - decLen; ++i) {
                s = s.concat('0');
            }
        }
        //console.log('formatDecimalString: formatted=' + s);
        return s;
    }

    getDisplayText() {
        return this.displayText;
    }

    /*
     * Return value to be shown under optimal setting.
     * This value is to be compared with the student answer for grading.
     *
     * Take three significant digits, four if the first digit is 1.
     */
    makeDisplayText(value) {
        let text;
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
    }

    allConnected() {
        return this.redProbeConnection !== null &&
            this.blackProbeConnection !== null &&
            this.redProbeConnection !== this.blackProbeConnection &&
            (this.redPlugConnection === 'voma_port' &&
                this.blackPlugConnection === 'common_port' ||
                this.redPlugConnection === 'common_port' &&
                this.blackPlugConnection === 'voma_port') &&
            this.powerOn;
    }
}


module.exports = MultimeterBase;
