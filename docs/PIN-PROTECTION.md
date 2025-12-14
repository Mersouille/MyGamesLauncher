# 🔐 Protection par Code PIN

## Description

La fonctionnalité de protection par code PIN permet de sécuriser l'accès à certains jeux en demandant un code PIN à 4 chiffres avant le lancement.

## Fonctionnalités

### ✨ Caractéristiques

- **Code PIN à 4 chiffres** : Simple et sécurisé
- **Protection individuelle** : Configurable jeu par jeu
- **Indicateur visuel** : Badge 🔒 "Protégé" sur les jeux protégés
- **Animation d'erreur** : Effet "shake" en cas de code incorrect
- **Saisie automatique** : Le jeu se lance automatiquement après la saisie du 4ème chiffre
- **Journalisation** : Les tentatives d'accès sont enregistrées dans le journal

### 🎮 Utilisation

#### Activer la protection PIN sur un jeu

1. Cliquez sur le bouton **📝** (Détails) sur la carte du jeu
2. Faites défiler jusqu'à la section **"🔐 Protection par code PIN"**
3. Activez le toggle (interrupteur)
4. Entrez un code PIN à 4 chiffres (le code est masqué avec des astérisques)
5. Utilisez le bouton **👁️** pour révéler temporairement le code si nécessaire
6. Cliquez sur **💾 Enregistrer**

#### Lancer un jeu protégé

1. Cliquez sur **🚀 Lancer** sur un jeu protégé (reconnaissable au cadenas 🔒 en haut à droite)
2. Une fenêtre modale apparaît demandant le code PIN
3. Saisissez les 4 chiffres du code PIN
4. Le jeu se lance automatiquement après validation
5. En cas d'erreur, le modal affiche un message d'erreur avec animation

#### Désactiver la protection PIN

1. Ouvrez les détails du jeu (**📝**)
2. Désactivez le toggle dans la section **"🔐 Protection par code PIN"**
3. Cliquez sur **💾 Enregistrer**

#### Réinitialiser un code PIN oublié

1. Tentez de lancer le jeu protégé
2. Dans le modal de saisie du PIN, cliquez sur **"🔓 Code PIN oublié ? Réinitialiser la protection"**
3. Confirmez l'action (⚠️ Cette action supprime définitivement la protection)
4. Le jeu devient accessible sans code PIN
5. Vous pouvez définir un nouveau code PIN via les détails du jeu

### 🎨 Interface

### Modal de saisie du code PIN

- **Design moderne** : Interface sombre/claire adaptée au thème
- **4 champs de saisie** : Un par chiffre, avec focus automatique
- **Validation visuelle** : Bordures colorées indiquant l'état
- **Animation d'erreur** : Effet "shake" horizontal en cas d'échec
- **Messages clairs** : Indications de l'erreur et astuces
- **Option de réinitialisation** : Lien "Code PIN oublié ?" avec confirmation de sécurité

### Configuration du PIN dans les détails du jeu

- **Champ masqué** : Le code PIN est affiché avec des astérisques (****)
- **Bouton révéler/masquer** : Icône 👁️/🙈 pour afficher temporairement le PIN
- **Validation** : Alerte si le PIN contient moins de 4 chiffres

### Badge de protection

- **Icône cadenas** : 🔒 affiché en haut à droite de la jaquette (fond rouge)
- **Positionnement intelligent** : À gauche de l'étoile des favoris
- **Tooltip** : Info-bulle "Protégé par code PIN" au survol

## 🔒 Sécurité

### Limitations connues

⚠️ **Avertissement de sécurité** : Cette fonctionnalité offre une protection basique contre l'accès accidentel ou par des utilisateurs non techniques. Elle ne remplace pas une véritable sécurité système.

- Les codes PIN sont stockés **en clair** dans le fichier de configuration
- Il n'y a pas de limite de tentatives (pas de blocage après X échecs)
- Un utilisateur technique peut accéder aux fichiers de configuration

### Cas d'usage recommandés

✅ **Recommandé pour** :
- Contrôle parental basique
- Prévention de lancement accidentel
- Organisation personnelle (séparer jeux professionnels/personnels)
- Protection contre l'accès non autorisé par des enfants

❌ **Non recommandé pour** :
- Protection contre des utilisateurs techniques
- Sécurité critique de données sensibles
- Environnements multi-utilisateurs Windows (utiliser les comptes Windows à la place)

## 📝 Journalisation

Toutes les tentatives d'accès aux jeux protégés sont enregistrées dans le journal de conversation :

- ✅ **Accès réussi** : Lancement du jeu avec code correct
- ⚠️ **Accès refusé** : Tentative avec code incorrect (avec nom du jeu et timestamp)

Accédez au journal via le bouton **📝 Journal** dans la barre latérale.

## 🛠️ Développement

### Fichiers modifiés

- `src/components/PinModal.jsx` : Composant modal de saisie du PIN
- `src/components/GameDetailsModal.jsx` : Configuration du PIN dans les détails
- `src/components/GameGrid.jsx` : Badge de protection visuel
- `src/App.jsx` : Logique de vérification et intégration

### Structure de données

Propriétés ajoutées aux objets `game` :

```javascript
{
  id: 1,
  name: "Mon Jeu",
  path: "C:/Games/game.exe",
  // ... autres propriétés
  pinProtected: true,      // Booléen : protection activée
  pin: "1234"              // String : code PIN (4 chiffres)
}
```

### API

#### handleLaunchGame(game)

Fonction modifiée pour vérifier le PIN avant le lancement :

1. Vérifie si `game.pinProtected === true` et `game.pin` existe
2. Si oui, affiche le modal PIN et attend la validation
3. Sinon, lance le jeu directement

#### handlePinSubmit(enteredPin)

Vérifie le code PIN saisi :

- **Retourne `true`** : Code correct, lance le jeu
- **Retourne `false`** : Code incorrect, affiche une erreur

## ✅ Fonctionnalités implémentées

- [x] Code PIN à 4 chiffres avec validation
- [x] Affichage masqué du PIN (astérisques) avec bouton révéler/masquer
- [x] Badge cadenas � en haut à droite des jaquettes
- [x] Modal de saisie avec animation d'erreur
- [x] Système de réinitialisation avec confirmation de sécurité
- [x] Journalisation des tentatives d'accès
- [x] Support des thèmes clair/sombre

## �🔄 Améliorations futures possibles

- [ ] Chiffrement des codes PIN dans le stockage
- [ ] Limitation du nombre de tentatives (blocage temporaire)
- [ ] PIN maître pour débloquer tous les jeux
- [ ] Historique détaillé des tentatives d'accès
- [ ] Code PIN à 6 chiffres (option configurable)
- [ ] Support de codes alphanumériques
- [ ] Timeouts automatiques après échecs répétés
- [ ] Questions de sécurité personnalisées pour réinitialiser le PIN
- [ ] Authentification biométrique (empreinte digitale, reconnaissance faciale)

## 📄 Licence

Cette fonctionnalité fait partie de MyGames Launcher v1.8+
