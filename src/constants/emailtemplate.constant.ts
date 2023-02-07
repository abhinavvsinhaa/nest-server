const resetPasswordTemplate = () => {
    const subject_mail = "OTP: For Reset Password"
    const message = (otp: string) => {
        return `Dear User, \n\n`
            + 'OTP to reset your password is : \n\n'
            + `${otp}\n\n`
            + 'This is an auto-generated email. Please do not reply to this email.\n\n'
            + 'Regards\n'
            + 'Reunir\n\n'
    }
    return { subject_mail, message }
}

export const verifyEmailTemplate = () => {
    const subject_mail = "OTP: For Email Verification"
    const message = (otp: string) => {
        return `Dear User, \n\n`
            + 'OTP for your email verification is : \n\n'
            + `${otp}\n\n`
            + 'This is an auto-generated email. Please do not reply to this email.\n\n'
            + 'Regards\n'
            + 'Reunir\n\n'
    }
    return { subject_mail, message }
}
