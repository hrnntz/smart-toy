import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("device_configs")
export class DeviceConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, default: "Panda" })
  deviceName!: string;

  @Column({ type: "int", default: 50 })
  volume!: number;

  @Column({ default: true })
  eyeLights!: boolean;

  @Column({ default: true })
  vibration!: boolean;

  @Column({ default: false })
  nightMode!: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  wifi!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}