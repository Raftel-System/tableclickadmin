# 🎯 Dashboard Admin - Talya Bercy

Dashboard d'administration moderne avec **React 18**, **TypeScript**, **Vite**, **Tailwind CSS** et **Firebase**.

## 🚀 Installation

### 1️⃣ Installer les dépendances

```bash
npm install
```

### 2️⃣ Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet en copiant `.env.example` :

```bash
cp .env.example .env
```

Puis remplissez vos clés Firebase dans le fichier `.env` :

```env
VITE_FIREBASE_API_KEY=votre_api_key_ici
VITE_FIREBASE_AUTH_DOMAIN=tableclick-284a7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tableclick-284a7
VITE_FIREBASE_STORAGE_BUCKET=tableclick-284a7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=354687660514
VITE_FIREBASE_APP_ID=1:354687660514:web:19b42c64c433449e4309bb
VITE_FIREBASE_DATABASE_URL=https://tableclick-284a7-default-rtdb.europe-west1.firebasedatabase.app/
VITE_RESTAURANT_ID=talya-bercy
```

### 3️⃣ Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000** 🎉

## 📁 Structure du Projet

```
admin-dashboard-react/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── StatsCard.tsx
│   │   ├── DailyChart.tsx
│   │   └── MonthlyChart.tsx
│   ├── pages/              # Pages de l'application
│   │   ├── Login.tsx       # Page de connexion (test)
│   │   └── Dashboard.tsx   # Tableau de bord principal
│   ├── guards/             # Guards de navigation
│   │   └── AuthGuard.tsx   # Protection des routes
│   ├── services/           # Services externes
│   │   └── firebase.ts     # Configuration Firebase
│   ├── types/              # Types TypeScript
│   │   └── index.ts
│   ├── App.tsx             # Composant racine avec routing
│   ├── main.tsx            # Point d'entrée
│   └── index.css           # Styles globaux
├── .env.example            # Template des variables d'environnement
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔐 Authentification

### Page de Login
- **URL** : `/talya-bercy/login`
- Pour l'instant, c'est une **page test** qui accepte n'importe quels identifiants
- Une fois connecté, vous êtes redirigé vers le dashboard

### Protection des Routes
Le `AuthGuard` protège le dashboard :
- Si non authentifié → Redirection vers `/talya-bercy/login`
- Si authentifié → Accès au dashboard

### Déconnexion
Bouton de déconnexion disponible dans le header du dashboard.

## 📊 Dashboard

### URL
**http://localhost:3000/talya-bercy/dashboard** (nécessite authentification)

### Fonctionnalités

✅ **Statistiques en temps réel**
- Chiffre d'affaires du mois actuel
- Chiffre d'affaires du mois précédent  
- Nombre de commandes totales
- Comparaison avec le mois précédent

✅ **Graphiques interactifs**
- Évolution du CA par jour (30 derniers jours)
- Évolution du CA par mois (12 derniers mois)

## 🔥 Structure Firebase

### Path des Commandes
```
/restaurants/{restaurantId}/orders/{year}/{month}/{orderId}
```

Exemple :
```
/restaurants/talya-bercy/orders/2025/12/Wx93jEmnxkMF1q4uuVsJ
```

### Structure d'une Commande

```typescript
{
  createdAt: Timestamp,       // Date de création
  total: number,              // Montant total en € (utilisé pour les calculs)
  items: [...],               // Optionnel (non utilisé pour les calculs)
  status: string,             // Optionnel
  tableNumber: number         // Optionnel
}
```

**Important** : Seul le champ `total` est utilisé pour calculer le chiffre d'affaires.

## 📈 Récupération des Données

Le dashboard récupère automatiquement :

1. **Mois actuel** : `/restaurants/talya-bercy/orders/2025/12/`
2. **Mois précédent** : `/restaurants/talya-bercy/orders/2024/11/`
3. **30 derniers jours** : Récupère les 2 derniers mois pour assurer la couverture
4. **12 derniers mois** : Récupère chaque mois individuellement

Tous les calculs utilisent uniquement le champ `total` de chaque commande.

## 🛠️ Technologies Utilisées

- **React 18.3** - Framework UI
- **TypeScript 5.6** - Typage statique
- **Vite 5.4** - Build tool moderne et rapide
- **Tailwind CSS 3.4** - Framework CSS utility-first
- **Firebase 10.13** - Backend (Firestore + Realtime DB + Auth)
- **React Router 6.26** - Routing
- **Chart.js 4.4** - Graphiques interactifs
- **date-fns 3.6** - Gestion des dates

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview

# Linting
npm run lint
```

## 🎨 Personnalisation

### Modifier les Couleurs

Éditez `tailwind.config.js` :

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      // Vos couleurs personnalisées
    },
  },
}
```

### Modifier le Restaurant ID

Dans le fichier `.env`, changez :

```env
VITE_RESTAURANT_ID=votre-restaurant-id
```

## 🏗️ Build pour Production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`.

## 📌 Notes Importantes

- ✅ **Aucune dépendance deprecated** - Toutes les librairies sont à jour
- ✅ **TypeScript strict** - Typage complet pour éviter les erreurs
- ✅ **Performance optimale** avec Vite
- ✅ **Design responsive** - Fonctionne sur mobile, tablette et desktop
- ✅ **Design professionnel** - Couleurs sobres et interface minimale
- ✅ **Une seule page** - Pas de système de login

## 🔒 Sécurité

⚠️ **Important** :
1. Ne commitez **JAMAIS** le fichier `.env` dans Git
2. Utilisez des règles de sécurité Firebase appropriées en production
3. Implémentez une authentification si nécessaire

## 🆘 Dépannage

### Problème : Variables d'environnement non chargées
**Solution** : Redémarrez le serveur de développement après avoir modifié `.env`

### Problème : Erreur de connexion Firebase
**Solution** : Vérifiez que vos clés dans `.env` sont correctes

### Problème : Aucune donnée affichée
**Solution** : Vérifiez que vos commandes sont bien dans le path correct dans Firestore

---

**Bon développement ! 🚀**
