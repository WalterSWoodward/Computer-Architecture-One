// reserved numeric registers:
const SP = 0b00000111;

// Jump Instruction booleans:
let subroutine = false;
let jump = false;

// Flag input values for CMP:
const FLAG_EQ = 0; // 0b00000001
const FLAG_GT = 1; // 0b00000010
const FLAG_LT = 2; // 0b00000100

class CPU {
  constructor(ram) {
    this.ram = ram;
    this.reg = new Array(8).fill(0);
    this.reg.PC = 0;
    this.reg.FL = 0;
    this.reg[SP] = 0xf4;
  }

  poke(address, value) {
    this.ram.write(address, value);
  }

  startClock() {
    this.clock = setInterval(() => {
      this.tick();
    }, 1); // 1 ms delay == 1 KHz clock == 0.000001 GHz
  }

  stopClock() {
    clearInterval(this.clock);
  }

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
        if (valA > valB) this.reg.FL = FLAG_GT; // 1
        if (valA < valB) this.reg.FL = FLAG_LT; // 2
        if (valA == valB) this.reg.FL = FLAG_EQ; // 0
        break;
    }
  }

  tick() {
    // op-codes
    const ADD = 0b10101000;
    const CALL = 0b01001000;
    const CMP = 0b10100000;
    const HLT = 0b00000001;
    const JEQ = 0b01010001;
    const JMP = 0b01010000;
    const JNE = 0b01010010;
    const LDI = 0b10011001;
    const MUL = 0b10101010;
    const PRN = 0b01000011;
    const RET = 0b00001001;

    const IR = this.reg.PC;

    let operandA = this.ram.read(IR + 1);
    let operandB = this.ram.read(IR + 2);

    switch (this.ram.read(IR)) {
      case CALL:
        this.reg[SP] -= 1;
        this.ram.write(this.reg[SP], this.reg.PC + 1);
        this.reg.PC = this.reg[1];
        subroutine = true;
        break;
      case CMP:
        this.alu('CMP', operandA, operandB);
        break;
      case HLT:
        this.stopClock();
        break;

      case JEQ:
        if (this.reg.FL === FLAG_EQ) {
          this.reg.PC = this.reg[operandA];
          jump = true;
        }
        break;
      case JNE:
        if (this.reg.FL !== FLAG_EQ) {
          this.reg.PC = this.reg[operandA];
          jump = true;
        }
        break;
      case JMP:
        this.reg.PC = this.reg[operandA];
        jump = true;
        break;
      case LDI:
        this.reg[operandA] = operandB;
        break;
      case MUL:
        this.alu('MUL', operandA, operandB);
        break;
      case PRN:
        console.log(this.reg[operandA]);
        break;
      case RET:
        this.reg.PC = this.ram.read(this.reg[SP]);
        this.reg[SP] += 1;
        break;
      default:
        let defErr = IR.toString(2);
        console.error(`Default Error at PC ${this.PC} : ${defErr}`);
        this.stopClock();
        break;
    }
    if (!subroutine && !jump) {
      this.reg.PC += 1;
      const num = this.ram.read(IR) >>> 6;
      this.reg.PC += num;
    } else {
      subroutine = false;
      jump = false;
    }
  }
}

module.exports = CPU;
