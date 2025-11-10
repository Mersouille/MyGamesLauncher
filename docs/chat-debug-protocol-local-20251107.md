# Débogage du protocole local:// (MyGames v1.7)

Date : 7 novembre 2025

## 🎯 Contexte et problème

Correction du protocole `local://` pour l'affichage des jaquettes stockées dans le dossier `/covers`.
Message dans le terminal : ✅ mais erreur dans DevTools :

```
Refused to connect to 'local://covers/xxx.jpg' because it violates the Content Security Policy
```

## 🔍 Analyse et actions effectuées

### 1. Vérification du protocole local

- ✅ Protocole `local://` bien enregistré dans les logs
- Fonction `registerLocalProtocol()` correctement implémentée dans `main.cjs`

### 2. Mise à jour CSP dans les HTML

Modification des meta tags dans :

- `index.html` (dev)
- `dist-react/index.html` (prod)

Ajout de `local:` dans :

- `default-src`
- `img-src`
- `connect-src`

### 3. Correction de main.cjs

- Suppression du doublon `const { session }`
- Amélioration du handler `webRequest.onHeadersReceived`
  - Réutilisation de la clé d'en-tête d'origine
  - Ajout de `local:` aux directives nécessaires

### 4. Implémentation côté React

- Ajout API `getCoverUrl()` dans `preload.cjs`
- Modification de `GameGrid.jsx` pour utiliser `local://covers/`

## 🧪 Tests à effectuer

```javascript
// Test fetch depuis DevTools console
fetch("local://covers/xxx.jpg")
  .then((r) => {
    console.log("status:", r.status, r.type);
    return r.blob();
  })
  .then((b) => console.log("blob size:", b.size))
  .catch((err) => console.error("fetch error:", err));

// Test image direct
const img = new Image();
img.onload = () => console.log("image loaded OK", img);
img.onerror = (e) => console.error("image load error", e);
img.src = "local://covers/xxx.jpg";
document.body.appendChild(img);

// Vérifier CSP active
document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content;
```

## 📝 Notes importantes

- En dev : redémarrer Vite pour servir le nouvel `index.html`
- Vérifier les logs pour la résolution des chemins `covers/`
- La CSP peut venir soit du meta tag HTML soit des headers HTTP
- Le handler `onHeadersReceived` patch la CSP si elle vient du serveur

## 🔄 Prochaines étapes

1. Valider que le protocole fonctionne via DevTools
2. Confirmer l'affichage des jaquettes dans React
3. Gérer proprement les fallbacks (images manquantes)
