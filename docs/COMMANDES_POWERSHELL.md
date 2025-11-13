# 📘 Guide des Commandes PowerShell - MyGames Launcher

## 📑 Table des matières

1. [Gestion Git](#1-gestion-git)
2. [Gestion des packages NPM](#2-gestion-des-packages-npm)
3. [Build et packaging](#3-build-et-packaging)
4. [Gestion des fichiers](#4-gestion-des-fichiers)
5. [Diagnostic et debug](#5-diagnostic-et-debug)
6. [Gestion de l'application installée](#6-gestion-de-lapplication-installée)

---

## 1. Gestion Git

### 1.1 Vérifier le statut du dépôt

```powershell
git status
```

**Explication :** Affiche l'état actuel du dépôt Git (fichiers modifiés, non suivis, prêts à être commités).

---

### 1.2 Ajouter des fichiers au staging

```powershell
git add <fichier>
```

**Explication :** Ajoute un fichier spécifique à la zone de staging pour le prochain commit.

**Exemple :**

```powershell
git add package.json
git add src/App.jsx
```

---

### 1.3 Ajouter tous les fichiers modifiés

```powershell
git add -A
```

**Explication :** Ajoute tous les fichiers modifiés, nouveaux et supprimés au staging.

---

### 1.4 Commiter les changements

```powershell
git commit -m "message du commit"
```

**Explication :** Crée un commit avec les fichiers en staging et un message descriptif.

**Exemples :**

```powershell
git commit -m "feat: Ajout sélection catégorie lors import"
git commit -m "fix: Correction musique qui se relance"
git commit -m "chore: bump version to 1.8.4"
```

---

### 1.5 Pousser les commits vers GitHub

```powershell
git push origin main
```

**Explication :** Envoie les commits locaux vers le dépôt distant GitHub sur la branche `main`.

---

### 1.6 Créer un tag de version

```powershell
git tag v1.8.4
```

**Explication :** Crée un tag Git pour marquer une version spécifique du code.

---

### 1.7 Pousser un tag vers GitHub

```powershell
git push origin v1.8.4
```

**Explication :** Envoie le tag vers le dépôt GitHub (nécessaire pour les releases).

---

### 1.8 Commandes Git combinées

```powershell
git add -A; git commit -m "message"; git push origin main
```

**Explication :** Enchaîne plusieurs commandes : ajoute tous les fichiers, crée un commit et pousse vers GitHub.

```powershell
git tag v1.8.4; git push origin v1.8.4
```

**Explication :** Crée un tag et le pousse immédiatement vers GitHub.

---

### 1.9 Voir les différences non commitées

```powershell
git diff <fichier>
```

**Explication :** Affiche les modifications apportées à un fichier spécifique depuis le dernier commit.

---

## 2. Gestion des packages NPM

### 2.1 Installer les dépendances

```powershell
npm install
```

**Explication :** Installe toutes les dépendances listées dans `package.json`.

---

### 2.2 Lancer l'application en mode développement

```powershell
npm start
```

**Explication :** Lance le serveur de développement Vite + Electron (hot-reload activé).

---

### 2.3 Builder l'application React

```powershell
npm run build-react
```

**Explication :** Compile l'application React avec Vite dans le dossier `dist-react/`.

---

### 2.4 Vérifier la configuration avant build

```powershell
npm run check-build
```

**Explication :** Exécute le script de vérification `scripts/check-build.cjs` pour valider la présence des fichiers essentiels.

---

### 2.5 Builder l'installateur Electron complet

```powershell
npm run build-electron
```

**Explication :** Exécute la séquence complète :

1. Vérification (`check-build`)
2. Build React (`build-react`)
3. Packaging Electron avec `electron-builder`

Génère l'installateur `.exe` dans `dist-electron/`.

---

## 3. Build et packaging

### 3.1 Workflow complet de release

```powershell
# 1. Modifier la version dans package.json (manuellement ou via code)
# 2. Commiter et pousser
git add package.json
git commit -m "chore: bump version to 1.8.5"
git push origin main

# 3. Créer et pousser le tag
git tag v1.8.5
git push origin v1.8.5

# 4. Builder l'application
npm run build-electron

# 5. Renommer l'installateur (voir section 4.2)
# 6. Créer la release GitHub avec les fichiers
```

---

## 4. Gestion des fichiers

### 4.1 Lister le contenu d'un dossier

```powershell
Get-ChildItem "chemin/du/dossier"
```

**Explication :** Liste tous les fichiers et dossiers dans le répertoire spécifié.

**Exemples :**

```powershell
Get-ChildItem "dist-electron"
Get-ChildItem "src/components"
```

---

### 4.2 Lister avec filtre et formatage

```powershell
Get-ChildItem "dist-electron\*.exe" | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime
```

**Explication :** Liste tous les fichiers `.exe` dans `dist-electron/` avec :

- Nom du fichier
- Taille en MB (arrondie à 2 décimales)
- Date de dernière modification

---

### 4.3 Filtrer par motif

```powershell
Get-ChildItem "dist-electron" | Where-Object {$_.Name -like "*1.8.4*"} | Select-Object Name
```

**Explication :** Liste uniquement les fichiers dont le nom contient "1.8.4".

---

### 4.4 Renommer un fichier

```powershell
Rename-Item "dist-electron\MyGames Launcher Setup 1.8.4.exe" "MyGames-Launcher-Setup-1.8.4.exe"
```

**Explication :** Renomme le fichier installateur pour correspondre au format attendu par `latest.yml` (remplace les espaces par des tirets).

⚠️ **Important :** Ce renommage est **obligatoire** pour que le système de mise à jour fonctionne !

---

### 4.5 Supprimer un dossier récursivement

```powershell
Remove-Item -Recurse -Force "dist-electron" -ErrorAction SilentlyContinue
```

**Explication :** Supprime le dossier `dist-electron` et tout son contenu, sans demander de confirmation. Ignore les erreurs si le dossier n'existe pas.

---

### 4.6 Rechercher des fichiers récursivement

```powershell
Get-ChildItem "C:\Program Files" -Recurse -Filter "MyGames*.exe" -ErrorAction SilentlyContinue | Select-Object FullName
```

**Explication :** Recherche tous les fichiers `.exe` commençant par "MyGames" dans `C:\Program Files` et ses sous-dossiers.

---

### 4.7 Calculer la taille d'un fichier

```powershell
[math]::Round((Get-Item "fichier.exe").Length / 1MB, 2)
```

**Explication :** Calcule et affiche la taille du fichier en mégaoctets, arrondie à 2 décimales.

---

## 5. Diagnostic et debug

### 5.1 Vérifier les informations de registre Windows

```powershell
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" | Where-Object {$_.DisplayName -like "*MyGames*"} | Select-Object DisplayName, InstallLocation
```

**Explication :** Recherche les informations d'installation de MyGames Launcher dans le registre Windows (version installée, chemin d'installation).

---

### 5.2 Trouver l'emplacement d'installation

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Programs" -Recurse -Filter "*MyGames*.exe" -ErrorAction SilentlyContinue | Select-Object FullName
```

**Explication :** Recherche l'exécutable de MyGames Launcher dans le dossier des applications utilisateur (AppData\Local\Programs).

**Résultat typique :**

```text
C:\Users\[Utilisateur]\AppData\Local\Programs\MyGames Launcher\MyGames Launcher.exe
```

C:\Users\[Utilisateur]\AppData\Local\Programs\MyGames Launcher\MyGames Launcher.exe

````

---

### 5.3 Lister les dossiers liés à l'application

```powershell
Get-ChildItem "$env:LOCALAPPDATA" -Directory | Where-Object {$_.Name -like "*MyGames*" -or $_.Name -like "*mygames*"} | Select-Object FullName
````

**Explication :** Liste tous les dossiers dans AppData\Local contenant "MyGames" dans leur nom.

**Dossiers typiques :**

- `mygames-launcher-updater` (cache des mises à jour)
- `MyGames Launcher` (données de l'application dans AppData\Roaming)

---

### 5.4 Lancer l'application avec logs visibles

```powershell
& "C:\Users\[Utilisateur]\AppData\Local\Programs\MyGames Launcher\MyGames Launcher.exe"
```

**Explication :** Lance l'application installée depuis PowerShell, permettant de voir les logs du processus principal Electron (console.log de main.cjs).

⚠️ **Important :** Remplacez `[Utilisateur]` par votre nom d'utilisateur Windows.

**Utilité :** Indispensable pour diagnostiquer les problèmes de mise à jour, car les logs `console.log()` du processus principal n'apparaissent pas dans DevTools.

---

### 5.5 Attendre puis exécuter une commande

```powershell
Start-Sleep -Seconds 3; npm run build-electron
```

**Explication :** Attend 3 secondes puis lance le build Electron. Utile pour laisser le temps aux processus de se terminer proprement.

---

## 6. Gestion de l'application installée

### 6.1 Localiser le dossier userData

Le dossier `userData` contient toutes les données de l'application (jeux, paramètres, collections, etc.).

**Chemin typique :**

```
C:\Users\[Utilisateur]\AppData\Roaming\MyGames Launcher\
```

**Contenu :**

- `games.json` - Base de données des jeux
- `collections.json` - Collections personnalisées
- `controller-profiles.json` - Profils de manettes
- `covers/` - Jaquettes des jeux
- `backups/` - Sauvegardes automatiques
- `logs/` - Journal des conversations

---

### 6.2 Accéder rapidement au dossier userData

```powershell
explorer "$env:APPDATA\MyGames Launcher"
```

**Explication :** Ouvre le dossier userData de MyGames Launcher dans l'Explorateur Windows.

---

### 6.3 Localiser le cache de mise à jour

```powershell
explorer "$env:LOCALAPPDATA\mygames-launcher-updater"
```

**Explication :** Ouvre le dossier où sont stockés les fichiers de mise à jour téléchargés.

**Contenu :**

- `pending/` - Installateurs téléchargés en attente d'installation
- `packages/` - Archives des versions précédentes

---

### 6.4 Sauvegarder manuellement les données

```powershell
Copy-Item "$env:APPDATA\MyGames Launcher\games.json" "E:\Backup\games_backup_$(Get-Date -Format 'yyyy-MM-dd').json"
```

**Explication :** Copie le fichier `games.json` vers un dossier de sauvegarde avec la date du jour dans le nom.

---

## 7. Variables d'environnement utiles

### 7.1 Variables PowerShell pour chemins Windows

| Variable            | Chemin typique                       | Description                      |
| ------------------- | ------------------------------------ | -------------------------------- |
| `$env:APPDATA`      | `C:\Users\[User]\AppData\Roaming`    | Données d'application (userData) |
| `$env:LOCALAPPDATA` | `C:\Users\[User]\AppData\Local`      | Données locales (cache, updater) |
| `$env:USERPROFILE`  | `C:\Users\[User]`                    | Dossier utilisateur              |
| `$env:TEMP`         | `C:\Users\[User]\AppData\Local\Temp` | Fichiers temporaires             |

**Utilisation :**

```powershell
cd $env:APPDATA
explorer $env:LOCALAPPDATA
```

---

## 8. Commandes avancées et astuces

### 8.1 Enchaîner plusieurs commandes

```powershell
# Avec point-virgule (toutes s'exécutent même en cas d'erreur)
commande1; commande2; commande3

# Avec && (s'arrête si une commande échoue) - PowerShell 7+
commande1 && commande2 && commande3
```

---

### 8.2 Rediriger les erreurs

```powershell
npm run build-electron 2>&1 | Tee-Object -FilePath "build.log"
```

**Explication :** Exécute le build et enregistre tous les logs (stdout + stderr) dans `build.log` tout en les affichant.

---

### 8.3 Exécuter en arrière-plan

Dans VS Code / Copilot, les commandes peuvent être lancées en arrière-plan avec le paramètre `isBackground: true`.

---

### 8.4 Mesurer le temps d'exécution

```powershell
Measure-Command { npm run build-electron }
```

**Explication :** Exécute la commande et affiche le temps d'exécution total.

---

## 9. Checklist de release complète

### ✅ Procédure complète pour publier une nouvelle version

#### Étape 1 : Préparer le code

```powershell
# Vérifier qu'il n'y a pas de changements non commités
git status

# Si des changements existent, les commiter
git add -A
git commit -m "votre message"
```

#### Étape 2 : Incrémenter la version

Modifier `package.json` :

```json
{
  "version": "1.8.5" // Nouvelle version
}
```

#### Étape 3 : Commiter et tagger

```powershell
git add package.json
git commit -m "chore: bump version to 1.8.5"
git push origin main
git tag v1.8.5
git push origin v1.8.5
```

#### Étape 4 : Builder l'installateur

```powershell
npm run build-electron
```

#### Étape 5 : Renommer l'installateur

```powershell
Rename-Item "dist-electron\MyGames Launcher Setup 1.8.5.exe" "MyGames-Launcher-Setup-1.8.5.exe"
```

#### Étape 6 : Vérifier les fichiers

```powershell
Get-ChildItem "dist-electron" | Where-Object {$_.Name -like "*1.8.5*"} | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}
```

Vous devez avoir :

- ✅ `MyGames-Launcher-Setup-1.8.5.exe` (~111 MB)
- ✅ `latest.yml` (petit fichier texte)

#### Étape 7 : Créer la release GitHub

1. Aller sur https://github.com/Mersouille/MyGamesLauncher/releases/new
2. Sélectionner le tag `v1.8.5`
3. Titre : `Version 1.8.5`
4. Description : Décrire les changements
5. **Uploader ces 2 fichiers :**
   - `MyGames-Launcher-Setup-1.8.5.exe`
   - `latest.yml`
6. Publier la release

#### Étape 8 : Tester la mise à jour

Depuis une version antérieure installée :

```powershell
& "C:\Users\[Utilisateur]\AppData\Local\Programs\MyGames Launcher\MyGames Launcher.exe"
```

Puis cliquer sur "Aide" → "Rechercher des mises à jour"

---

## 10. Dépannage

### Problème : "npm : command not found"

**Solution :** Installer Node.js depuis https://nodejs.org/

---

### Problème : Build Electron échoue avec "ENOENT"

**Solution :** Nettoyer et reconstruire

```powershell
Remove-Item -Recurse -Force "dist-electron", "dist-react", "node_modules"
npm install
npm run build-electron
```

---

### Problème : Mise à jour non détectée

**Vérifications :**

1. Le dépôt GitHub est-il **public** ?
2. La release est-elle **publiée** (pas en draft) ?
3. Les fichiers `MyGames-Launcher-Setup-X.X.X.exe` ET `latest.yml` sont-ils uploadés ?
4. Le nom du fichier exe correspond-il exactement à celui dans `latest.yml` ?

**Test :**

```powershell
# Lancer l'app avec logs visibles
& "C:\Users\[Utilisateur]\AppData\Local\Programs\MyGames Launcher\MyGames Launcher.exe"
# Cliquer sur "Rechercher des mises à jour"
# Observer les logs dans le terminal
```

---

### Problème : Git refuse de pusher

```powershell
# Vérifier la branche actuelle
git branch

# Forcer le push (attention, peut écraser l'historique distant)
git push origin main --force
```

---

## 11. Commandes de maintenance

### 11.1 Nettoyer les fichiers de build

```powershell
Remove-Item -Recurse -Force "dist-electron", "dist-react"
```

---

### 11.2 Réinstaller les dépendances

```powershell
Remove-Item -Recurse -Force "node_modules"
npm install
```

---

### 11.3 Vider le cache npm

```powershell
npm cache clean --force
```

---

### 11.4 Mettre à jour les dépendances

```powershell
# Vérifier les versions disponibles
npm outdated

# Mettre à jour toutes les dépendances (attention, peut casser des choses)
npm update

# Mettre à jour une dépendance spécifique
npm update electron
```

---

## 📚 Ressources supplémentaires

- **Documentation PowerShell :** <https://docs.microsoft.com/powershell/>
- **Documentation Git :** <https://git-scm.com/doc>
- **Documentation npm :** <https://docs.npmjs.com/>
- **Documentation Electron :** <https://www.electronjs.org/docs>
- **Documentation electron-builder :** <https://www.electron.build/>

---

## 📝 Notes importantes

1. **Toujours renommer l'installateur** après le build pour correspondre au format `MyGames-Launcher-Setup-X.X.X.exe`
2. **Toujours uploader `latest.yml`** avec l'installateur sur GitHub
3. **Le dépôt doit être public** pour que les mises à jour automatiques fonctionnent
4. **Les logs du processus principal** (main.cjs) ne sont visibles que depuis le terminal, pas dans DevTools

---

_Document créé le 13 novembre 2025_  
_Projet : MyGames Launcher v1.8_  
_Auteur : GitHub Copilot_
