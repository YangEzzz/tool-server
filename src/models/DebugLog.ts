import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

@Entity()
export class DebugLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'jsonb' })
  content!: Record<string, any>;

  @Column({ type: 'text' })
  creator!: string;

  @CreateDateColumn()
  createdAt!: Date;
}