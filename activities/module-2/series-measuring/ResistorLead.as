package {
    
    import flash.display.DisplayObject;
    import flash.display.MovieClip;
    import flash.events.MouseEvent;
    import flash.geom.ColorTransform;
    import flash.geom.Point;
    import flash.geom.Rectangle;
    
    import org.concord.sparks.util.Display;
    
    /* 
     * Represents a lead of the resistor.
     * A resistor has two leads: left and right.
     */
    public class ResistorLead {
        
        public static const ORIGINAL:int = 0;
        public static const ROLL_OVER:int = 1;
        public static const ENGAGED:int = 2;
        
        protected var id:String;
        protected var lead:DisplayObject;
    
        private var rollover:DisplayObject; //highlighted are to be shown when mouse is over the lead
        private var engaged:DisplayObject; //to be shown when the lead is connected to another component
        private var brokenLead:DisplayObject;
    
        private var state:int = ORIGINAL;
        private var brokenState:int = ORIGINAL;
        private var broken:Boolean = false;
        private var location:String; //coordinate on breadboard, e.g. c21
    
        private var rolloverColor:ColorTransform = new ColorTransform();
        private var engagedColor:ColorTransform = new ColorTransform();
        private var originalColor:ColorTransform = new ColorTransform();
        
        private var breakButton:DisplayObject;
        private var restoreButton:DisplayObject;
    
        public function ResistorLead(id:String, lead:DisplayObject,
            rollover:DisplayObject, engaged:DisplayObject, brokenLead:DisplayObject,
            rolloverColor:ColorTransform, engagedColor:ColorTransform, originalColor:ColorTransform,
            breakButton:DisplayObject, restoreButton:DisplayObject)
        {
            //trace('ENTER ResistorLead#ResistorLead');
            this.id = id;
            this.lead = lead;
            this.rollover = rollover;
            this.engaged = engaged;
            this.brokenLead = brokenLead;
            
            //trace('lead.x=' + lead.x + ' lead.y=' + lead.y);
            
            this.rolloverColor = rolloverColor;
            this.engagedColor = engagedColor;
            this.originalColor = originalColor;
            
            this.breakButton = breakButton;
            this.restoreButton = restoreButton;

            rollover.alpha = 0;
            engaged.alpha = 0;
            brokenLead.alpha = 0;
            
            restoreButton.alpha = 0;
            
            breakButton.addEventListener(MouseEvent.MOUSE_UP, onBreak);
        }
        
        public function getId():String {
            return id;
        }
        
        public function isBroken():Boolean {
            return broken;
        }
        
        public function getLocation():String {
            return location;
        }
        
        public function setLocation(loc:String):void {
            location = loc;
        }
        
        public function getState():int {
            return state;
        }
        
        public function getBrokenState():int {
            return brokenState;
        }
        
        public function showRollOver():void {
            rollover.alpha = 1;
        }

        public function hideRollOver():void {
            rollover.alpha = 0;
        }
        
        public function showEngaged():void {
            engaged.alpha = 0.55;
        }

        public function hideEngaged():void {
            trace('ENTER ResistorLead.hideEngaged');
            engaged.alpha = 0;
        }
        
        public function setRollOver():void {
            //trace('ENTER ResistorLead#setRollOver');
            state = ROLL_OVER;
            lead.transform.colorTransform = rolloverColor;
        }
        
        public function setEngaged():void {
            //trace('ENTER ResistorLead#setEngaged');
            state = ENGAGED;
            lead.transform.colorTransform = engagedColor;
        }
        
        public function setOriginal():void {
            //trace('ENTER ResistorLead#setOriginal');
            state = ORIGINAL;
            lead.transform.colorTransform = originalColor;
        }

        public function setBrokenRollOver():void {
            //trace('ENTER ResistorLead#setBrokenRollOver');
            brokenState = ROLL_OVER;
            brokenLead.transform.colorTransform = rolloverColor;
        }
        
        public function setBrokenEngaged():void {
            //trace('ENTER ResistorLead#setBrokenEngaged');
            brokenState = ENGAGED;
            brokenLead.transform.colorTransform = engagedColor;
        }
        
        public function setBrokenOriginal():void {
            //trace('ENTER ResistorLead#setBrokenOriginal');
            brokenState = ORIGINAL;
            brokenLead.transform.colorTransform = originalColor;
        }
        
        private function onBreak(event:MouseEvent):void {
            broken = true;
            breakButton.alpha = 0;
            restoreButton.alpha = 1;
            restoreButton.addEventListener(MouseEvent.MOUSE_UP, onRestore);
            lead.alpha=0;
            lead.x += 1000;
            brokenLead.alpha=1;
            //this.resistorTipLeftX -= 45;
        }
        
        private function onRestore(event:MouseEvent):void {
            broken = false;
            breakButton.alpha=1;
            restoreButton.alpha=0;
            restoreButton.removeEventListener(MouseEvent.MOUSE_UP, onRestore);
            lead.alpha=1;
            lead.x -= 1000;
            brokenLead.alpha=0;
            //this.resistorTipLeftX += 45  ;
        }

        public function inBrokenHotSpot(probe:Probe):Boolean {
            return  brokenLead.alpha == 1 && probe.tip.hitTestObject(brokenLead);
        }

    }
}
