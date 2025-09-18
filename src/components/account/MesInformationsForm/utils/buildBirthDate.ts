export const buildBirthDate = (birthDate: {
  birthDay: string
  birthMonth: string
  birthYear: string
}) => {
  const { birthDay, birthMonth, birthYear } = birthDate
  if (birthYear && birthMonth && birthDay) return `${birthYear}-${birthMonth}-${birthDay}`
  return ''
}
