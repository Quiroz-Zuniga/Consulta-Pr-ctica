import type { IAuthService } from '../../domain/ports/IAuthService.js';
import type { LoginRequestDTO, LoginResponseDTO } from '../dtos/AuthDTO.js';

export class AuthenticateUser {
  constructor(private readonly _authService: IAuthService) {}

  async execute(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const result = await this._authService.signIn(dto.email, dto.password);

    return {
      accessToken: result.accessToken,
      user: result.user,
      expiresAt: result.expiresAt,
    };
  }
}
