import { BadRequestException } from '@nestjs/common';

export class InsufficientBalanceException extends BadRequestException {
  constructor(balance: number, required: number) {
    super(`Insufficient balance. Available: ${balance}, Required: ${required}`);
  }
}
