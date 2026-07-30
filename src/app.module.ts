import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DBModule } from './db/db.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    DBModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
