class LogEvent {
  CLICKED_TUTORIAL = "Clicked tutorial";
  CHANGED_TUTORIAL = "Changed tutorial";
  BLEW_FUSE = "Blew fuse";
  DMM_MEASUREMENT = "DMM measurement";
  CHANGED_CIRCUIT = "Changed circuit";
  ATTACHED_PROBE = "Attached probe";
  DETACHED_PROBE = "Detached probe";
  DROPPED_PROBE = "Dropped probe";
  MOVED_DMM_DIAL = "Moved DMM dial";
  OSCOPE_MEASUREMENT = "OScope measurement";
  OSCOPE_V1_SCALE_CHANGED = "OScope V1 scale changed";
  OSCOPE_V2_SCALE_CHANGED = "OScope V2 scale changed";
  OSCOPE_T_SCALE_CHANGED = "OScope T scale changed";
  constuctor(name, value, time) {
    this.name = name;
    this.value = value;
    this.time = time;
  }
}

module.exports = LogEvent;
