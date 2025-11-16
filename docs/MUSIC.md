# 🎵 Instructions pour ajouter de la musique

## 1. Dossier des fichiers audio

Place tes fichiers MP3 dans le dossier suivant :

public/music/

## 2. Nommer les fichiers

Les pistes doivent être nommées comme défini dans `src/hooks/useBackgroundMusic.js` :

- `track1.mp3`
- `track2.mp3`
- `track3.mp3`
- `track4.mp3`

Tu peux en ajouter plus en modifiant le tableau `tracks` dans le hook.

## 3. Format recommandé

- **Format** : MP3 (compatible navigateurs)
- **Bitrate** : 128-192 kbps (compromis qualité/poids)
- **Durée** : 2-5 minutes (loop automatique)
- **Volume** : Normaliser à -14 LUFS (confort d'écoute)

## 4. Sources de musique libre

- **Pixabay Music** : <https://pixabay.com/music/>
- **Incompetech** : <https://incompetech.com/music/>
- **Free Music Archive** : <https://freemusicarchive.org/>
- **YouTube Audio Library** : <https://studio.youtube.com/>

## 5. Ajouter plus de pistes

Dans `src/hooks/useBackgroundMusic.js`, modifie le tableau :

```javascript
const tracks = [
  { id: "track1", name: "Ambiance 1", file: "music/track1.mp3" },
  { id: "track2", name: "Ambiance 2", file: "music/track2.mp3" },
  { id: "track3", name: "Ambiance 3", file: "music/track3.mp3" },
  { id: "track4", name: "Ambiance 4", file: "music/track4.mp3" }, // nouvelle piste
];
```

## 6. Fonctionnalités

- ✅ Lecture automatique au démarrage (si activée dans settings)
- ✅ Bouton play/pause flottant (bas droite)
- ✅ Menu pour changer de piste
- ✅ Slider de volume
- ✅ Loop automatique
- ✅ Sauvegarde des préférences (piste, volume, activé)

## 7. Test

1. Place au moins `track1.mp3` dans `public/music/`
2. Lance l'app : `npm start`
3. Clique sur le bouton 🎵 en bas à droite
4. Active la musique avec le bouton ▶️

Bon son ! 🎧
