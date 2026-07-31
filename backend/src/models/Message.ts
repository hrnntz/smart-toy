import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Toy } from "./Toy";
import { User } from "./User";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  content!: string;

  @Column({ default: false })
  isUser!: boolean;

  @ManyToOne(() => Toy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "toyId" })
  toy!: Toy;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}