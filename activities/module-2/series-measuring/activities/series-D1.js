sparks.jsonActivity = {
  "title": "Measuring a Series Circuit",
  "show_multimeter": "true",
  "disable_multimeter_position": "r",
  "circuit": [
      {
        "type": "resistor",
        "UID": "r1",
        "connections": "b23,b17",
        "label": "R1",
        "resistance": "100"
      },
      {
        "type": "resistor",
        "UID": "r2",
        "connections": "c17,c11",
        "label": "R2",
        "resistance": "100"
      },
      {
        "type": "resistor",
        "UID": "r3",
        "connections": "d11,d5",
        "label": "R3",
        "resistance": "100"
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
      "prompt": "What are the measured values of",
      "subquestions": [
        {
          "prompt": "V<sub>tot</sub>:",
          "shortPrompt": "Total voltage across R1, R2, and R3",
          "correct_answer": "9",
          "correct_units": "V"
        },
        {
          "prompt": "I<sub>tot</sub>:",
          "shortPrompt": "Current through R1, R2, and R3",
          "correct_answer": "9 / (${r1.nominalResistance} + ${r2.nominalResistance} + ${r3.nominalResistance})",
          "correct_units": "A"
        },
        {
          "prompt": "R<sub>tot</sub>:",
          "shortPrompt": "Total resistance of R1, R2, and R3",
          "correct_answer": "${r1.nominalResistance}+ ${r2.nominalResistance}+ ${r3.nominalResistance}",
          "multichoice": ["value...","[${r1.nominalResistance}]alphabet","${r1.nominalResistance}","${r1.nominalResistance}"]
        }
      ]
    }
  ]
};