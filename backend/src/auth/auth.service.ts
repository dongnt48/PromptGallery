import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: any) {
    const { id: googleIdFromProfile, email, firstName, lastName, picture } = googleUser;
    
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleIdFromProfile },
          { email: email }
        ]
      }
    });

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email,
          username: email.split('@')[0],
          name: fullName,
          googleId: googleIdFromProfile,
          avatarUrl: picture,
        },
      });
    } else {
      // Update avatar and name from Google to ensure it's fresh, EXCEPT for admins
      const updateData: any = { googleId: googleIdFromProfile };
      
      if (user.role !== 'admin') {
        updateData.name = fullName;
        if (picture) updateData.avatarUrl = picture;
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    const payload = { email: user.email, sub: user.id.toString(), role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
    };
  }
}
