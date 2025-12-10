import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ type: 'varchar', length: 20 })
  type: TransactionType;

  /**
   * Transaction amount stored in smallest currency unit (kobo for NGN)
   * Internal storage uses kobo, API responses convert to Naira
   */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  reference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  /**
   * Wallet balance before transaction in smallest currency unit (kobo for NGN)
   */
  @Column({ name: 'balance_before', type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceBefore: number;

  /**
   * Wallet balance after transaction in smallest currency unit (kobo for NGN)
   */
  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceAfter: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
