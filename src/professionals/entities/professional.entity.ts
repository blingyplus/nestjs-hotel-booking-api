import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Availability } from '../../availabilities/entities/availability.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum TravelMode {
  LOCAL = 'local',
  TRAVEL = 'travel',
}

@Entity('professionals')
export class Professional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'int', name: 'hourly_rate_cents' })
  hourlyRateCents: number;

  @Column({
    type: 'enum',
    enum: TravelMode,
    default: TravelMode.LOCAL,
  })
  travelMode: TravelMode;

  @Column({ type: 'decimal', precision: 10, scale: 8, name: 'location_lat' })
  locationLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, name: 'location_lng' })
  locationLng: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Availability, availability => availability.professional)
  availabilities: Availability[];

  @OneToMany(() => Booking, booking => booking.professional)
  bookings: Booking[];
}
