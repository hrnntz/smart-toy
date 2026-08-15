import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' }) // ✅ Cambiado a text para evitar límite de longitud
  titulo!: string;

  @Column({ type: 'text' })
  contenido!: string;

  @Column({ type: 'text', nullable: true })
  imagen!: string | null;

  @Column({ length: 50 })
  duracion!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}