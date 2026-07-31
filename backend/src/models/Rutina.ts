import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("rutinas")
export class Rutina {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: "time" })
  hora!: string;

  @Column({ default: false })
  repetir!: boolean;

  @Column({ type: "text", nullable: true })
  mensaje!: string | null;

  @Column({ type: "text", nullable: true })
  accionAdicional!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.rutinas, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "userId" })
  user!: User;
}