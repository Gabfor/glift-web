export const PASSWORD_MIN_LENGTH = 8

export const getPasswordValidationState = (value: string) => {
  const hasMinLength = value.length >= PASSWORD_MIN_LENGTH
  const hasLetter = /[a-zA-Z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value)
  const isValid = hasMinLength && hasLetter && hasNumber && hasSymbol

  return { hasMinLength, hasLetter, hasNumber, hasSymbol, isValid } as const
}
