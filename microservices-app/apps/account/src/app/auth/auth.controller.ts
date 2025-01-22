import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

export class RegisterDto {
  email: string;
  password: string;
  displayName?: string;
}

export class LoginDto {
  email: string;
  password;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ email: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() { email, password }: LoginDto) {
    const { id } = await this.authService.validateUser(email, password);
    return this.authService.login(id);
  }
}
