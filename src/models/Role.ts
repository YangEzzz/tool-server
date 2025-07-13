import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RoleMenu } from './RoleMenu';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, unique: true })
  name!: string;

  @Column({ length: 100, nullable: true })
  description!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ default: false })
  isSuperAdmin!: boolean;

  @Column({ default: true })
  status!: boolean;

  @OneToMany(() => RoleMenu, (roleMenu: RoleMenu) => roleMenu.role)
  roleMenus!: RoleMenu[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 