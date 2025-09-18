export function isPasswordFormatOk(pwd: string) {
  return pwd.length >= 8 &&
    /[a-zA-Z]/.test(pwd) &&
    /\d/.test(pwd) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
}
