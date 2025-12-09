import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private walletService: WalletService,
  ) {}

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  }): Promise<User> {
    // Check if user exists
    let user = await this.usersService.findByGoogleId(profile.googleId);

    if (!user) {
      // Create new user
      user = await this.usersService.create(profile);

      // Auto-create wallet for new user
      await this.walletService.createWallet(user.id);
    } else {
      // Update existing user
      user = await this.usersService.update(user.id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePicture: profile.profilePicture,
      });
    }

    return user;
  }

  async generateJwtToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  async login(user: User): Promise<{ access_token: string; user: User }> {
    const access_token = await this.generateJwtToken(user);

    return {
      access_token,
      user,
    };
  }
}
