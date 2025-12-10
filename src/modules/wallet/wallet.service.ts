import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { ConfigService } from '@nestjs/config';
import { InsufficientBalanceException } from './exceptions/insufficient-balance.exception';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async generateUniqueWalletNumber(): Promise<string> {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Generate 13-digit number starting with '4'
      const randomDigits = Math.floor(Math.random() * 1e12)
        .toString()
        .padStart(12, '0');
      const walletNumber = '4' + randomDigits;

      // Check uniqueness
      const existing = await this.walletRepository.findOne({
        where: { walletNumber },
      });

      if (!existing) {
        return walletNumber;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique wallet number');
  }

  async createWallet(userId: string): Promise<Wallet> {
    const walletNumber = await this.generateUniqueWalletNumber();
    const currency = this.configService.get<string>('app.defaultCurrency') || 'NGN';

    const wallet = this.walletRepository.create({
      userId,
      walletNumber,
      currency,
      balance: 0,
    });

    return this.walletRepository.save(wallet);
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.walletRepository.findOne({
      where: { userId },
    });
  }

  async findByWalletNumber(walletNumber: string): Promise<Wallet | null> {
    return this.walletRepository.findOne({
      where: { walletNumber },
    });
  }

  async getBalance(userId: string): Promise<{ balance: number; walletNumber: string }> {
    const wallet = await this.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: Number(wallet.balance),
      walletNumber: wallet.walletNumber,
    };
  }

  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Transaction[]> {
    const wallet = await this.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Create a pending deposit transaction
   * @param userId - User ID
   * @param amount - Deposit amount in smallest currency unit (kobo)
   * @param reference - Paystack payment reference
   */
  async createPendingDeposit(
    userId: string,
    amount: number,
    reference: string,
  ): Promise<Transaction> {
    const wallet = await this.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      reference,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance, // Not yet credited
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Credit wallet atomically after successful payment
   * @param reference - Paystack payment reference
   * @param verifiedAmount - Verified amount from Paystack
   * @returns Updated transaction
   */
  async creditWallet(reference: string, verifiedAmount: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Find the pending transaction
      const transaction = await manager.findOne(Transaction, {
        where: { reference, status: TransactionStatus.PENDING },
        relations: ['wallet'],
      });

      if (!transaction) {
        throw new NotFoundException('Pending transaction not found');
      }

      // 2. Verify amount matches
      if (Number(transaction.amount) !== verifiedAmount) {
        // Update transaction to failed
        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          error: 'Amount mismatch',
          expected: Number(transaction.amount),
          received: verifiedAmount,
        };
        await manager.save(transaction);
        throw new BadRequestException('Amount mismatch');
      }

      // 3. Lock and load wallet
      const wallet = await manager.findOne(Wallet, {
        where: { id: transaction.walletId },
        lock: { mode: 'pessimistic_write' }, // SELECT FOR UPDATE
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // 4. Credit wallet
      const newBalance = Number(wallet.balance) + verifiedAmount;
      wallet.balance = newBalance;
      await manager.save(wallet);

      // 5. Update transaction
      transaction.status = TransactionStatus.SUCCESS;
      transaction.balanceAfter = newBalance;
      await manager.save(transaction);

      return transaction;
    });
  }

  /**
   * Find transaction by reference
   * @param reference - Payment reference
   */
  async findTransactionByReference(reference: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { reference },
    });
  }

  /**
   * Transfer funds atomically between wallets
   * @param senderUserId - Sender's user ID
   * @param recipientWalletNumber - Recipient's wallet number
   * @param amount - Transfer amount
   * @returns Both transaction records (sender and recipient)
   */
  async transferFunds(
    senderUserId: string,
    recipientWalletNumber: string,
    amount: number,
  ): Promise<{ senderTransaction: Transaction; recipientTransaction: Transaction }> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Lock sender wallet (SELECT FOR UPDATE)
      const senderWallet = await manager.findOne(Wallet, {
        where: { userId: senderUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      // 2. Check sender balance
      const senderBalance = Number(senderWallet.balance);
      if (senderBalance < amount) {
        throw new InsufficientBalanceException(senderBalance, amount);
      }

      // 3. Lock recipient wallet by wallet_number (SELECT FOR UPDATE)
      const recipientWallet = await manager.findOne(Wallet, {
        where: { walletNumber: recipientWalletNumber },
        lock: { mode: 'pessimistic_write' },
      });

      if (!recipientWallet) {
        throw new NotFoundException(`Recipient wallet not found: ${recipientWalletNumber}`);
      }

      // Load recipient user separately (after lock to avoid LEFT JOIN with FOR UPDATE)
      const recipientUser = await manager.findOne(Wallet, {
        where: { id: recipientWallet.id },
        relations: ['user'],
      });

      // Load sender user for metadata
      const senderUser = await manager.findOne(Wallet, {
        where: { id: senderWallet.id },
        relations: ['user'],
      });

      // 4. Prevent self-transfer
      if (senderWallet.id === recipientWallet.id) {
        throw new BadRequestException('Cannot transfer to your own wallet');
      }

      // 5. Deduct from sender
      const senderNewBalance = senderBalance - amount;
      senderWallet.balance = senderNewBalance;
      await manager.save(senderWallet);

      // 6. Credit recipient
      const recipientBalance = Number(recipientWallet.balance);
      const recipientNewBalance = recipientBalance + amount;
      recipientWallet.balance = recipientNewBalance;
      await manager.save(recipientWallet);

      // 7. Create sender transaction (TRANSFER_OUT)
      const senderTransaction = manager.create(Transaction, {
        walletId: senderWallet.id,
        type: TransactionType.TRANSFER_OUT,
        amount,
        status: TransactionStatus.SUCCESS,
        balanceBefore: senderBalance,
        balanceAfter: senderNewBalance,
        metadata: {
          recipientWalletNumber: recipientWallet.walletNumber,
          recipientEmail: recipientUser?.user?.email,
        },
      });
      await manager.save(senderTransaction);

      // 8. Create recipient transaction (TRANSFER_IN)
      const recipientTransaction = manager.create(Transaction, {
        walletId: recipientWallet.id,
        type: TransactionType.TRANSFER_IN,
        amount,
        status: TransactionStatus.SUCCESS,
        balanceBefore: recipientBalance,
        balanceAfter: recipientNewBalance,
        metadata: {
          senderWalletNumber: senderWallet.walletNumber,
          senderEmail: senderUser?.user?.email,
        },
      });
      await manager.save(recipientTransaction);

      return { senderTransaction, recipientTransaction };
    });
  }
}
