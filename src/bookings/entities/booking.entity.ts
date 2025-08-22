import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Professional } from '../../professionals/entities/professional.entity';
import { Client } from '../../clients/entities/client.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
@Index(['professionalId', 'startTime', 'endTime'], { unique: true })
@Index(['idempotencyKey'], { unique: true })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'professional_id' })
  professionalId: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId: string;

  @Column({ type: 'datetime', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'int', name: 'total_price_cents' })
  totalPriceCents: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_payment_intent_id' })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Professional, professional => professional.bookings)
  @JoinColumn({ name: 'professional_id' })
  professional: Professional;

  @ManyToOne(() => Client, client => client.bookings)
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
