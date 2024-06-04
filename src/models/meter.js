class Meter {
  dmm = null;
  oscope = null;
  setProbeLocation(probe, loc) {
    if (this.oscope) {
      this.oscope.setProbeLocation(probe, loc);
    }
    if (this.dmm) {
      this.dmm.setProbeLocation(probe, loc);
    }
  }
  moveProbe(oldLoc, newLoc) {
    if (this.oscope) {
      this.oscope.moveProbe(oldLoc, newLoc);
    }
    if (this.dmm) {
      this.dmm.moveProbe(oldLoc, newLoc);
    }
  }
  update() {
    if (this.oscope) {
      this.oscope.update();
    }
    if (this.dmm) {
      this.dmm.update();
    }
  }
  reset() {
    if (this.oscope && this.oscope.reset) {
      this.oscope.reset();
    }
    if (this.dmm && this.dmm.reset) {
      this.dmm.reset();
    }
  }
}

module.exports = Meter;
