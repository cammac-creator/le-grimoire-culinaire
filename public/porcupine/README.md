# Fichiers Porcupine (Wake Word)

## porcupine_params.pv
Fichier modèle Porcupine (fourni). Ne pas supprimer.

## ok-chef_wasm.ppn (à ajouter manuellement)
Fichier du mot-clé custom « OK Chef ».

### Comment l'obtenir :
1. Créer un compte sur https://console.picovoice.ai/
2. Aller dans « Porcupine » → « Custom Keywords »
3. Entrer le mot-clé : **OK Chef**
4. Sélectionner la plateforme : **Web (WASM)**
5. Entraîner et télécharger le fichier `.ppn`
6. Le renommer `ok-chef_wasm.ppn` et le placer ici

### En attendant
Sans ce fichier, le mot de réveil par défaut **"Computer"** est utilisé en fallback.
