import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects to Google OAuth consent screen. After user grants permission, they will be redirected to the callback endpoint.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent page',
  })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles Google OAuth callback, creates/updates user, and returns JWT token. A wallet is automatically created for new users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated. Returns JWT token and user data.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          profilePicture: 'https://lh3.googleusercontent.com/...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    // User data from Google strategy
    const googleUser = req.user;

    // Validate/create user
    const user = await this.authService.validateGoogleUser(googleUser);

    // Generate JWT
    const { access_token } = await this.authService.login(user);

    // Return JWT in response
    return res.json({
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
      },
    });
  }
}
