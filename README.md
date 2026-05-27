# 🐓 CocoricOz Quiz

Quiz multijoueur synchronisé pour les événements CocoricOz.

## Stack
- React + Vite
- Firebase Realtime Database (temps réel)
- Hébergement : Vercel

## Fonctionnalités
- Vue **animateur** : crée la session, contrôle le rythme, voit les réponses en direct
- Vue **joueurs** : rejoignent avec un code, répondent sur leur téléphone
- 25 questions sur la culture franco-australienne
- Compte à rebours 20 secondes par question
- Classement en temps réel entre chaque question
- Score basé sur la rapidité (max 1000 pts par question)

## Déploiement sur Vercel

### 1. Push sur GitHub

```bash
cd cocoricoz-quiz
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_ORG/cocoricoz-quiz.git
git push -u origin main
```

### 2. Connecter à Vercel
1. Va sur [vercel.com](https://vercel.com)
2. "Add New Project" → importe le repo GitHub
3. Framework : **Vite** (auto-détecté)
4. Deploy !

### 3. Firebase Rules (important pour la prod)
Dans la console Firebase → Realtime Database → Règles :
```json
{
  "rules": {
    "sessions": {
      "$code": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## Utilisation le soir de l'événement

1. **L'animateur** ouvre l'app → clique "Je suis l'animateur"
2. Un code à 5 lettres s'affiche (ex: `PARIS`) → à projeter sur grand écran
3. **Les joueurs** ouvrent l'app sur leur téléphone → "Je joue !" → entrent leur prénom + le code
4. L'animateur voit les joueurs arriver en temps réel → clique "Lancer le quiz !"
5. Les questions s'enchaînent. L'animateur contrôle le rythme avec "Révéler" et "Question suivante"

## Dev local

```bash
npm install
npm run dev
```
