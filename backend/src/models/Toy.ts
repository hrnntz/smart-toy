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

  // ✅ Relación con mensajes
  @OneToMany(() => Message, (message) => message.toy)
  messages!: Message[];
}