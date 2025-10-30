import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refreshsecretkey',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub }
    });

    if (!user || !user.isActive) {
      return false;
    }

    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    
    return {
      ...user,
      refreshToken,
    };
  }
}