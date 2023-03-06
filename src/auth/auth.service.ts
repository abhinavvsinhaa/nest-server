import { BadRequestException, ForbiddenException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleLoginDto, LoginDto, SignupDto, TEMPLATETYPE, VerifyEmailOTPDto, verifyUserOtpDto } from 'src/dto';
import * as argon from 'argon2'
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ResponseType } from 'src/types/Response';
import { userType } from 'src/types/User';
import { generate } from 'otp-generator'
import { decodeOTP, encodeOTP } from 'src/middlewares/encodeOTP.middleware';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { verifyEmailTemplate } from '../constants/emailtemplate.constant';
import { dates } from 'src/constants/extra';
import { OAuth2Client } from 'google-auth-library';
type UserToken = {
    token: string
}

type OTPI = {
    encodedURI: string
}

type OTPObject = {
    timestamp: Date,
    check: string,
    success: boolean,
    message: string,
    otpid: string
}

const AddMinutesToDate = (date: Date, minutes: number) => {
    return new Date(date.getTime() + minutes * 60000)
}

const generateSubjectAndText = (type: TEMPLATETYPE, otp: string) => {
    let emailContent = {
        emailSubject: '',
        emailText: ''
    }
    if (type === TEMPLATETYPE.VERIFY) {
        const { subject_mail, message } = verifyEmailTemplate();
        emailContent.emailText = message(otp)
        emailContent.emailSubject = subject_mail
        return emailContent;
    }
}

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private mailService: MailerService) { }
    async sigup(dto: SignupDto) {
        try {
            const hash = await argon.hash(dto.password);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash: hash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    seed: dto.seed,
                    stripe: dto.stripe,
                    backgroundColor: dto.backgroundColor,
                    phone: '',
                    uid: '',
                    isEmailVerified: dto.isEmailVerified
                }
            })
            const token = this.jwt.sign({
                id: user.id
            },
                {
                    secret: process.env.JWT_SECRET_KEY
                }
            )
            const res: ResponseType<UserToken> = {
                success: true,
                error: null,
                code: 200,
                path: 'auth/signup',
                data: {
                    body: {
                        token
                    },
                    message: 'User created successfully!',
                    statusCode: 200
                }
            }
            console.log(res);

            return res;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already registered!');
                }
            }
            throw error;
        }
    }
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) throw new ForbiddenException('User not found!')

        const pwMatches = await argon.verify(user.hash, dto.password);
        if (!pwMatches) throw new ForbiddenException('Invalid Password!')

        const token = this.jwt.sign({
            id: user.id
        },
            {
                secret: process.env.JWT_SECRET_KEY
            }
        )
        const res: ResponseType<UserToken> = {
            success: true,
            error: null,
            code: 200,
            path: 'auth/login',
            data: {
                body: {
                    token
                },
                message: 'Login successfully!',
                statusCode: 200
            }
        }
        return res;
    }
    async verifyEmail(dto: VerifyEmailOTPDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })

        if (user) throw new ForbiddenException('Email already registered!')
        if (user && user.isEmailVerified) throw new ForbiddenException('User already verified!');
        const otp = generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false, digits: true })
        const now = new Date();
        const expirationTime = AddMinutesToDate(now, 10);
        const otpInstance = await this.prisma.oTP.create({
            data: {
                otp,
                expirationTime
            }
        })
        const details: OTPObject = {
            timestamp: now,
            check: dto.email,
            success: true,
            message: "OTP sent to user",
            otpid: otpInstance.id
        }
        const encoded = await encodeOTP(JSON.stringify(details))

        const { emailSubject, emailText } = generateSubjectAndText(dto.type, otp)

        const mailOptions = {
            to: dto.email,
            subject: emailSubject,
            text: emailText,
        }
        try {
            const mailRes = await this.mailService.sendMail(mailOptions);
            const res: ResponseType<OTPI> = {
                success: true,
                data: {
                    message: 'Mail sent successfully!',
                    body: {
                        encodedURI: encoded
                    },
                    statusCode: 200
                },
                error: null,
                code: 200,
                path: 'auth/verifyOTP/email'
            }
            return res;
        } catch (mailErr) {
            console.log(mailErr);
            throw new ServiceUnavailableException('Mail not sent! Try again!')
        }
    }

    async verifyOTP(dto: verifyUserOtpDto) {
        const currentDate = new Date();
        let decoded: string;
        try {
            decoded = await decodeOTP(dto.otpURI)
        }
        catch (err) {
            throw new BadRequestException('Unknown error occured!');
        }
        const obj: OTPObject = JSON.parse(decoded)
        if (dto.check != obj.check) {
            throw new ForbiddenException('OTP not valid!')
        }
        const otp_instance = await this.prisma.oTP.findUnique({
            where: {
                id: obj.otpid
            }
        })
        if (!otp_instance) throw new BadRequestException
        if (otp_instance.verified) {
            const res: ResponseType<Object> = {
                success: false,
                data: null,
                error: {
                    message: 'OTP Already used!',
                    statusCode: 403
                },
                code: 403,
                path: 'auth/verifyotp'
            }
            return res;
        }
        if (dates.compare(otp_instance.expirationTime, currentDate)) {
            if (dto.otp === otp_instance.otp) {
                await this.prisma.oTP.update({
                    where: {
                        id: obj.otpid
                    },
                    data: {
                        verified: true
                    }
                })
                const res: ResponseType<null> = {
                    success: true,
                    data: {
                        message: 'Email verified successfully!',
                        statusCode: 200,
                        body: null
                    },
                    error: null,
                    code: 200,
                    path: 'auth/verifyOTP'
                }
                return res;
            } else {
                const res: ResponseType<null> = {
                    success: false,
                    data: null,
                    error: {
                        message: 'OTP mismatched!',
                        statusCode: 403
                    },
                    code: 403,
                    path: 'auth/verifyOTP'
                }
                return res;
            }
        } else {
            const res: ResponseType<null> = {
                success: false,
                data: null,
                error: {
                    message: 'OTP Expired!',
                    statusCode: 403
                },
                code: 403,
                path: 'auth/verifyOTP'
            }
            return res;
        }
    }

    async me(req: any) {
        const res: ResponseType<userType> = {
            success: true,
            data: {
                body: req.body.user,
                message: 'User verified and found!',
                statusCode: 200
            },
            error: null,
            code: 200,
            path: 'auth/me'
        }
        return res;
    }

    async googleLogin(dto: GoogleLoginDto) {
        const client = new OAuth2Client(
            process.env.GOOGLE_OAUTH_CLIENTID,
            process.env.GOOGLE_OAUTH_SECRET,
        );
        const ticket = await client.verifyIdToken({
            idToken: dto.token,
            audience: process.env.GOOGLE_OAUTH_CLIENTID,
        });

        if (ticket.getPayload() && ticket.getPayload().email) {
            const email = ticket.getPayload().email;
            const uid = ticket.getUserId()
            const user = await this.prisma.user.findUnique({
                where: {
                    email: email
                }
            });
            if (!user) throw new ForbiddenException('User not found!')

            if (!(user.isGAuthVerified)) {
                await this.prisma.user.update({
                    where: {
                        email: email
                    },
                    data: {
                        isGAuthVerified: true
                    }
                })
            }

            const token = this.jwt.sign({
                id: user.id
            },
                {
                    secret: process.env.JWT_SECRET_KEY
                }
            )
            const res: ResponseType<UserToken> = {
                success: true,
                error: null,
                code: 200,
                path: 'auth/login',
                data: {
                    body: {
                        token
                    },
                    message: 'Login successfully!',
                    statusCode: 200
                }
            }
            return res;
        }
        const err: ResponseType<Object> = {
            success: false,
            data: null,
            error: {
                message: 'Server Error Occured!',
                statusCode: 403
            },
            code: 403,
            path: 'auth/google/login'
        }
        return err;
    }
}