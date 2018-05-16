const RAM = require('./ram');
const CPU = require('./cpu');
const fs = require('fs');

/**
 * Load an LS8 program into memory
 *
 * TODO: load this from a file on disk instead of having it hardcoded
 */
function loadMemory() {
  // // Hardcoded program to print the number 8 on the console
  // const program = [
  //   // print8.ls8
  //   //  LDI, R0,8  Store 8 into R0
  //   '10011001', // LDI
  //   '00000000', // R0
  //   '00001000', // R8
  //   // Print (PRN) the value in R0
  //   '01000011', // PRN
  //   '00000000', // R0
  //   // MUL R0, R1
  //   '10101010', // MUL
  //   '00000000', // R0
  //   '00000001', // R1
  //   // Print (PRN) the value in R0
  //   '01000011', // PRN
  //   '00000000', // R0
  //   // HLT = Halt and quit
  //   '00000001' // HLT
  // ];
  // // Load the program into the CPU's memory a byte at a time
  // for (let i = 0; i < program.length; i++) {
  //   console.log(parseInt(program[i], 2));
  //   cpu.poke(i, parseInt(program[i], 2));
  // }

  // ============ My First Solution ============= //

  //   let program = fs.readFileSync(process.argv[2], 'utf8');
  //   program = program.trim().split('\n');
  //   for (let i = 0; i < program.length; i++) {
  //     const comment = program[i].indexOf('#');
  //     if (comment !== -1) {
  //       program[i] = program[i].substr(0, comment).trim();
  //     }
  //     program[i] = program[i].trim();
  //     // console.log(program[i]); // This looks good - comments removed but index 0 and 1 are empty strings
  //   }
  //   program = program.splice(2); // This is not dynamic though...will break if first two lines are not the title and an empty space...
  //   // console.log(program); // YAY!! ^worked!
  //   for (let i = 0; i < program.length; i++) {
  //     if (program[i] !== '') {
  //       // console.log(`${program[i]}`); // Now working!!!
  //       cpu.poke(i, parseInt(program[i], 2));
  //     }
  //   }
  // }

  // ====== 2nd Solution -- extracts binary number from each line! ====== //

  let program = fs.readFileSync(process.argv[2], 'utf8');
  program = program.trim().split('\n');
  codes = [];
  program.forEach(element => {
    if (element.match(/[0-9]{8}/gi)) {
      codes.push(element.slice(0, 8));
    } else return;
  });
  console.log(`CODES`, codes);
  for (let i = 0; i < codes.length; i++) {
    cpu.poke(i, parseInt(codes[i], 2));
  }
}
// ========== Jbry123 - not as clean, but it works - hard to follow ======= //

//   let program = fs.readFileSync(process.argv[2], { encoding: 'binary' });
//   // Remove Comments:
//   while (program.includes('#')) {
//     let startIndex = program.indexOf('#');
//     // console.log(startIndex);
//     if (startIndex > 0) startIndex--;
//     const endIndex = program.indexOf('\n', startIndex);
//     if (endIndex === -1) program = program.slice(0, startIndex);
//     // ???
//     else program = program.slice(0, startIndex) + program.slice(endIndex);
//   }
//   // // trim remaining white space, and split codes at line breaks
//   program = program.trim().split('\n');

//   for (let i = 0; i < program.length; i++) {
//     cpu.poke(i, parseInt(program[i], 2));
//   }
// }

// ========== Awesome Solution by Jkasem! ========== //
//   args = process.argv;
//   try {
//     // Matches any numbers from 0-9, 8 total
//     const regexp = /[0-9]{8}/gi;
//     // Read in file,
//     const program = fs.readFileSync(args[2], 'utf8').match(regexp);
//     // console.log(`program: ${program}`);
//     // console.log(typeof program); // object
//     //Load the program into the CPU's memory a byte at a time
//     for (let i = 0; i < program.length; i++) {
//       // console.log(program[0]);
//       cpu.poke(i, parseInt(program[i], 2));
//     }
//   } catch (err) {
//     console.log('invalid file, try again');
//     process.exit();
//   }
// }

/**
 * Main
 */

let ram = new RAM(256);
let cpu = new CPU(ram);

// TODO: get name of ls8 file to load from command line

loadMemory(cpu);

cpu.startClock();
