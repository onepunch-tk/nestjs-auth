import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow('RESEND_API_KEY'));
  }

  async sendVerificationEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('APP_URL');
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'hello@tkstar.dev',
      to: email,
      subject: '[tkstar.dev] 이메일 인증을 완료해주세요',
      html: `
        <div style="margin:0; padding:40px 0; background-color:#f4f4f7; font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:40px 32px 24px; text-align:center;">
                <h1 style="margin:0; font-size:20px; color:#111111;">이메일 인증</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px; text-align:center; color:#555555; font-size:15px; line-height:1.6;">
                안녕하세요!<br/>
                아래 버튼을 눌러 이메일 인증을 완료해주세요.<br/>
                <span style="color:#e53935;">이 링크는 24시간 후 만료됩니다.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px; text-align:center;">
                <a href="${verificationUrl}" style="display:inline-block; padding:14px 32px; background-color:#111111; color:#ffffff; text-decoration:none; border-radius:8px; font-size:15px; font-weight:600;">
                  이메일 인증하기
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px; text-align:center; color:#999999; font-size:13px; line-height:1.6;">
                버튼이 눌리지 않는다면 아래 링크를 복사해 브라우저에 붙여넣어 주세요.<br/>
                <a href="${verificationUrl}" style="color:#999999; word-break:break-all;">${verificationUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#fafafa; text-align:center; color:#bbbbbb; font-size:12px;">
                본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('APP_URL');
    const resetUrl = `${appUrl}/api/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'hello@tkstar.dev',
      to: email,
      subject: '[tkstar.dev] 비밀번호 재설정 안내',
      html: `
        <div style="margin:0; padding:40px 0; background-color:#f4f4f7; font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:40px 32px 24px; text-align:center;">
                <h1 style="margin:0; font-size:20px; color:#111111;">비밀번호 재설정</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px; text-align:center; color:#555555; font-size:15px; line-height:1.6;">
                안녕하세요!<br/>
                아래 버튼을 눌러 비밀번호를 재설정해주세요.<br/>
                <span style="color:#e53935;">이 링크는 1시간 후 만료됩니다.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px; text-align:center;">
                <a href="${resetUrl}" style="display:inline-block; padding:14px 32px; background-color:#111111; color:#ffffff; text-decoration:none; border-radius:8px; font-size:15px; font-weight:600;">
                  비밀번호 재설정하기
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px; text-align:center; color:#999999; font-size:13px; line-height:1.6;">
                버튼이 눌리지 않는다면 아래 링크를 복사해 브라우저에 붙여넣어 주세요.<br/>
                <a href="${resetUrl}" style="color:#999999; word-break:break-all;">${resetUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#fafafa; text-align:center; color:#bbbbbb; font-size:12px;">
                본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  }
}
