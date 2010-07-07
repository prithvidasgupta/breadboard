﻿﻿package {

    import flash.display.Loader;
    import flash.display.MovieClip;
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.MouseEvent;
    import flash.geom.ColorTransform;
    import flash.net.URLRequest;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.media.SoundTransform;
    
    import Globe;
    
    // Resistor 4 band
    public class ResistorBase extends DragItShift {
        
        private var leftEnd:ResistorLead;
        private var rightEnd:ResistorLead;
        
        private var m_bandCount:int;
        private var m_resistanceValue:Number = NaN;
        private var m_pngBandSuffix:String;
        
        private var bandOneColor:String = "blue";
        private var bandTwoColor:String = "blue";
        private var bandThreeColor:String = "blue";
        private var bandFourColor:String = "blue";
        private var bandToleranceColor:String = "blue";
        
        private var componentName:String;
        
        //////////public variables for breadboard probeQuery_handler
        public var blackProbeOnRight:Boolean = false;
        public var redProbeOnRight:Boolean = false;
        public var blackProbeOnLeft:Boolean = false;
        public var redProbeOnLeft:Boolean = false;
        
        private var sndClickIt:clickit3;
        private var sndClickItChannel:SoundChannel;
        private var transform1:SoundTransform=new SoundTransform();
        
        private var resistorTipLeftX:Number;
        private var resistorTipLeftY:Number;
        private var resistorTipRightX:Number;
        private var resistorTipRightY:Number;
        
        private var currentHoleOne:MovieClip = null;
        private var currentHoleTwo:MovieClip = null;
        
        private var resistorLeftLocation:String;
        private var resistorRightLocation:String;
        
        //variables to hold value of resistorLeft and RightLocations for probe functions
        private var resistorLeftCoordinates:String;
        private var resistorRightCoordinates:String;
        
        private var localProbeBlackLeftLocation:String = null;
        private var localProbeBlackRightLocation:String = null;
        private var localProbeRedLeftLocation:String = null;
        private var localProbeRedRightLocation:String = null;
    
        //KPC variables to adjust color for probe engaged and rollovers
        private var rolloverColor:ColorTransform = new ColorTransform();
        private var engagedColor:ColorTransform = new ColorTransform();
        private var originalColor:ColorTransform = new ColorTransform();
    
        private var m_bandOneLoader:Loader = null;
        private var m_bandTwoLoader:Loader = null;
        private var m_bandThreeLoader:Loader = null;
        private var m_bandFourLoader:Loader = null;
        private var m_bandToleranceLoader:Loader = null;
        
        public function ResistorBase(bandCount:int, pngBandSuffix:String) {
            rolloverColor.redOffset = 0;
            rolloverColor.greenOffset = 0;
            rolloverColor.blueOffset = 255;

            engagedColor.redOffset = 80;
            engagedColor.greenOffset = 60;
            engagedColor.blueOffset = 0;
            
            originalColor.redOffset = 0;
            originalColor.greenOffset = 0;
            originalColor.blueOffset = 0;
            
            leftEnd = new ResistorLeftLead(this.name + '_left',
                this.getChildByName('resistorEndLeft'),
                this.getChildByName('resistor_rollover_left'),
                this.getChildByName('probe_engaged_left'),
                this.getChildByName('resistorEndLeftBroken'),
                rolloverColor, engagedColor, originalColor,
                this.getChildByName('leftBreak'),
                this.getChildByName('leftRestore'));
            
            rightEnd = new ResistorRightLead(this.name + '_right',
                this.getChildByName('resistorEndRight'),
                this.getChildByName('resistor_rollover_right'),
                this.getChildByName('probe_engaged_right'),
                this.getChildByName('resistorEndRightBroken'),
                rolloverColor, engagedColor, originalColor,
                this.getChildByName('rightBreak'),
                this.getChildByName('rightRestore'));

            m_bandCount = bandCount;
            m_pngBandSuffix = pngBandSuffix;
            
            //testResistorTips();
            
            this.addEventListener(Event.ADDED_TO_STAGE, added_to_stage_handler);
            this.addEventListener(Event.REMOVED_FROM_STAGE, removed_from_stage_handler);
            this.addEventListener(Event.ENTER_FRAME, resistorLocationInitialValues)
        
            if (stage != null) {
                stage.addEventListener(MouseEvent.MOUSE_UP, mouseUpHandler);
                stage.addEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
            }
        }
        
        public function getEnds():Array {
            return [leftEnd, rightEnd];
        }
        
        public function getLeftEnd():ResistorLead {
            return leftEnd;
        }
        
        public function getRightEnd():ResistorLead {
            return rightEnd;
        }
        
        private function mouseUpHandler(mevt:MouseEvent):void
        {
            onResistorMove_handler(mevt);
        }
        
        private function mouseMoveHandler(mevt:MouseEvent):void {
        }
        
        private function added_to_stage_handler(evt:Event):void
        {
            stage.addEventListener(MouseEvent.MOUSE_UP, mouseUpHandler);
            stage.addEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
        }
        
        private function removed_from_stage_handler(evt:Event):void
        {
            stage.removeEventListener(MouseEvent.MOUSE_UP, mouseUpHandler);
            stage.removeEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
        }
        
        private function resistorLocationInitialValues(event:Event):void
        {
            resistorTipLeftX = this.x + (getChildByName("resistorEndLeft").x - getChildByName("resistorEndLeft").width);
            resistorTipLeftY = this.y + getChildByName("resistorEndLeft").y;
            resistorTipRightX = this.x + (getChildByName("resistorEndRight").x + getChildByName("resistorEndRight").width);
            resistorTipRightY = this.y + getChildByName("resistorEndRight").y;
            resistorOnBoard();
            //  replace 'color string' with the actual values of the resistors in ohms.
            //componentName = ExternalInterface.call('breadModel', 'insert', 'resistor', resistorLeftLocation + ',' + resistorRightLocation, bandOneColor + ',' + bandTwoColor + ',' + bandThreeColor + ',' + bandFourColor);
            removeEventListener(Event.ENTER_FRAME, resistorLocationInitialValues);
        }
        
        public function resistorOnBoard():void {
            trace('ENTER ResistorBase#resistorOnBoard');
            
            if (currentHoleOne !== null) {
                currentHoleOne.gotoAndStop(1);
                currentHoleOne = null;
            }
            
            if (currentHoleTwo !== null ) {
                currentHoleTwo.gotoAndStop(1);
                currentHoleTwo = null;
            }
            
            //for every row ...
            if (parent != null && MovieClip(parent).rows != null) {
                
                var boardRow:String;
                var h:MovieClip;
            
                for (var rowNum:int = 1; rowNum <= 10; rowNum++) {
                    //start at left of grid
                    //accessing the list of row by index
                    var row:Array = MovieClip(parent).rows[rowNum]; 
                    
                    //for every hole in the row...
                    for (var holeNum:int = 1; holeNum <= 30; holeNum++) {
                        h = row[holeNum];
                        //trace("h.x = " + h.x + " " + "h.y = " + h.y);
                        boardRow = String.fromCharCode("a".charCodeAt(0) + rowNum - 1);
                        
                        if (resistorTipLeftX > h.x &&  resistorTipLeftX < h.x + 12  &&  resistorTipLeftY > h.y &&  resistorTipLeftY < h.y + 12) {
                            currentHoleOne = h;
                            h.gotoAndStop(2);
                            resistorLeftLocation = boardRow + holeNum;
                            trace (this.name + " " + resistorLeftLocation + " Left On" );
                            //trace("resistorTipLeftY = " + resistorTipLeftY + " h.y = " + h.y);
                            //trace(this.name + " Row = " + boardRow + " Column = " + holeNum + " Left Side On");
                        }
                        else if (  (resistorTipRightX > h.x) &&  (resistorTipRightX < h.x + 12)  &&  (resistorTipRightY > h.y) &&  (resistorTipRightY < h.y + 12) ) {
                            currentHoleTwo = h;
                            h.gotoAndStop(2);
                            resistorRightLocation = boardRow+holeNum;
                            trace (this.name + " " + resistorRightLocation + " Right On" );
                            //trace(this.name + " Row = " + boardRow + " Column = " + holeNum + " Left Side On");
                        }
                        else {
                            resistorLeftLocation = "empty";
                            resistorRightLocation = "empty";
                        }
                    
                        if (resistorLeftLocation != "empty") {
                            resistorLeftCoordinates = resistorLeftLocation;
                        }
                        
                        if (resistorRightLocation != "empty") {
                            resistorRightCoordinates = resistorRightLocation;
                        }
                    }
                }
            }
            //trace(this.name  +  " " + "resistorLeftCoordinates" +  " " + resistorLeftCoordinates);
//            trace(this.name  +  " " + "resistorRightCoordinates" + " " + resistorRightCoordinates);
            //Globe.resistance = ExternalInterface.call('breadModel', 'query', 'voltage', resistorLeftLocation + "," + resistorRightLocation, '200k');
            
            leftEnd.setLocation(resistorLeftCoordinates);
            rightEnd.setLocation(resistorRightCoordinates);
        }
        
        private function onResistorMove_handler(event:MouseEvent):void
        {
            var newResistorTipLeftX:Number = this.x + (getChildByName("resistorEndLeft").x - (getChildByName("resistorEndLeft").width) );
            var newResistorTipLeftY:Number = this.y + getChildByName("resistorEndLeft").y;
            var newResistorTipRightX:Number = this.x + (getChildByName("resistorEndRight").x + (getChildByName("resistorEndRight").width) );
            var newResistorTipRightY:Number = this.y + getChildByName("resistorEndRight").y;
            
        //    trace( this.name + " x= " + this.x);    
        //    trace( this.name + " y= " + this.y);    
            
            if ((newResistorTipLeftX != resistorTipLeftX) || (newResistorTipLeftY != resistorTipLeftY) )
            {
                resistorTipLeftX = newResistorTipLeftX;
                resistorTipLeftY = newResistorTipLeftY;
                resistorTipRightX = newResistorTipRightX;
                resistorTipRightY = newResistorTipRightY;
                this.resistorOnBoard();
                //ExternalInterface.call('breadModel', 'move', componentName, resistorLeftLocation + ',' + resistorRightLocation);
                
                //trace( this.name + " x= " + resistorTipLeftX + " y= " + resistorTipLeftY);
            }
            
            else if ((newResistorTipRightX != resistorTipRightX) || (newResistorTipRightY != resistorTipRightY) )
            {
                resistorTipLeftX = newResistorTipLeftX;
                resistorTipLeftY = newResistorTipLeftY;
                resistorTipRightX = newResistorTipRightX;
                resistorTipRightY = newResistorTipRightY;
                this.resistorOnBoard();
                //ExternalInterface.call('breadModel', 'move', componentName, resistorLeftLocation + ',' + resistorRightLocation);
                    
                //trace( this.name + " x= " + resistorTipLeftX + " y= " + resistorTipLeftY);
            }
        }

        public function setColorBands(colors:Array) {

            const toleranceBandName:String = (m_bandCount > 4) ? "band5" : "band4";
            
            if (m_bandOneLoader != null)
                Sprite(this.getChildByName("band1")).removeChild(m_bandOneLoader);
            if (m_bandTwoLoader != null)
                Sprite(this.getChildByName("band2")).removeChild(m_bandOneLoader);
            if (m_bandThreeLoader != null)
                Sprite(this.getChildByName("band3")).removeChild(m_bandOneLoader);
            if (m_bandFourLoader != null)
                Sprite(this.getChildByName("band4")).removeChild(m_bandOneLoader);
            if (m_bandToleranceLoader != null)
                Sprite(this.getChildByName(toleranceBandName)).removeChild(m_bandToleranceLoader);
        
            //load image into Band1
            m_bandOneLoader = new Loader(); 
            Sprite(this.getChildByName("band1")).addChild(m_bandOneLoader); 
            var bandOneBitmap:URLRequest = new URLRequest(m_pngBandSuffix + "/t_" + colors[0] + ".png"); 
            m_bandOneLoader.load(bandOneBitmap); 
            
            //load image into Band2
            m_bandTwoLoader = new Loader(); 
            Sprite(this.getChildByName("band2")).addChild(m_bandTwoLoader); 
            var bandTwoBitmap:URLRequest = new URLRequest(m_pngBandSuffix + "/s_" + colors[1] + ".png"); 
            m_bandTwoLoader.load(bandTwoBitmap); 
            
            //load image into Band3
            m_bandThreeLoader = new Loader(); 
            Sprite(this.getChildByName("band3")).addChild(m_bandThreeLoader); 
            var bandThreeBitmap:URLRequest = new URLRequest(m_pngBandSuffix + "/s_" + colors[2] + ".png"); 
            m_bandThreeLoader.load(bandThreeBitmap);
            
            //load image into Band4
            m_bandFourLoader = new Loader(); 
            Sprite(this.getChildByName("band4")).addChild(m_bandFourLoader); 
            var bandFourBitmap:URLRequest = new URLRequest(m_pngBandSuffix + "/s_" + colors[3] + ".png"); 
            m_bandFourLoader.load(bandFourBitmap); 

            //load image into Band5
            if (colors.length > 4) {
              m_bandToleranceLoader = new Loader();
              Sprite(this.getChildByName(toleranceBandName)).addChild(m_bandToleranceLoader);
              var bandToleranceBitmap:URLRequest = new URLRequest(m_pngBandSuffix + "/s_" + colors[4] + ".png");
              m_bandToleranceLoader.load(bandToleranceBitmap);
            }
        }

    //NOTES
    //enter values because resistor is smaller on screen yet program looks at true values 
    //var hotspotWidth:Number = 12;
    //var hotspotHeight:Number = 3.4;
    //var resistorBodyWidth:Number = 43;
    //resistor rollover left x = .8
    //resistor rollover left y = 7.3
    //resistor rollover right x = 
    //hard code rollover and resistorTip values based on resistor width of 67
    //use resistor_sm.fla for guidance - set size to desired size of resistor
    //use testResistorTips to tweak resistorTip x and y values
    
        
    }
}