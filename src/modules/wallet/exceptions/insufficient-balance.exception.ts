import { BadRequestException } from '@nestjs/common';

export class InsufficientBalanceException extends BadRequestException {
  constructor(balance: number, required: number) {
    // Convert kobo to Naira for user-friendly error message
    const balanceInNaira = (balance / 100).toFixed(2);
    const requiredInNaira = (required / 100).toFixed(2);
    super(`Insufficient balance. Available: ${balanceInNaira} NGN, Required: ${requiredInNaira} NGN`);
  }
}
