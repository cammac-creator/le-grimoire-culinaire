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
  'recipe.back': { fr: 'Retour', de: 'Zurück', en: 'Back' },
  'recipe.edit': { fr: 'Modifier', de: 'Bearbeiten', en: 'Edit' },
  'recipe.editTitle': { fr: 'Modifier la recette', de: 'Rezept bearbeiten', en: 'Edit recipe' },
  'recipe.saveChanges': { fr: 'Enregistrer les modifications', de: 'Änderungen speichern', en: 'Save changes' },
  'recipe.save': { fr: 'Enregistrer', de: 'Speichern', en: 'Save' },
  'recipe.saving': { fr: 'Enregistrement...', de: 'Wird gespeichert...', en: 'Saving...' },
  'recipe.notFound': { fr: 'Recette introuvable.', de: 'Rezept nicht gefunden.', en: 'Recipe not found.' },
  'recipe.unauthorized': { fr: 'Non autorisé', de: 'Nicht berechtigt', en: 'Unauthorized' },
  'recipe.delete': { fr: 'Supprimer', de: 'Löschen', en: 'Delete' },
  'recipe.deleteConfirm': { fr: 'Supprimer cette recette ?', de: 'Dieses Rezept löschen?', en: 'Delete this recipe?' },
  'recipe.deleteWarning': { fr: 'Cette action est irréversible.', de: 'Diese Aktion kann nicht rückgängig gemacht werden.', en: 'This action cannot be undone.' },
  'recipe.prep': { fr: 'Préparation', de: 'Vorbereitung', en: 'Prep' },
  'recipe.cooking': { fr: 'Cuisson', de: 'Kochen', en: 'Cooking' },
  'recipe.servings': { fr: 'Portions', de: 'Portionen', en: 'Servings' },
  'recipe.author': { fr: 'Auteur', de: 'Autor', en: 'Author' },
  'recipe.ingredients': { fr: 'Ingrédients', de: 'Zutaten', en: 'Ingredients' },
  'recipe.steps': { fr: 'Préparation', de: 'Zubereitung', en: 'Preparation' },
  'recipe.notes': { fr: 'Notes', de: 'Notizen', en: 'Notes' },
  'recipe.addPhoto': { fr: 'Ajouter ma photo', de: 'Mein Foto hinzufügen', en: 'Add my photo' },
  'recipe.uploading': { fr: 'Upload en cours...', de: 'Wird hochgeladen...', en: 'Uploading...' },
  'recipe.takePhoto': { fr: 'Prendre ou choisir une photo', de: 'Foto aufnehmen oder auswählen', en: 'Take or choose a photo' },
  'recipe.generateAI': { fr: 'Générer une photo IA', de: 'KI-Foto generieren', en: 'Generate AI photo' },
  'recipe.generating': { fr: 'Génération en cours...', de: 'Wird generiert...', en: 'Generating...' },
  'recipe.aiCreated': { fr: 'Créée par IA à partir de la recette', de: 'KI-generiert aus dem Rezept', en: 'AI-generated from the recipe' },
  'recipe.share': { fr: 'Partager', de: 'Teilen', en: 'Share' },
  'recipe.linkCopied': { fr: 'Lien copié !', de: 'Link kopiert!', en: 'Link copied!' },
  'recipe.addToList': { fr: 'Liste de courses', de: 'Einkaufsliste', en: 'Shopping list' },
  'recipe.inList': { fr: 'Dans la liste', de: 'In der Liste', en: 'In the list' },
  'recipe.addedToList': { fr: 'Ajouté à la liste de courses.', de: 'Zur Einkaufsliste hinzugefügt.', en: 'Added to shopping list.' },
  'recipe.cookingMode': { fr: 'Mode cuisine', de: 'Kochmodus', en: 'Cooking mode' },

  // ── Recipe Form ──
  'form.title': { fr: 'Titre', de: 'Titel', en: 'Title' },
  'form.titlePlaceholder': { fr: 'Nom de la recette', de: 'Name des Rezepts', en: 'Recipe name' },
  'form.description': { fr: 'Description', de: 'Beschreibung', en: 'Description' },
  'form.descPlaceholder': { fr: 'Une courte description...', de: 'Kurze Beschreibung...', en: 'A short description...' },
  'form.category': { fr: 'Catégorie', de: 'Kategorie', en: 'Category' },
  'form.chooseCat': { fr: 'Choisir...', de: 'Wählen...', en: 'Choose...' },
  'form.servings': { fr: 'Portions', de: 'Portionen', en: 'Servings' },
  'form.addTag': { fr: 'Ajouter un tag (Entrée)', de: 'Tag hinzufügen (Enter)', en: 'Add a tag (Enter)' },
  'form.prepTime': { fr: 'Préparation (min)', de: 'Vorbereitung (Min.)', en: 'Prep time (min)' },
  'form.cookTime': { fr: 'Cuisson (min)', de: 'Kochzeit (Min.)', en: 'Cook time (min)' },
  'form.ingredients': { fr: 'Ingrédients', de: 'Zutaten', en: 'Ingredients' },
  'form.quantity': { fr: 'Quantité', de: 'Menge', en: 'Quantity' },
  'form.unit': { fr: 'Unité', de: 'Einheit', en: 'Unit' },
  'form.ingredient': { fr: 'Ingrédient', de: 'Zutat', en: 'Ingredient' },
  'form.steps': { fr: 'Étapes', de: 'Schritte', en: 'Steps' },
  'form.stepPlaceholder': { fr: 'Étape', de: 'Schritt', en: 'Step' },
  'form.add': { fr: 'Ajouter', de: 'Hinzufügen', en: 'Add' },
  'form.reorder': { fr: 'Réordonner', de: 'Neu ordnen', en: 'Reorder' },
  'form.authorPlaceholder': { fr: 'Grand-mère, magazine...', de: 'Großmutter, Zeitschrift...', en: 'Grandmother, magazine...' },
  'form.noFont': { fr: 'Aucune police', de: 'Keine Schriftart', en: 'No font' },
  'form.none': { fr: 'Aucune', de: 'Keine', en: 'None' },
  'form.validationError': { fr: 'Erreur de validation', de: 'Validierungsfehler', en: 'Validation error' },
  'form.checkFields': { fr: 'Veuillez vérifier les champs du formulaire.', de: 'Bitte überprüfen Sie die Formularfelder.', en: 'Please check the form fields.' },
  'form.dietaryTags': { fr: 'Tags diététiques', de: 'Ernährungstags', en: 'Dietary tags' },

  // ── Favorites ──
  'fav.noFavorites': { fr: 'Aucun favori', de: 'Keine Favoriten', en: 'No favorites' },
  'fav.noFavoritesDesc': { fr: 'Ajoutez des recettes en favoris en cliquant sur le coeur.', de: 'Fügen Sie Rezepte zu Favoriten hinzu, indem Sie auf das Herz klicken.', en: 'Add recipes to favorites by clicking the heart.' },
  'fav.addToFav': { fr: 'Ajouter aux favoris', de: 'Zu Favoriten hinzufügen', en: 'Add to favorites' },
  'fav.removeFromFav': { fr: 'Retirer des favoris', de: 'Aus Favoriten entfernen', en: 'Remove from favorites' },

  // ── Shopping List ──
  'shop.title': { fr: 'Liste de courses', de: 'Einkaufsliste', en: 'Shopping list' },
  'shop.print': { fr: 'Imprimer', de: 'Drucken', en: 'Print' },
  'shop.clear': { fr: 'Vider', de: 'Leeren', en: 'Clear' },
  'shop.ingredients': { fr: 'Ingrédients', de: 'Zutaten', en: 'Ingredients' },
  'shop.empty': { fr: 'Liste vide', de: 'Liste leer', en: 'List empty' },
  'shop.emptyDesc': { fr: "Ajoutez des recettes à votre liste depuis la page d'une recette.", de: 'Fügen Sie Rezepte von der Rezeptseite zu Ihrer Liste hinzu.', en: 'Add recipes to your list from a recipe page.' },

  // ── Meal Planner ──
  'meal.title': { fr: 'Planificateur de repas', de: 'Essensplaner', en: 'Meal planner' },
  'meal.addToShop': { fr: 'Ajouter aux courses', de: 'Zur Einkaufsliste', en: 'Add to shopping list' },
  'meal.addedToShop': { fr: 'Ingrédients ajoutés à la liste de courses !', de: 'Zutaten zur Einkaufsliste hinzugefügt!', en: 'Ingredients added to shopping list!' },
  'meal.breakfast': { fr: 'Petit-déj', de: 'Frühstück', en: 'Breakfast' },
  'meal.lunch': { fr: 'Déjeuner', de: 'Mittagessen', en: 'Lunch' },
  'meal.dinner': { fr: 'Dîner', de: 'Abendessen', en: 'Dinner' },
  'meal.snack': { fr: 'Collation', de: 'Snack', en: 'Snack' },
  'meal.mon': { fr: 'Lun', de: 'Mo', en: 'Mon' },
  'meal.tue': { fr: 'Mar', de: 'Di', en: 'Tue' },
  'meal.wed': { fr: 'Mer', de: 'Mi', en: 'Wed' },
  'meal.thu': { fr: 'Jeu', de: 'Do', en: 'Thu' },
  'meal.fri': { fr: 'Ven', de: 'Fr', en: 'Fri' },
  'meal.sat': { fr: 'Sam', de: 'Sa', en: 'Sat' },
  'meal.sun': { fr: 'Dim', de: 'So', en: 'Sun' },
  'meal.chooseRecipe': { fr: 'Choisir une recette', de: 'Rezept auswählen', en: 'Choose a recipe' },
  'meal.searchRecipe': { fr: 'Rechercher...', de: 'Suchen...', en: 'Search...' },

  // ── Breadcrumbs ──
  'bc.home': { fr: 'Accueil', de: 'Startseite', en: 'Home' },
  'bc.search': { fr: 'Rechercher', de: 'Suchen', en: 'Search' },
  'bc.recipes': { fr: 'Recettes', de: 'Rezepte', en: 'Recipes' },
  'bc.newRecipe': { fr: 'Nouvelle recette', de: 'Neues Rezept', en: 'New recipe' },
  'bc.edit': { fr: 'Modifier', de: 'Bearbeiten', en: 'Edit' },
  'bc.myRecipes': { fr: 'Mes recettes', de: 'Meine Rezepte', en: 'My recipes' },
  'bc.favorites': { fr: 'Favoris', de: 'Favoriten', en: 'Favorites' },
  'bc.shopping': { fr: 'Courses', de: 'Einkaufen', en: 'Shopping' },
  'bc.planner': { fr: 'Planificateur', de: 'Planer', en: 'Planner' },
  'bc.scanner': { fr: 'Scanner', de: 'Scanner', en: 'Scanner' },
  'bc.importPdf': { fr: 'Import PDF', de: 'PDF-Import', en: 'PDF import' },
  'bc.importUrl': { fr: 'Import URL', de: 'URL-Import', en: 'URL import' },
  'bc.bookBuilder': { fr: 'Livre', de: 'Buch', en: 'Book' },
  'bc.fonts': { fr: 'Polices', de: 'Schriften', en: 'Fonts' },
  'bc.pressureCooker': { fr: 'Cocotte pression', de: 'Schnellkochtopf', en: 'Pressure cooker' },
  'bc.login': { fr: 'Connexion', de: 'Anmeldung', en: 'Sign in' },
  'bc.register': { fr: 'Inscription', de: 'Registrierung', en: 'Sign up' },

  // ── Header ──
  'header.add': { fr: 'Ajouter', de: 'Hinzufügen', en: 'Add' },
  'header.signOut': { fr: 'Se déconnecter', de: 'Abmelden', en: 'Sign out' },
  'header.signIn': { fr: 'Connexion', de: 'Anmelden', en: 'Sign in' },
  'header.register': { fr: 'Inscription', de: 'Registrieren', en: 'Sign up' },

  // ── Comments ──
  'comment.title': { fr: 'Commentaires', de: 'Kommentare', en: 'Comments' },
  'comment.placeholder': { fr: 'Ajouter un commentaire...', de: 'Kommentar hinzufügen...', en: 'Add a comment...' },
  'comment.none': { fr: 'Aucun commentaire pour le moment.', de: 'Noch keine Kommentare.', en: 'No comments yet.' },

  // ── Filters ──
  'filter.category': { fr: 'Catégorie', de: 'Kategorie', en: 'Category' },
  'filter.notTested': { fr: 'Non testées', de: 'Nicht getestet', en: 'Not tested' },

  // ── Timer ──
  'timer.delete': { fr: 'Supprimer le minuteur', de: 'Timer löschen', en: 'Delete timer' },
  'timer.stop': { fr: "Arrêter l'alarme", de: 'Alarm stoppen', en: 'Stop alarm' },
  'timer.restart': { fr: 'Relancer', de: 'Neu starten', en: 'Restart' },
  'timer.pause': { fr: 'Pause', de: 'Pause', en: 'Pause' },
  'timer.start': { fr: 'Démarrer', de: 'Starten', en: 'Start' },
  'timer.reset': { fr: 'Réinitialiser', de: 'Zurücksetzen', en: 'Reset' },
  'timer.show': { fr: 'Afficher les minuteurs', de: 'Timer anzeigen', en: 'Show timers' },
  'timer.hide': { fr: 'Réduire les minuteurs', de: 'Timer minimieren', en: 'Minimize timers' },
  'timer.started': { fr: 'Minuteur lancé', de: 'Timer gestartet', en: 'Timer started' },

  // ── Pressure Cooker ──
  'pc.title': { fr: 'Cocotte pression', de: 'Schnellkochtopf', en: 'Pressure cooker' },
  'pc.subtitle': { fr: 'Temps de cuisson Duromatic', de: 'Kochzeiten Duromatic', en: 'Duromatic cooking times' },
  'pc.searchPlaceholder': { fr: 'Rechercher un aliment...', de: 'Lebensmittel suchen...', en: 'Search for a food...' },
  'pc.clearSearch': { fr: 'Effacer la recherche', de: 'Suche löschen', en: 'Clear search' },
  'pc.byCategory': { fr: 'Par catégorie', de: 'Nach Kategorie', en: 'By category' },
  'pc.fastest': { fr: "Plus rapide d'abord", de: 'Schnellste zuerst', en: 'Fastest first' },
  'pc.slowest': { fr: "Plus long d'abord", de: 'Längste zuerst', en: 'Slowest first' },
  'pc.az': { fr: 'A → Z', de: 'A → Z', en: 'A → Z' },
  'pc.level': { fr: 'Niv.', de: 'St.', en: 'Lv.' },
  'pc.startTimer': { fr: 'lancer le minuteur', de: 'Timer starten', en: 'start timer' },

  // ── Add Recipe ──
  'add.title': { fr: 'Ajouter une recette', de: 'Rezept hinzufügen', en: 'Add a recipe' },

  // ── Common ──
  'common.skipToContent': { fr: 'Aller au contenu principal', de: 'Zum Hauptinhalt springen', en: 'Skip to main content' },
  'common.backToTop': { fr: 'Retour en haut', de: 'Zurück nach oben', en: 'Back to top' },
  'common.error': { fr: 'Erreur', de: 'Fehler', en: 'Error' },
  'common.close': { fr: 'Fermer', de: 'Schließen', en: 'Close' },
  'common.cancel': { fr: 'Annuler', de: 'Abbrechen', en: 'Cancel' },
  'common.confirm': { fr: 'Confirmer', de: 'Bestätigen', en: 'Confirm' },
} as const

export type TranslationKey = keyof typeof translations

export function getTranslation(key: TranslationKey, locale: Locale): string {
  return translations[key][locale]
}
