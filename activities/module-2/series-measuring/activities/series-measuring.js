sparks.jsonActivity = {
  "title": "Measuring a Series Circuit",
  "show_multimeter": "true",
  //"disable_multimeter_position": "",//"r,dcv,acv,dca,diode,hfe,c_10a,p_9v",
  "circuit": [
      {
        "type": "resistor",
        "UID": "r1",
        "connections": "b23,b17",
        "label": "R1"
        //"resistance": "100"
      },
      {
        "type": "resistor",
        "UID": "r2",
        "connections": "c17,c11",
        "label": "R2"
        //"resistance":"100"
      },
      {
        "type": "resistor",
        "UID": "r3",
        "connections": "d11,d5",
        "label": "R3"
        //"resistance":"200"
      },
      {
        "type": "wire",
        "connections": "left_positive20,a23"
      },
      {
        "type": "wire",
        "connections": "left_negative3,a5"
      }
   ],
  "questions": [
    {
      "prompt": "What is the measured resistance of",
      "subquestions": [
        {
          "prompt": "R<sub>1</sub>:",
          "shortPrompt": "Resistance of R1",
          "correct_answer": "[${r1.resistance}]",
          "correct_units": "ohms"
        },
        {
          "prompt": "R<sub>2</sub>:",
          "shortPrompt": "Resistance of R2",
          "correct_answer": "[${r2.resistance}]",
          "correct_units": "ohms"
        },
        {
          "prompt": "R<sub>3</sub>:",
          "shortPrompt": "Resistance of R3",
          "correct_answer": "[${r3.resistance}]",
          "correct_units": "ohms"
        }
      ]
    },
    {
      "prompt": "What is the total measured resistance across all the resistors? ",
      "shortPrompt": "Total resistance",
      "correct_answer": "[${r1.resistance} + ${r2.resistance} + ${r3.resistance}]",
      "correct_units": "ohms"
    },
    {
      "prompt": "Given that the battery is producing 9 Volts, what is the voltage drop across",
      "subquestions": [
        {
          "prompt": "R<sub>1</sub>:",
          "shortPrompt": "Voltage across R1",
          "correct_answer": "[ 9 * ${r1.resistance} / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "V"
        },
        {
          "prompt": "R<sub>2</sub>:",
          "shortPrompt": "Voltage across R2",
          "correct_answer": "[ 9 * ${r2.resistance} / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "V"
        },
        {
          "prompt": "R<sub>3</sub>:",
          "shortPrompt": "Voltage across R3",
          "correct_answer": "[ 9 * ${r3.resistance} / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "V"
        }
       ]
    },
    {
      "prompt": "What is the current through",
      "subquestions": [
        {
          "prompt": "R<sub>1</sub>:",
          "shortPrompt": "Current through R1",
          "correct_answer": "[ 9 / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "A"
        },
        {
          "prompt": "R<sub>2</sub>:",
          "shortPrompt": "Current through R2",
          "correct_answer": "[ 9 / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "A"
        },
        {
          "prompt": "R<sub>3</sub>:",
          "shortPrompt": "Current through R3",
          "correct_answer": "[ 9 / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "A"
        }
      ]
    },
    {
      "prompt": "What is the voltage across",
      "subquestions": [
        {
          "prompt": "R<sub>1</sub> and R<sub>2</sub>:",
          "shortPrompt": "Voltage across R1 and R2",
          "correct_answer": "[ 9 * (${r1.resistance} + ${r2.resistance}) / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "V"
        },
        {
          "prompt": "R<sub>2</sub> and R<sub>3</sub>:",
          "shortPrompt": "Voltage across R2 and R3",
          "correct_answer": "[ 9 * (${r2.resistance} + ${r3.resistance}) / (${r1.resistance} + ${r2.resistance} + ${r3.resistance})]",
          "correct_units": "V"
        }
      ]
    }
  ]
};