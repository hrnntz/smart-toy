import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn
} from "typeorm";
import { Child } from "./Child";

@Entity("toys")
export class Toy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 100 })
  serialNumber!: string;

  @Column({ default: false })
  isConnected!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => Child, (child) => child.toy, {
    onDelete: "SET NULL",
    nullable: true
  })
  @JoinColumn({ name: "childId" })
  child!: Child | null;
}