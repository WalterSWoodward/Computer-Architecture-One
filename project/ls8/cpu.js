/**
 * LS-8 v2.0 emulator skeleton code
 */

// ========= opcode variables (for readability) ====== //

// '0b' denotes that this is a binary number
// '10011001' is the machine code for LDI - found in LS8-SPEC
// Ex. (MUL) breakdown: 0b-10-1-01-010
// '0b' -- this is a binary #
// '10' -- with 2 operands
// '1' -- it is an ALU operation
// '01' -- Category 1
// '010' -- Instruction 2

const ADD = 0b10101000;
const ADDI = 0b10101111;
const AND = 0b10110011;
const CALL = 0b01001000;
const CALLI = 0b01001001;
const CMP = 0b10100000;
const CMPI = 0b10100001;
const CLR = 0b00000100;
const CPY = 0b10000100;
const DEC = 0b01111001;
const DIV = 0b10101011;
const DRW = 0b10000110;
const DRWB = 0b10001110;
const HLT = 0b00000001;
const INC = 0b01111000;
const INT = 0b01001010;
const IRET = 0b00001011;
const JEQ = 0b01010001;
const JEQI = 0b01011111;
const JGT = 0b01010100;
const JGEI = 0b01110100;
const JGTI = 0b01010110;
const JLT = 0b01010011;
const JMP = 0b01010000;
const JMPI = 0b01010111;
const JNE = 0b01010010;
const LD = 0b10011000;
const LDI = 0b10011001;
const MOD = 0b10101100;
const MUL = 0b10101010;
const NOP = 0b00000000;
const NOT = 0b01110000;
const OR = 0b10110001;
const POP = 0b01001100;
const PRA = 0b01000010;
const PRN = 0b01000011;
const PUSH = 0b01001101;
const RET = 0b00001001;
const SET = 0b00101001;
const ST = 0b10011010;
const SUB = 0b10101001;
const SUBI = 0b10111001;
const XOR = 0b10110010;

// reserved numeric registers:
const FL = 4;
const IM = 5;
const IS = 6;
const SP = 7;

// Flag input values for CMP:
const FLAG_EQ = 0; // 0b00000001
const FLAG_GT = 1; // 0b00000010
const FLAG_LT = 2; // 0b00000100

/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {
  /**
   * Initialize the CPU
   */
  constructor(ram) {
    this.ram = ram;

    this.reg = new Array(8).fill(0); // General-purpose registers R0-R7

    // Special-purpose registers
    this.PC = 0; // Program Counter

    this.FL = 0;

    // Set start of stack to empty
    // Per the LS8-SPECS aka docs, SP value is stored at 0xf4, or index 244
    this.reg[SP] = 0xf4;

    // this.reg.IR = 0;
    this.handler = [];

    // The value of the variable 'handle_LDI' is equal to the function `handler[LDI]`
    // bind sets the value of 'this' inside the functions themselves to the class CPU
    this.handler[LDI] = this.handle_LDI.bind(this); // Need this appended to front of handle_LDI otherwise handle_LDI not defined
    this.handler[MUL] = this.handle_MUL.bind(this);
    this.handler[PRN] = this.handle_PRN.bind(this);
    this.handler[HLT] = this.handle_HLT.bind(this);
    this.handler[POP] = this.handle_POP.bind(this);
    this.handler[PUSH] = this.handle_PUSH.bind(this);
    this.handler[RET] = this.handle_RET.bind(this);
    this.handler[CALL] = this.handle_CALL.bind(this);
    this.handler[ADD] = this.handle_ADD.bind(this);
    this.handler[CMP] = this.handle_CMP.bind(this);
    this.handler[JGT] = this.handle_JGT.bind(this);
    this.handler[JEQ] = this.handle_JEQ.bind(this);
    this.handler[JNE] = this.handle_JNE.bind(this);
    this.checkFlag = this.checkFlag.bind(this);
  }

  /**
   * Store value in memory address, useful for program loading
   */
  poke(address, value) {
    this.ram.write(address, value);
  }

  /**
   * Starts the clock ticking on the CPU
   */
  startClock() {
    this.clock = setInterval(() => {
      this.tick();
    }, 1); // 1 ms delay == 1 KHz clock == 0.000001 GHz
  }

  /**
   * Stops the clock
   */
  stopClock() {
    clearInterval(this.clock);
  }

  setFlag(flag) {
    this.FL = flag;
  }

  checkFlag(flag) {
    console.log(`CHECKFLAG`);
    if (flag) {
      console.log(`CHECKFLAG TRUE`);
      return true;
    }
  }

  /**
   * ALU functionality
   *
   * The ALU is responsible for math and comparisons.
   *
   * If you have an instruction that does math, i.e. MUL, the CPU would hand
   * it off to it's internal ALU component to do the actual work.
   *
   * op can be: ADD SUB MUL DIV INC DEC CMP
   */
  alu(op, regA, regB) {
    const valA = this.reg[regA];
    const valB = this.reg[regB];
    switch (op) {
      case 'MUL':
        this.reg[regA] = valA * valB;
        break;

      case 'DEC':
        this.reg[regA] -= 1;
        break;

      case 'INC':
        this.reg[regA] += 1;
        break;
      case 'ADD':
        this.reg[regA] = valA + valB;
        break;
      case 'CMP':
        // console.log(`CMP in ALU`); // UNCOMMENT for jgt.ls8
        // console.log(
        //   `valA: ${valA}, valB: ${valB}, FLAG_EQ: ${FLAG_EQ}, FLAG_GT: ${FLAG_GT}, FLAG_LT: ${FLAG_LT}`
        // );
        if (valA > valB) this.setFlag(FLAG_GT); // 1
        if (valA < valB) this.setFlag(FLAG_LT); // 2
        if (valA == valB) this.setFlag(FLAG_EQ); // 0
        break;
    }
  }

  /**
   * Advances the CPU one cycle
   */
  tick() {
    // Load the instruction register (IR--can just be a local variable here)
    // from the memory address pointed to by the PC. (I.e. the PC holds the
    // index into memory of the instruction that's about to be executed
    // right now.)

    const IR = this.ram.read(this.PC); // copy of the currently executing instruction -- starts at 0

    // Debugging output
    // console.log(`${this.PC}: ${IR.toString(2)}`);

    // Get the two bytes in memory _after_ the PC in case the instruction
    // needs them. (see lines 82 - 86 in README for more detailed instructions)

    let operandA = this.ram.read(this.PC + 1);
    let operandB = this.ram.read(this.PC + 2);

    // Execute the instruction. Perform the actions for the instruction as
    // outlined in the LS-8 spec.

    const h = this.handler[IR];

    // console.log('new IR =', IR); // UNCOMMENT to see IR values coming in from file
    if (h === undefined) {
      console.error(`Default Error at PC ${this.PC} : Error`);
      this.stopClock();
      return;
    }

    h(operandA, operandB);
    // can also set `this` correctly by explicitly adding this as a parameter --> h.call(this, operandA, operandB)

    // switch (IR) {
    //   case LDI:
    //     // console.log('its doing LDI');
    //     this.reg[operandA] = operandB;
    //     break;
    //   case PRN:
    //     console.log('PRN: ', this.reg[operandA]);
    //     break;
    //   case MUL:
    //     const result = operandA * operandB;
    //     console.log(result);
    //     break;
    //   case HLT:
    //     // console.log('halting');
    //     this.stopClock();
    //     break;
    //   default:
    //     let defErr = IR.toString(2);
    //     console.error(`Default Error at PC ${this.PC} : ${defErr}`);
    //     this.stopClock();
    //     break;
    // }

    // Increment the PC register to go to the next instruction. Instructions
    // can be 1, 2, or 3 bytes long. Hint: the high 2 bits of the
    // instruction byte tells you how many bytes follow the instruction byte
    // for any particular instruction.

    // console.log(
    //   `current location is: ${this.PC}.  Add ((IR >> 6) + 1) = ${(IR >> 6) +
    //     1} to get next Program Counter address`
    // );
    // MASKING: If you want to shift numbers off of the left side of the binary number, then
    // you can use a mask.  Ex. If you want to turn 00010111 into 00000111, then you
    // can do this --> 00010111 & 00000111.  This is a mask or AND mask. You put 1's
    // where you want to preserve the bits, and 0's where you want to nuke the bits.
    if (
      IR !== JEQ &&
      IR !== CALL &&
      IR !== RET &&
      IR !== JMP &&
      IR !== JGT &&
      IR !== JNE
    ) {
      console.log(`this.PC address changed from ${this.PC}`);
      this.PC += ((IR & 11000000) >>> 6) + 1;
      console.log(`to ${this.PC}`);
    }
  }

  handle_LDI(operandA, operandB) {
    console.log('LDI');
    // if (operandA === 1) {
    //   console.log(`Load R${operandA} to point to Mult2Print at ${operandB}`);
    // } else console.log(`Load R${operandA} to equal ${operandB}`); // UNCOMMENT for call.ls8

    this.reg[operandA] = operandB;
  }

  handle_PRN(regIndex) {
    console.log(`PRN: this.reg[${regIndex}] =`, this.reg[regIndex]);
  }

  handle_HLT() {
    this.stopClock();
  }

  handle_MUL(operandA, operandB) {
    // this.reg[operandA] = operandA * operandB;
    this.alu('MUL', operandA, operandB);
  }

  handle_POP(operandA) {
    this.reg[operandA] = this.ram.read(this.reg[SP]);
    this.alu('INC', SP);
  }

  handle_PUSH(operandA) {
    this.alu('DEC', SP);
    this.ram.write(this.reg[SP], this.reg[operandA]);
  }

  handle_CALL(operandA) {
    console.log('CALL');
    // console.log('REG', this.reg); // UNCOMMENT for call.ls8

    // console.log(
    //   `Currently you will find the RAM address ${
    //     this.reg[SP]
    //   } stored at the REG index ${SP}.  On RAM, the address/index ${
    //     this.reg[SP]
    //   } contains the value ${this.ram.mem[this.reg[SP]]}`
    // ); // UNCOMMENT for call.ls8
    // console.log(
    //   `So we are going to move the stack pointer (SP) from ${this.reg[SP]}`
    // ); // UNCOMMENT for call.ls8
    // this.reg[SP] -= 1; // This works too
    this.alu('DEC', SP);
    // console.log(`to ${this.reg[SP]}`); // UNCOMMENT for call.ls8
    // this.poke(this.reg[SP], this.PC + 2); // also works
    // console.log(`Then we are going to store ${this.PC + 2}`); // UNCOMMENT for call.ls8
    this.ram.write(this.reg[SP], this.PC + 2);
    // console.log(` at this.ram.mem[${this.reg[SP]}]`); // UNCOMMENT for call.ls8
    // console.log(
    //   `Lastly, the currently executing instruction (this.PC) is set to the this.reg[${operandA}] with value ${
    //     this.reg[operandA]
    //   } - Mult2Print`
    // ); // UNCOMMENT for call.ls8
    // console.log('REG', this.reg); // UNCOMMENT for call.ls8
    this.PC = this.reg[operandA];
  }

  handle_RET() {
    console.log('RET');
    this.PC = this.ram.read(this.reg[SP]);
    this.alu('INC', SP);
  }

  handle_ADD(operandA, operandB) {
    // console.log(
    //   `ADD R${[operandA]}(${this.reg[operandA]}) to R${operandB}(${
    //     this.reg[operandB]
    //   })`
    // ); // UNCOMMENT for call.ls8
    this.alu('ADD', operandA, operandB);
  }

  handle_CMP(operandA, operandB) {
    console.log('CMP');
    // console.log(
    //   `Compare the values of R${operandA}(${
    //     this.reg[operandA]
    //   }), with R${operandB}(${this.reg[operandB]})`
    // ); // UNCOMMENT for jgt.ls8
    // console.log(`this.FL updated from ${this.FL}`); // UNCOMMENT for jgt.ls8
    this.alu('CMP', operandA, operandB);
    // console.log(`to ${this.FL}`); // UNCOMMENT for jgt.ls8
    // console.log(`this.PC at end of CMP: ${this.PC}`); // UNCOMMENT for jgt.ls8
  }

  handle_JGT(operandA) {
    // console.log('JGT'); // UNCOMMENT for jgt.ls8
    // console.log(`this.PC before: ${this.PC}`); // UNCOMMENT for jgt.ls8
    if (checkFlag(FLAG_GT)) {
      this.PC = this.reg[operandA];
      // console.log('REG', this.reg); // UNCOMMENT for jgt.ls8
      // console.log(
      //   `this.PC set to this.reg[${operandA}] with value of ${
      //     this.reg[operandA]
      //   }`
      // ); // UNCOMMENT for jgt.ls8
    }
  }
  handle_JEQ(operandA) {
    console.log('JEQ');
    // console.log(
    //   `wants to change this.PC from ${this.PC} to ${this.reg[operandA]}`
    // );
    // console.log(`Will jump if this.FL(${this.FL}) = FLAG_EQ(${FLAG_EQ})`);
    // console.log('this.FL', this.FL);
    // console.log(typeof this.FL, typeof FLAG_EQ);
    if (this.FL == FLAG_EQ) {
      console.log(`SUCCESS: ${this.FL} = ${FLAG_EQ}`);
      this.PC = this.reg[operandA];
    }
  }
  handle_JNE(operandA) {
    console.log('JNE');
    // console.log(`this.IR: ${this.IR}`); // undefined
    if (this.FL !== FLAG_EQ) {
      this.PC = this.reg[operandA];
    }
  }
}

module.exports = CPU;
