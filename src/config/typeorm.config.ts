import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: true,
  autoLoadEntities: true,
  synchronize: true,
};