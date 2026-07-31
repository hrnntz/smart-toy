import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";
import { Toy } from "./Toy";

@Entity("children")
export class Child {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: "date", nullable: true })
  birthDate!: Date | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  gender!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.children, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @OneToOne(() => Toy, (toy) => toy.child, {
    cascade: true
  })
  toy!: Toy;
}