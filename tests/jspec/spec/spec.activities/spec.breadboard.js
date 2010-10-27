describe 'Creating a breadboard'
    before
      sparks.config.qucsate_server_url = "http://localhost:1234/sparks/qucsator/solve";
    end
    
    before_each
      getBreadBoard().holeMap = {};
      breadModel('clear');
    end
    
    it "should correctly add components"
      
      // We can add a wire
      breadModel('insert', 'wire', 'a1,a2', 'w1');
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* L1 L2 Z=\"0 Ohm\" L=\"1 mm\" Alpha=\"0 dB\"/).should.be_at_least 0
       
      // We can add a battery, and the wire won't go away
      breadModel('insert', 'battery', 'b2,b3', '3');
      netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/Vdc:battery.* L2 L3 U=\"3 V\"/).should.be_at_least 0   
      netlist.search(/TLIN:wire.* L1 L2 Z=\"0 Ohm\" L=\"1 mm\" Alpha=\"0 dB\"/).should.be_at_least 0    
    end
    
    it "should correctly add components with json props"
    
      // We can add a wire
      breadModel('insertComponent', 'wire', {"connections": "a1,a2"});
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* L1 L2 Z=\"0 Ohm\" L=\"1 mm\" Alpha=\"0 dB\"/).should.be_at_least 0
      
      // We can add a battery with a UID
      breadModel('insertComponent', 'battery', {"UID": "myBattery", "connections": "b2,b3", "voltage": "6"});
      netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/Vdc:myBattery L2 L3 U=\"6 V\"/).should.be_at_least 0   
      netlist.search(/TLIN:wire.* L1 L2 Z=\"0 Ohm\" L=\"1 mm\" Alpha=\"0 dB\"/).should.be_at_least 0
      
      // We can add a resistor with colors
      breadModel('insertComponent', 'resistor', {"UID": "myResistor", "connections": "b3,b4", "colors": "brown,black,brown,gold"});
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:myResistor L3 L4 R=\"100 Ohm\"/).should.be_at_least 0
      board.components["myResistor"].colors.should.be "brown,black,brown,gold"
      
      // We can add a resistor with a resistance
      breadModel('insertComponent', 'resistor', {"UID": "myResistor2", "connections": "b5,b6", "resistance": "200"});
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:myResistor2 L5 L6 R=\"200 Ohm\"/).should.be_at_least 0
      board.components["myResistor2"].colors[0].should.be "red"
      board.components["myResistor2"].colors[3].should.be "gold"
      
      // We can add a resistor with same UID, it will be changed
      breadModel('insertComponent', 'resistor', {"UID": "myResistor2", "connections": "b5,b6", "resistance": "200"});
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:myResistor20/).should.be_at_least 0
      
      // We can add a resistor with a resistance, tolerance and label
      breadModel('insertComponent', 'resistor', {"UID": "myResistor3", "connections": "b5,b6", "resistance": "200", 
                                        "tolerance": "0.01", "label": "R1"});
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:myResistor3 L5 L6 R=\"200 Ohm\"/).should.be_at_least 0
      board.components["myResistor3"].colors[0].should.be "red"
      board.components["myResistor3"].colors[3].should.be "brown"
      board.components["myResistor3"].label.should.be "R1"

    end
    
    it "should correctly remove components"
    
      // We can add a wire
      breadModel('insert', 'wire', 'a1,a2', 'w1');
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* L1 L2 Z=\"0 Ohm\" L=\"1 mm\" Alpha=\"0 dB\"/).should.be_at_least 0
       
      // We can add a battery, and the wire won't go away
      breadModel('insert', 'battery', 'b2,b3', '3');
      netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/Vdc:battery.* L2 L3 U=\"3 V\"/).should.be_at_least 0   
      netlist.search(/TLIN:wire.* L1 L2 Z=\"0 Ohm\" L=\"1 mm\" Alpha=\"0 dB\"/).should.be_at_least 0    
      
      // We can remove the wire
      breadModel('remove', 'wire', 'a1,a2');
      netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.*/).should.be -1
      
      // Removing a battery from wrong location should do nothing
      breadModel('remove', 'battery', 'b2,a2');
      netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/Vdc:battery.*/).should.be_at_least 0
    end
    
    it "should correctly add resistors with colors"
      
      // we can add a 100 ohm resistor
      breadModel('insert', 'resistor', 'a1,a2', 'brown,black,brown,gold');
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:resistor.* L1 L2 R=\"100 Ohm\"/).should.be_at_least 0
      
      // we can add a 4200 ohm resistor
      breadModel('insert', 'resistor', 'b2,b3', 'yellow,red,red,gold');
      netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:resistor.* L2 L3 R=\"4200 Ohm\"/).should.be_at_least 0
    end 
    
    it "should be able to add a random resistor"
      
      // we can add a random resistor
      var res = breadModel('addRandomResistor', 'resistor1', 'a1,a6');
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      var regexp = new RegExp("R:resistor.* L1 L6 R=\""+res.getRealValue()+" Ohm\"");
      netlist.search(regexp).should.be_at_least 0
    end
    
    it 'should be able to add a component with a ghost hole'
      
      breadModel('insert', 'resistor', 'a1,xx', 'brown,black,brown,gold');
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/R:resistor.* L1 xx R="100 Ohm/).should.be_at_least 0
    end
    
    it 'should be able to get holes from breadboard'
      // board holes should be mapped to strip
      var a1Hole = getBreadBoard().getHole('a1');
      a1Hole.nodeName().should.be 'L1'
      
      // board holes in a strip should be the same node
      var b1Hole = getBreadBoard().getHole('a1');
      b1Hole.should.be a1Hole
      
      // should be able to get a hole by passing in a hole instead of a string
      var A1Hole = getBreadBoard().getHole(a1Hole);
      A1Hole.should.be a1Hole
      
      // should be able to make ghost holes
      var xHole = getBreadBoard().getHole('x');
      xHole.nodeName().should.be 'x'
      
      // should be able to map holes to ghost holes
      breadModel('mapHole', 'a2', 'y');
      var a2Hole = getBreadBoard().getHole('a2');
      a2Hole.nodeName().should.be 'y'
    end
    
    it 'should be able to map and unmap hole to a ghost hole'
      breadModel('clear');
      
      // breadModel('insert', 'resistor', 'a1,yy', 'brown,black,brown,gold');
      breadModel('mapHole', "a4", "yy");
      breadModel('insert', 'wire', 'a4,a6');
      
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* yy L6/).should.be_at_least 0
      
      breadModel('clear');
      breadModel('unmapHole', "a4");
      breadModel('insert', 'wire', 'a4,a6');
      
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* L4 L6/).should.be_at_least 0
    end
    
    it 'should be able to map and unmap existing connections'
      
      // breadModel('insert', 'resistor', 'a1,yy', 'brown,black,brown,gold');
      breadModel('insert', 'wire', 'a4,a6');
      
      breadModel('mapHole', "a4", "yy");
      
      var board = getBreadBoard();
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* yy L6/).should.be_at_least 0
      
      breadModel('unmapHole', "a4");
      
      var netlist = sparks.circuit.qucsator.makeNetlist(board);
      netlist.search(/TLIN:wire.* L4 L6/).should.be_at_least 0
    end
    
    
end
