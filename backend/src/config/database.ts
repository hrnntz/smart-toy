import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

import { User } from "../models/User";
import { Child } from "../models/Child";
import { Toy } from "../models/Toy";
import { Rutina } from "../models/Rutina";
import { Message } from "../models/Message";
import { Story } from "../models/Story";
import { DeviceConfig } from "../models/DeviceConfig";
import { EnglishProgress } from "../models/EnglishProgress";
import { EnglishThemeContent } from "../models/EnglishThemeContent";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isNeon = Boolean(
  (process.env.DB_HOST && process.env.DB_HOST.includes("neon.tech")) ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech"))
);
const useSSL = process.env.DB_SSL === "true" || isProduction || isNeon;

const connectionOptions: DataSourceOptions = process.env.DATABASE_URL
  ? {
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      entities: [User, Child, Toy, Rutina, Message, Story, DeviceConfig, EnglishProgress, EnglishThemeContent],
      migrations: [__dirname + "/../migrations/*.ts"],
      synchronize: process.env.DB_SYNCHRONIZE !== undefined ? process.env.DB_SYNCHRONIZE === "true" : !isProduction,
      logging: false,
    }
  : {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "smart_toy",
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      entities: [User, Child, Toy, Rutina, Message, Story, DeviceConfig, EnglishProgress, EnglishThemeContent],
      migrations: [__dirname + "/../migrations/*.ts"],
      synchronize: process.env.DB_SYNCHRONIZE !== undefined ? process.env.DB_SYNCHRONIZE === "true" : !isProduction,
      logging: false,
    };

export const AppDataSource = new DataSource(connectionOptions);