import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";

import { User } from "../models/User";
import { Child } from "../models/Child";
import { Toy } from "../models/Toy";
import { Rutina } from "../models/Rutina";
import { Message } from "../models/Message";
import { Story } from "../models/Story";


dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "smart_toy",

 entities: [User, Child, Toy, Rutina, Message, Story],


  synchronize: true,
  logging: false
});