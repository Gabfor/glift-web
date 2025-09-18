export const calculateCompletionPercentage = (params: {
  email?: string
  name: string
  birthDay: string
  birthMonth: string
  birthYear: string
  gender: string
  country: string
  experience: string
  mainGoal: string
  trainingPlace: string
  weeklySessions: string
  supplements: string
}) => {
  let total = 10
  let completed = 0

  if (params.email) completed++
  if (params.name.trim().length > 0) completed++
  if (params.birthDay && params.birthMonth && params.birthYear) completed++
  if (params.gender) completed++
  if (params.country) completed++
  if (params.experience) completed++
  if (params.mainGoal) completed++
  if (params.trainingPlace) completed++
  if (params.weeklySessions) completed++
  if (params.supplements !== '') completed++

  return Math.round((completed / total) * 100)
}
