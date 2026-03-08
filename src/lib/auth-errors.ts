const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': "Votre email n'a pas encore été confirmé.",
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Unable to validate email address: invalid format': "Le format de l'email est invalide.",
  'Email rate limit exceeded': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'For security purposes, you can only request this after': 'Pour des raisons de sécurité, veuillez patienter avant de réessayer.',
  'New password should be different from the old password': 'Le nouveau mot de passe doit être différent de l\'ancien.',
}

export function translateAuthError(message: string): string {
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.includes(key)) return value
  }
  return message
}
