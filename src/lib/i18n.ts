export type Locale = 'fr' | 'de' | 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  de: 'Deutsch',
  en: 'English',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: '🇫🇷',
  de: '🇩🇪',
  en: '🇬🇧',
}

const translations = {
  // ── Navigation ──
  'nav.home': { fr: 'Accueil', de: 'Startseite', en: 'Home' },
  'nav.search': { fr: 'Chercher', de: 'Suchen', en: 'Search' },
  'nav.add': { fr: 'Ajouter', de: 'Hinzufügen', en: 'Add' },
  'nav.favorites': { fr: 'Favoris', de: 'Favoriten', en: 'Favorites' },
  'nav.more': { fr: 'Plus', de: 'Mehr', en: 'More' },
  'nav.shoppingList': { fr: 'Liste de courses', de: 'Einkaufsliste', en: 'Shopping list' },
  'nav.mealPlanner': { fr: 'Planificateur', de: 'Wochenplaner', en: 'Meal planner' },
  'nav.pressureCooker': { fr: 'Cocotte-minute', de: 'Schnellkochtopf', en: 'Pressure cooker' },

  // ── Settings ──
  'settings.theme': { fr: 'Thème', de: 'Design', en: 'Theme' },
  'settings.themeDark': { fr: 'Thème sombre', de: 'Dunkles Design', en: 'Dark theme' },
  'settings.themeLight': { fr: 'Thème clair', de: 'Helles Design', en: 'Light theme' },
  'settings.themeSystem': { fr: 'Thème système', de: 'Systemdesign', en: 'System theme' },
  'settings.language': { fr: 'Langue', de: 'Sprache', en: 'Language' },
  'settings.signOut': { fr: 'Se déconnecter', de: 'Abmelden', en: 'Sign out' },

  // ── Home (authenticated) ──
  'home.title': { fr: 'Le Grimoire\nCulinaire', de: 'Das Kulinarische\nGrimoire', en: 'The Culinary\nGrimoire' },
  'home.subtitle': { fr: 'Vos recettes numérisées, organisées et toujours à portée de main.', de: 'Ihre Rezepte digitalisiert, organisiert und immer griffbereit.', en: 'Your recipes digitized, organized and always at your fingertips.' },
  'home.recipes': { fr: 'recette', de: 'Rezept', en: 'recipe' },
  'home.recipesPlural': { fr: 'recettes', de: 'Rezepte', en: 'recipes' },
  'home.favorites': { fr: 'favori', de: 'Favorit', en: 'favorite' },
  'home.favoritesPlural': { fr: 'favoris', de: 'Favoriten', en: 'favorites' },
  'home.recentlyViewed': { fr: 'Consultées récemment', de: 'Kürzlich angesehen', en: 'Recently viewed' },
  'home.allRecipes': { fr: 'Toutes mes recettes', de: 'Alle meine Rezepte', en: 'All my recipes' },
  'home.noRecipes': { fr: "Vous n'avez pas encore de recettes", de: 'Sie haben noch keine Rezepte', en: "You don't have any recipes yet" },
  'home.noRecipesDesc': { fr: 'Ajoutez votre première recette pour commencer votre grimoire !', de: 'Fügen Sie Ihr erstes Rezept hinzu, um Ihr Grimoire zu starten!', en: 'Add your first recipe to start your grimoire!' },
  'home.addRecipe': { fr: 'Ajouter une recette', de: 'Rezept hinzufügen', en: 'Add a recipe' },
  'home.timeJustNow': { fr: "A l'instant", de: 'Gerade eben', en: 'Just now' },

  // ── Home (landing) ──
  'landing.title': { fr: 'Le Grimoire Culinaire', de: 'Das Kulinarische Grimoire', en: 'The Culinary Grimoire' },
  'landing.subtitle': { fr: 'Numérisez vos recettes manuscrites, organisez votre collection et composez votre propre livre de cuisine.', de: 'Digitalisieren Sie Ihre handgeschriebenen Rezepte, organisieren Sie Ihre Sammlung und gestalten Sie Ihr eigenes Kochbuch.', en: 'Digitize your handwritten recipes, organize your collection and compose your own cookbook.' },
  'landing.getStarted': { fr: 'Commencer', de: 'Loslegen', en: 'Get started' },
  'landing.signIn': { fr: 'Se connecter', de: 'Anmelden', en: 'Sign in' },

  // ── Auth ──
  'auth.login': { fr: 'Connexion', de: 'Anmeldung', en: 'Sign in' },
  'auth.loginDesc': { fr: 'Accédez à votre Grimoire Culinaire', de: 'Zugriff auf Ihr Kulinarisches Grimoire', en: 'Access your Culinary Grimoire' },
  'auth.email': { fr: 'Email', de: 'E-Mail', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', de: 'Passwort', en: 'Password' },
  'auth.signIn': { fr: 'Se connecter', de: 'Anmelden', en: 'Sign in' },
  'auth.signingIn': { fr: 'Connexion...', de: 'Anmeldung...', en: 'Signing in...' },
  'auth.noAccount': { fr: 'Pas de compte ?', de: 'Noch kein Konto?', en: 'No account?' },
  'auth.register': { fr: 'Inscrivez-vous', de: 'Registrieren', en: 'Register' },
  'auth.forgotPassword': { fr: 'Mot de passe oublié ?', de: 'Passwort vergessen?', en: 'Forgot password?' },
  'auth.registerTitle': { fr: 'Inscription', de: 'Registrierung', en: 'Sign up' },
  'auth.registerDesc': { fr: 'Créez votre Grimoire Culinaire', de: 'Erstellen Sie Ihr Kulinarisches Grimoire', en: 'Create your Culinary Grimoire' },
  'auth.username': { fr: "Nom d'utilisateur", de: 'Benutzername', en: 'Username' },
  'auth.signUp': { fr: "S'inscrire", de: 'Registrieren', en: 'Sign up' },
  'auth.signingUp': { fr: 'Inscription...', de: 'Registrierung...', en: 'Signing up...' },
  'auth.hasAccount': { fr: 'Déjà inscrit ?', de: 'Bereits registriert?', en: 'Already registered?' },
  'auth.signInLink': { fr: 'Connectez-vous', de: 'Anmelden', en: 'Sign in' },
  'auth.forgotTitle': { fr: 'Mot de passe oublié', de: 'Passwort vergessen', en: 'Forgot password' },
  'auth.forgotDesc': { fr: 'Entrez votre email pour recevoir un lien de réinitialisation.', de: 'Geben Sie Ihre E-Mail ein, um einen Link zum Zurücksetzen zu erhalten.', en: 'Enter your email to receive a reset link.' },
  'auth.emailSent': { fr: 'Email envoyé !', de: 'E-Mail gesendet!', en: 'Email sent!' },
  'auth.emailSentDesc': { fr: 'Consultez votre boite mail et cliquez sur le lien pour réinitialiser votre mot de passe.', de: 'Überprüfen Sie Ihr Postfach und klicken Sie auf den Link, um Ihr Passwort zurückzusetzen.', en: 'Check your inbox and click the link to reset your password.' },
  'auth.sendLink': { fr: 'Envoyer le lien', de: 'Link senden', en: 'Send link' },
  'auth.sending': { fr: 'Envoi...', de: 'Wird gesendet...', en: 'Sending...' },
  'auth.backToLogin': { fr: 'Retour à la connexion', de: 'Zurück zur Anmeldung', en: 'Back to sign in' },
  'auth.resetTitle': { fr: 'Nouveau mot de passe', de: 'Neues Passwort', en: 'New password' },
  'auth.resetDesc': { fr: 'Choisissez un nouveau mot de passe pour votre compte.', de: 'Wählen Sie ein neues Passwort für Ihr Konto.', en: 'Choose a new password for your account.' },
  'auth.newPassword': { fr: 'Nouveau mot de passe', de: 'Neues Passwort', en: 'New password' },
  'auth.confirmPassword': { fr: 'Confirmer le mot de passe', de: 'Passwort bestätigen', en: 'Confirm password' },
  'auth.changePassword': { fr: 'Modifier le mot de passe', de: 'Passwort ändern', en: 'Change password' },
  'auth.changing': { fr: 'Modification...', de: 'Wird geändert...', en: 'Changing...' },
  'auth.passwordChanged': { fr: 'Mot de passe modifié', de: 'Passwort geändert', en: 'Password changed' },
  'auth.passwordChangedDesc': { fr: 'Votre mot de passe a été réinitialisé avec succès.', de: 'Ihr Passwort wurde erfolgreich zurückgesetzt.', en: 'Your password has been reset successfully.' },
  'auth.passwordMin': { fr: '6 caractères minimum', de: 'Mindestens 6 Zeichen', en: '6 characters minimum' },
  'auth.yourName': { fr: 'Votre nom', de: 'Ihr Name', en: 'Your name' },
  'auth.emailPlaceholder': { fr: 'votre@email.com', de: 'ihre@email.com', en: 'your@email.com' },

  // ── Search ──
  'search.title': { fr: 'Rechercher', de: 'Suchen', en: 'Search' },
  'search.placeholder': { fr: 'Rechercher une recette...', de: 'Rezept suchen...', en: 'Search for a recipe...' },
  'search.hint': { fr: "Tapez le nom d'une recette ou choisissez une catégorie...", de: 'Geben Sie einen Rezeptnamen ein oder wählen Sie eine Kategorie...', en: 'Type a recipe name or choose a category...' },
  'search.noResults': { fr: 'Aucun résultat pour', de: 'Keine Ergebnisse für', en: 'No results for' },
  'search.noResultsTitle': { fr: 'Aucun résultat', de: 'Keine Ergebnisse', en: 'No results' },
  'search.noResultsDesc': { fr: "Essayez avec d'autres mots-clés ou filtres.", de: 'Versuchen Sie es mit anderen Stichwörtern oder Filtern.', en: 'Try different keywords or filters.' },
  'search.results': { fr: 'résultat', de: 'Ergebnis', en: 'result' },
  'search.resultsPlural': { fr: 'résultats', de: 'Ergebnisse', en: 'results' },
  'search.filterHint': { fr: 'Tapez un mot-clé ou utilisez les filtres pour rechercher des recettes.', de: 'Geben Sie ein Stichwort ein oder verwenden Sie die Filter, um Rezepte zu suchen.', en: 'Type a keyword or use the filters to search for recipes.' },
  'search.close': { fr: 'Fermer', de: 'Schließen', en: 'Close' },

  // ── Categories ──
  'cat.entree': { fr: 'Entrées', de: 'Vorspeisen', en: 'Starters' },
  'cat.plat': { fr: 'Plats', de: 'Hauptgerichte', en: 'Mains' },
  'cat.dessert': { fr: 'Desserts', de: 'Desserts', en: 'Desserts' },
  'cat.boisson': { fr: 'Boissons', de: 'Getränke', en: 'Drinks' },
  'cat.sauce': { fr: 'Sauces', de: 'Soßen', en: 'Sauces' },
  'cat.accompagnement': { fr: 'Accomp.', de: 'Beilagen', en: 'Sides' },
  'cat.pain': { fr: 'Pains', de: 'Brote', en: 'Breads' },
  'cat.autre': { fr: 'Autre', de: 'Sonstiges', en: 'Other' },

  // ── Recipe ──
  'recipe.tested': { fr: 'Testée', de: 'Getestet', en: 'Tested' },
  'recipe.generatePhoto': { fr: 'Générer la photo', de: 'Foto generieren', en: 'Generate photo' },
  'recipe.persons': { fr: 'pers.', de: 'Pers.', en: 'serv.' },

  // ── Common ──
  'common.skipToContent': { fr: 'Aller au contenu principal', de: 'Zum Hauptinhalt springen', en: 'Skip to main content' },
  'common.backToTop': { fr: 'Retour en haut', de: 'Zurück nach oben', en: 'Back to top' },
} as const

export type TranslationKey = keyof typeof translations

export function getTranslation(key: TranslationKey, locale: Locale): string {
  return translations[key][locale]
}
