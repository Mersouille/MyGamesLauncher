# MyGames Launcher v1.8.7

**Date de publication :** 7 décembre 2025

## 🎯 Résumé

Version corrective apportant plusieurs améliorations importantes à l'expérience utilisateur, notamment dans la gestion de la musique, le mode Big Picture, et l'activation du journal des conversations.

---

## ✨ Nouvelles fonctionnalités

### 📝 Journal des conversations activé
- **Enregistrement automatique** des événements importants de l'application
- **Logs détaillés** pour :
  - 🚀 Démarrage de l'application
  - 🎮 Ajout, lancement et suppression de jeux
  - 🏆 Déblocage d'achievements
  - 🔄 Mises à jour de l'application
  - 📺 Activation du mode Big Picture
- **Consultation** via le menu "Aide > Journal"
- **Stockage persistant** dans `userData/logs/conversation.json`

---

## 🐛 Corrections de bugs

### 🎵 Musique d'ambiance
- ✅ **Correction majeure** : La musique suivante se lance maintenant automatiquement à la fin d'une piste
- ✅ Ajout d'un système de flag pour garantir la continuité de la lecture
- ✅ Logs améliorés pour le debug de la lecture musicale

### 📺 Mode Big Picture
- ✅ **Jaquettes agrandies** : Taille significativement augmentée pour une meilleure visibilité
  - 4K (3840px+) : 500px → 6 colonnes
  - 2K (2560px+) : 420px → 5 colonnes
  - Full HD (1920px+) : 380px → 4 colonnes
  - HD (1280px+) : 320px → 3 colonnes
- ✅ **Bouton "Lancer" repensé** :
  - Centré en bas de la jaquette
  - Taille proportionnelle à la carte (~4.8% de la largeur)
  - Meilleur équilibre visuel

### 🔄 Mises à jour
- ✅ **Auto-disparition des messages** :
  - "Recherche de mises à jour..." : 2 secondes
  - "Vérification en cours..." : 2 secondes
  - "Votre application est à jour" : 4 secondes
- ✅ Les messages importants (téléchargement, erreur) restent visibles

### 🎮 Gestion des contrôleurs
- ✅ **Correction de l'affichage** : Le texte est maintenant visible dans les champs "Nom du profil" et "Description"
- ✅ Remplacement de `theme.bg` (inexistant) par `theme.cardBg`

---

## 🔧 Améliorations techniques

### Architecture
- Meilleure gestion des refs React pour la musique (`shouldContinuePlayingRef`)
- Optimisation des timings de disparition des notifications
- Logs structurés avec métadonnées pour le journal

### Code
- Import du service `conversationLogger` dans `App.jsx`
- Logs automatiques dans tous les événements majeurs
- Correction des propriétés de thème dans `ControllerProfilesManager`

---

## 📦 Fichiers de la release

- `MyGames-Launcher-Setup-1.8.7.exe` (111 MB)
- `latest.yml` (fichier de configuration pour les mises à jour)

---

## 🚀 Installation

### Nouvelle installation
1. Téléchargez `MyGames-Launcher-Setup-1.8.7.exe`
2. Exécutez l'installateur
3. Suivez les instructions à l'écran

### Mise à jour depuis une version antérieure
1. **Automatique** : L'application détectera la mise à jour au démarrage
2. **Manuel** : Menu "Aide" → "Rechercher des mises à jour"
3. Cliquez sur "Redémarrer et installer" une fois le téléchargement terminé

---

## 📊 Statistiques

- **Fichiers modifiés** : 6
- **Lignes ajoutées** : ~196
- **Lignes supprimées** : ~66
- **Nouvelles fonctionnalités** : 1 (Journal des conversations)
- **Bugs corrigés** : 5
- **Améliorations UX** : 3

---

## 🔍 Changelog détaillé

### Musique (`useBackgroundMusic.js`)
```javascript
// Ajout du flag shouldContinuePlayingRef
const shouldContinuePlayingRef = useRef(false);

// Activation du flag à la fin d'une piste
shouldContinuePlayingRef.current = true;

// Prise en compte dans shouldPlay
const shouldPlay = wasPlaying || shouldContinuePlayingRef.current || ...
```

### Mode Big Picture (`BigPictureMode.jsx`)
```javascript
// Nouvelles tailles de cartes
const base = w >= 3840 ? 500 : w >= 2560 ? 420 : w >= 1920 ? 380 : 320;

// Bouton centré et proportionnel
<button style={{
  padding: `${Math.round(cardW * 0.025)}px ${Math.round(cardW * 0.045)}px`,
  fontSize: Math.round(cardW * 0.048),
  // ...
}}>
```

### Mises à jour (`App.jsx`)
```javascript
// Auto-disparition après délai
if (payload?.status === "checking" || payload?.status === "manual-check") {
  setTimeout(() => setUpdateStatus({ status: null, ... }), 2000);
} else if (payload?.status === "none") {
  setTimeout(() => setUpdateStatus({ status: null, ... }), 4000);
}
```

### Journal (`App.jsx` + `conversationLogger.js`)
```javascript
// Logs automatiques
logConversation({
  type: "success",
  title: "Jeu lancé",
  message: `${game.name} a été lancé avec succès`,
  meta: { gameId: game.id, gameName: game.name }
});
```

---

## 📝 Notes

- Compatible Windows 10/11 (64-bit)
- Nécessite une connexion internet pour les mises à jour automatiques
- Le journal est consultable via "Aide > Journal"
- Sauvegarde automatique toutes les 10 minutes
- Les jaquettes sont téléchargées depuis SteamGridDB (clé API optionnelle)

---

## 🙏 Remerciements

Merci aux utilisateurs pour leurs retours et suggestions d'amélioration !

---

**Profitez de cette nouvelle version ! 🎮✨**
