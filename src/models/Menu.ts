import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name!: string;

  @Column({ length: 100, nullable: true })
  path!: string;

  @Column({ length: 100, nullable: true })
  component!: string;

  @Column({ length: 50, nullable: true })
  icon!: string;

  @Column({ default: 0 })
  parent_id!: number;

  @Column({ default: 0 })
  sort!: number;

  @Column({ default: true })
  visible!: boolean;

  @Column({ length: 50, nullable: true })
  permission_code!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
