import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from "typeorm";
import { Child } from "./Child";
import { Rutina } from "./Rutina";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Child, (child) => child.user)
  children!: Child[];

  @OneToMany(() => Rutina, (rutina) => rutina.user)
rutinas!: Rutina[];
}