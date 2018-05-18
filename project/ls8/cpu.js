// ========= opcode variables ====== //

const ADD = 0b10101000;
const CALL = 0b01001000;
const CMP = 0b10100000;
const DEC = 0b01111001;
const HLT = 0b00000001;
const INC = 0b01111000;
const JEQ = 0b01010001;
const JMP = 0b01010000;
const JNE = 0b01010010;
const LDI = 0b10011001;
const MUL = 0b10101010;
const POP = 0b01001100;
const PRN = 0b01000011;
const PUSH = 0b01001101;
const RET = 0b00001001;

// reserved numeric registers:
const FL = 4;
const IM = 5;
const IS = 6;
const SP = 7;

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

    this.handler = [];

    this.handler[LDI] = this.handle_LDI.bind(this);
    this.handler[MUL] = this.handle_MUL.bind(this);
    this.handler[PRN] = this.handle_PRN.bind(this);
    this.handler[HLT] = this.handle_HLT.bind(this);
    this.handler[POP] = this.handle_POP.bind(this);
    this.handler[PUSH] = this.handle_PUSH.bind(this);
    this.handler[RET] = this.handle_RET.bind(this);
    this.handler[CALL] = this.handle_CALL.bind(this);
    this.handler[ADD] = this.handle_ADD.bind(this);
    this.handler[CMP] = this.handle_CMP.bind(this);
    this.handler[JEQ] = this.handle_JEQ.bind(this);
    this.handler[JNE] = this.handle_JNE.bind(this);
    this.handler[JMP] = this.handle_JMP.bind(this);
  }

  poke(address, value) {
    this.ram.write(address, value);
  }

  startClock() {
    this.clock = setInterval(() => {
      this.tick();
    }, 1);
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
    const IR = this.ram.read(this.reg.PC);

    let operandA = this.ram.read(this.reg.PC + 1);
    let operandB = this.ram.read(this.reg.PC + 2);

    const h = this.handler[IR];

    if (h === undefined) {
      console.error(`Default Error at PC ${this.reg.PC} : Error`);
      this.stopClock();
      return;
    }

    h(operandA, operandB);

    if (IR !== JEQ && IR !== CALL && IR !== RET && IR !== JMP && IR !== JNE) {
      this.reg.PC += ((IR & 11000000) >>> 6) + 1;
    }
  }

  handle_LDI(operandA, operandB) {
    this.reg[operandA] = operandB;
  }

  handle_PRN(regIndex) {
    console.log(this.reg[regIndex]);
  }

  handle_HLT() {
    this.stopClock();
  }

  handle_MUL(operandA, operandB) {
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
    this.alu('DEC', SP);
    this.ram.write(this.reg[SP], this.reg.PC + 2);
    this.reg.PC = this.reg[operandA];
  }

  handle_RET() {
    this.reg.PC = this.ram.read(this.reg[SP]);
    this.alu('INC', SP);
  }

  handle_ADD(operandA, operandB) {
    this.alu('ADD', operandA, operandB);
  }

  handle_CMP(operandA, operandB) {
    this.alu('CMP', operandA, operandB);
  }

  handle_JEQ(operandA) {
    if (this.reg.FL == FLAG_EQ) {
      this.reg.PC = this.reg[operandA];
    } else {
      this.reg.PC += 1 + (this.ram.read(this.reg.PC) >> 6);
    }
  }
  handle_JNE(operandA) {
    if (this.reg.FL !== FLAG_EQ) {
      this.reg.PC = this.reg[operandA];
    } else {
      this.reg.PC += 1 + (this.ram.read(this.reg.PC) >> 6);
    }
  }
  handle_JMP(operandA) {
    this.reg.PC = this.reg[operandA];
  }
}

module.exports = CPU;
