# 📦 Publication & Mises à jour (GitHub Releases)

Ce guide décrit comment préparer et publier des versions packagées de **MyGames Launcher** avec système de mise à jour automatique via `electron-updater`.

---

## 1. Pré-requis

- Compte GitHub
- Node.js installé
- Repository GitHub (à créer) : ex. `MyGamesLauncher`
- Token GitHub personnel (PAT) avec scope `repo` (nommé `GH_TOKEN`)
- Version unique dans `package.json` (ex: 1.8.1)

---

## 2. Création du dépôt

Dans le dossier du projet (racine actuelle):

```powershell
# Initialiser si pas encore un dépôt
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit MyGames Launcher"

# Créer le dépôt sur GitHub (manuel via interface web) : MyGamesLauncher
# Puis ajouter le remote :
git remote add origin https://github.com/<OWNER>/<REPO>.git

# Pousser la branche principale
git branch -M main
git push -u origin main
```

Remplace `<OWNER>` par ton nom d'utilisateur et `<REPO>` par le nom choisi (ex. `MyGamesLauncher`).

---

## 3. Configuration `package.json`

Dans la section `build` :

```json
"publish": [{
  "provider": "github",
  "owner": "<OWNER>",
  "repo": "<REPO>"
}]
```

Assure-toi que le bloc **publish** contient les valeurs réelles. (Actuellement des placeholders.)

Chaque release doit incrémenter le champ racine `"version"`.

---

## 4. Générer une version packagée

Avant de packager, bump version :

```powershell
# Exemple : passer de 1.8.0 à 1.8.1
# (Modifie package.json manuellement ou via script)
```

Construire :

```powershell
# Depuis le dossier du projet
$env:GH_TOKEN="TON_TOKEN_GITHUB"

npm install
npm run build-electron
```

Résultat dans `dist-electron/` :

- Installateur `.exe`
- Fichier `latest.yml`
- Autres artefacts (NSIS, etc.)

---

## 5. Créer la release GitHub

1. Aller sur la page du dépôt GitHub
2. Onglet "Releases" → "Draft a new release"
3. Tag (ex: `v1.8.1`) — le tag doit correspondre à la version
4. Titre : `MyGames Launcher v1.8.1`
5. Glisser-déposer :
   - `MyGames Launcher Setup 1.8.1.exe`
   - `latest.yml`
6. Publier la release

Une fois publiée, l'application packagée pourra détecter la nouvelle version lors du démarrage.

---

## 6. Cycle de mise à jour côté utilisateur

1. L'utilisateur installe la version initiale
2. Tu publies une nouvelle release GitHub avec version supérieure
3. Au démarrage : `autoUpdater.checkForUpdatesAndNotify()` contacte GitHub
4. Téléchargement → événement `update-downloaded` → bouton "Redémarrer et installer" actif
5. L'application redémarre installée sur la nouvelle version

---

## 7. Vérification locale

En développement (`npm start`), l'autoUpdater est **désactivé** (garde ajoutée dans `main.cjs`).
Pour tester réellement:

- Utiliser l'installateur généré
- Lancer l'application installée (pas depuis `npm start`)

---

## 8. Prochaine version (exemple de workflow)

```text
1. Implémenter une nouvelle fonctionnalité
2. Mettre à jour CHANGELOG (optionnel)
3. Incrémenter version dans package.json (ex: 1.8.2)
4. git commit -am "feat: ajout X"
5. git tag v1.8.2
6. git push && git push --tags
7. npm run build-electron (avec GH_TOKEN)
8. Créer release et uploader artefacts
```

---

## 9. Gestion des erreurs

- Si `update-status` renvoie `error`, vérifier :
  - Token invalide / manque de scope
  - Fichier `latest.yml` absent de la release
  - Mauvaise version (tag != version package.json)
  - Absence du bloc `publish` correct

Logs utiles dans la console principale et éventuellement `%APPDATA%/MyGames Launcher/logs` si activé.

---

## 10. Provider "generic" (alternative)

Si tu souhaites héberger toi-même les fichiers :

```json
"publish": [{
  "provider": "generic",
  "url": "https://ton-domaine.com/mygames/releases/"
}]
```

À cette URL doivent se trouver `latest.yml` + installateur `.exe`.

---

## 11. Sécurité du token

Ne jamais committer `GH_TOKEN`. Le définir dans la session Powershell ou variable d'environnement système.

Exemple permanence Windows :

```powershell
[Environment]::SetEnvironmentVariable("GH_TOKEN", "TON_TOKEN_GITHUB", "User")
```

Relancer la console ensuite.

---

## 12. Ressources

- electron-builder publish docs: <https://www.electron.build/configuration/publish>
- electron-updater: <https://www.electron.build/auto-update>
- NSIS config: Voir section `build.nsis` dans `package.json`

---

## 13. Check rapide avant release

- [ ] Version bump
- [ ] Bloc publish correct
- [ ] Build réussie
- [ ] Tag pushé
- [ ] Release avec .exe + latest.yml
- [ ] Test installation sur machine propre

Bon déploiement 🚀
