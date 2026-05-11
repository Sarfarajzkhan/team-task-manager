import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: true,
  autoLoadEntities: true,
  synchronize: true,
};