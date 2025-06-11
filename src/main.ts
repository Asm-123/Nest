import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-guads';
import { ValidationPipe } from '@nestjs/common';
import { AuthService } from './modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './modules/users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const authService = app.get(AuthService);
  // app.useGlobalGuards(new JwtAuthGuard(authService));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const configService = app.get(ConfigService);
  const usersService = app.get(UsersService);

  const adminEmail = configService.get<string>('ADMIN_EMAIL');
  const adminPassword = configService.get<string>('ADMIN_PASSWORD');

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    usersService.findOrCreateAdmin(adminEmail, hashedPassword, 'Default Admin');
    console.log(`Admin user "${adminEmail}" created or found.`);
  } else {
    console.warn(
      'Admin credentials (ADMIN_EMAIL, ADMIN_PASSWORD) not set in .env. Skipping admin seeding.',
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
