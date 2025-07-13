import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Role } from './Role';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  @Index()
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 50, unique: true })
  name!: string;

  @Column({ default: true })
  status!: boolean;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  @Index()
  role!: Role;

  @Column({ type: 'text', nullable: true })
  permissions!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
