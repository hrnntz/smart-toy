import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Child } from "./Child";

// Progreso de inglés de un niño: nivel, palabras aprendidas, racha de días,
// y en qué tema (de la secuencia tipo Duolingo) va.
@Entity("english_progress")
export class EnglishProgress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", default: 0 })
  currentThemeIndex!: number;

  @Column({ type: "int", default: 0 })
  palabrasAprendidas!: number;

  @Column({ type: "int", default: 0 })
  racha!: number;

  @Column({ type: "varchar", length: 50, default: "A1 - Principiante" })
  nivel!: string;

  @Column({ type: "date", nullable: true })
  ultimaLeccionFecha!: string | null;

  @Column({ type: "int", default: 20 })
  planDiarioMin!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => Child, { onDelete: "CASCADE" })
  @JoinColumn({ name: "childId" })
  child!: Child;
}
