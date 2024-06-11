//= require circuit/resistor
//= require circuit/variable-resistor
//= require circuit/component

////////////////////////////////////////////////////////////////////////////////
//// B R E A D - B O A R D - M O D E L /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//// BREADBOARD Prototype Model //////////////////////////////////////////////

/* FILE breadboard.js */

const rows = 31,
  powerRailHoles = 25;



class Hole {
  constructor(strip, name) {
    this.type = 'hole';
    this.strip = strip;
    this.name = name;
    this.connections = [];
  }

  nodeName() {
    return this.strip && this.strip.name;
  }

  getName() {
    return this.name;
  }
}

class GhostHole {
  constructor(name) {
    this.name = name;
  }
  nodeName() {
    return this.name;
  }
  getName() {
    return this.name;
  }
}


class Strip {
  constructor(holes, name) {
    this.type = 'strip';
    this.holes = {};
    this.name = name;
    if (holes) {
      for (let i = 0, l = holes; i < l; i++) {
        this.holes['' + i] = new Hole();
        this.holes['' + i].strip = this;
      }
    }
  }
}

class Breadboard {
  constructor() {
    this.type = 'Breadboard';

    this.strips = [];
    this.components = {};
    this.holes = {};
    this.holeMap = {};
    this.faultyComponents = [];

    // Create power-rails
    this.powerRail = {
      left: {
        positive: new Strip(null, "powerPosL"),
        negative: new Strip(null, "gnd")
      },
      right: {
        positive: new Strip(null, "powerPosR"),
        negative: new Strip(null, "gnd")
      }
    };

    for (let i = 0, l = powerRailHoles; i < l; i++) {
      for (let side in this.powerRail) {
        if (!Object.hasOwn(this.powerRail, side)) continue;
        for (let sign in this.powerRail[side]) {
          if (!Object.hasOwn(this.powerRail[side], sign)) continue;
          let h = side + '_' + sign + i;
          this.powerRail[side][sign][h] = this.holes[h] = new Hole(this.powerRail[side][sign], h);
        }
      }
    }

    // Create board
    for (let i = 0, l = rows; i < l; i++) {
      let newStripL = this.makeStrip("L" + i);
      let newStripR = this.makeStrip("R" + i);
      for (let a = 0, ll = 5; a < ll; a++) {
        let mapCode = String.fromCharCode(a + 97) + i;
        newStripL.holes[mapCode] = this.holes[mapCode] = new Hole(newStripL, mapCode);
        mapCode = String.fromCharCode(a + 102) + i;
        newStripR.holes[mapCode] = this.holes[mapCode] = new Hole(newStripR, mapCode);
      }
    }
  }

  makeStrip(name) {
    let stripLen = this.strips.length;
    this.strips[stripLen] = new Strip(null, name);
    return this.strips[stripLen];
  }

  createGhostHole(hole) {
    return new GhostHole(hole);
  }
}

module.exports = Breadboard;
