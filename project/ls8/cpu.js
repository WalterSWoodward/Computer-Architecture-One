/**
 * LS-8 v2.0 emulator skeleton code
 */

// ========= opcode variables (for readability) ====== //

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
    this.reg.PC = 0; // Program Counter
    // this.reg.IR = 0;
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
    switch (op) {
      case 'MUL':
        this.reg[regA] *= this.reg[regB];
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

    const IR = this.ram.read(this.reg.PC); // copy of the currently executing instruction -- starts at 0

    // Debugging output
    // console.log(`${this.reg.PC}: ${IR.toString(2)}`);

    // Get the two bytes in memory _after_ the PC in case the instruction
    // needs them. (see lines 82 - 86 in README for more detailed instructions)

    let operandA = this.ram.read(this.reg.PC + 1);
    let operandB = this.ram.read(this.reg.PC + 2);

    // Execute the instruction. Perform the actions for the instruction as
    // outlined in the LS-8 spec.

    // '0b' denotes that this is a binary number
    // '10011001' is the machine code for LDI - found in LS8-SPEC
    const LDI = 0b10011001;
    const HLT = 0b00000001;
    // breakdown: 0b-10-1-01-010
    // '0b' -- this is a binary #
    // '10' -- with 2 operands
    // '1' -- it is an ALU operation
    // '01' -- Category 1
    // '010' -- Instruction 2
    const MUL = 0b10101010;
    const PRN = 0b01000011;

    switch (IR) {
      case LDI:
        // Per LS8-SPEC:
        // Loads registerA with the value at the address stored in registerB.
        const prev = this.reg[operandA];
        this.reg[operandA] = operandB;
        console.log(
          `operandA value updated with LDI from ${prev} to ${
            this.reg[operandA]
          }`
        );
        break;
      case PRN:
        // Per LS8-SPEC:
        // Print numeric value stored in the given register.
        // Print to the console the decimal integer value that is stored in the
        // given register.
        console.log(
          'operandA loaded and printed inside PRN:',
          this.reg[operandA]
        );
        break;

      case HLT:
        // Per LS8-SPEC:
        // Halt the CPU (and exit the emulator).
        // Per README - emulator should exit auotmatically once clock stops (line 99)
        this.stopClock();
        break;

      case MUL:
        // Per LS8-SPEC:
        // Multiply two registers together and store the result in registerA.
        // Here the 'alu' method is used -- see CPU methods above.
        console.log(
          `calculating ${this.reg[operandA]} * ${this.reg[operandB]} = ...`
        );
        this.alu('MUL', operandA, operandB);
        console.log('ANSWER is:', this.reg[operandA]);
        break;

      default:
        let defErr = IR.toString(2);
        console.error(`Default Error at PC ${this.reg.PC} : ${defErr}`);
        this.stopClock();
        break;
    }

    // Increment the PC register to go to the next instruction. Instructions
    // can be 1, 2, or 3 bytes long. Hint: the high 2 bits of the
    // instruction byte tells you how many bytes follow the instruction byte
    // for any particular instruction.

    if (IR !== CALL && IR !== RET) {
      this.reg.PC += (IR >> 6) + 1;
    }
  }
}

module.exports = CPU;
