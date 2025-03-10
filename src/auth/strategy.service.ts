import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

type Payload = {
    sub: number,
    email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly prismaService: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('JWT_SECRET'),
            ignoreExpiration: false
        })
    }

    async validate(payload: Payload) {
        const user = await this.prismaService.user.findFirst({
            where: {
                email: payload.email,
                isActive: true,
                isDeleted: false
            },
            include: {
                profile: true
            }
        })
        if (!user) throw new UnauthorizedException('Accès non autorisé')
        Reflect.deleteProperty(user, 'password')
        return user
    }
}