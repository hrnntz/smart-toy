// backend/src/models/Toy.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany, // ✅ Agregar importación
} from "typeorm";
import { Child } from "./Child";
import { User } from "./User";
import { Message } from "./Message";

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

  @Column({ type: "text", nullable: true })
  personality!: string | null;

  @Column({ type: "text", nullable: true })
  context!: string | null;

  @Column({ type: "text", nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => Child, (child) => child.toy, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "childId" })
  child!: Child | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "float", default: 100.0 })
  batteryLevel!: number;

  @Column({ type: "float", default: 6600.0 })
  batteryMah!: number;

  @Column({ type: "float", default: 41.2 })
  batteryHours!: number;

  @Column({ default: false })
  isHugging!: boolean;

  @Column({ default: 0 })
  hugCount!: number;

  @Column({ type: "timestamp", nullable: true })
  lastHugAt!: Date | null;

  @Column({ length: 50, default: "LIBRE" })
  sensorStatus!: string;

  // ✅ Relación con mensajes
  @OneToMany(() => Message, (message) => message.toy)
  messages!: Message[];
}