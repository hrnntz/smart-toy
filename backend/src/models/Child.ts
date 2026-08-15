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

  @Column({ type: "int", nullable: true })
  age!: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  language!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  bedtime!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  energyLevel!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  personality!: string | null;

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