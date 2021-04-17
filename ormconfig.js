module.exports = {
  type: 'postgres',
  host: 'postgres',
  port: '5432',
  username: 'admin',
  password: 'admin',
  database: 'userservice',
  entities: [__dirname + '/**/*.entity.{js,ts}'],
  migrations: [__dirname + '/**/*.migration.{js,ts}'],
  synchronize: true,
  seeds: [__dirname + '/**/seeders/**/*.seed{.ts,.js}'],
  factories: [__dirname + '/**/factories/**/*.factory{.ts,.js}'],
};
