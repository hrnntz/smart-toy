import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

// Caché de las palabras generadas por IA para cada tema (colores, animales, etc.)
// Se genera una sola vez con Groq y se reutiliza — así no se gasta cuota de IA
// cada vez que un niño abre la misma lección.
@Entity("english_theme_content")
export class EnglishThemeContent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50, unique: true })
  themeKey!: string;

  @Column({ type: "text" })
  contentJson!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
