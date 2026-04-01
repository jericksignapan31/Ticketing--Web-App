import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../../entities/user-account.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_SECRET') ||
        'your-secret-key-change-this-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.userAccountRepository.findOne({
      where: { user_id: payload.sub },
      relations: ['employee'],
    });

    if (!user || !user.employee || !user.employee.employment_status) {
      throw new UnauthorizedException('Invalid token or inactive account');
    }

    return {
      sub: user.user_id,
      username: user.username,
      employee_id: user.employee_id,
      role: user.employee.role,
      branchId: user.employee.branch_id,
    };
  }
}
