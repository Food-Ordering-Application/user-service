import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [__dirname + '/../**/*.entity.{js,ts}'],
        migrations: [__dirname + '/migrations/**/*.{js,ts}'],
        synchronize: false,
        seeds: [__dirname + '/seeders/**/*{.ts,.js}'],
        factories: [__dirname + '/factories/**/*{.ts,.js}'],
        ssl: true,
        migrationsDir: 'src/database/migrations',
        cli: {
          migrationsDir: 'src/database/migrations',
        },
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
        // logging: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
