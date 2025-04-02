# Car Rental Dashboard - Ghid de Utilizare

## Cuprins
- [Descriere](#descriere)
- [Structura Aplicației](#structura-aplicației)
- [Configurare](#configurare)
- [Pornire Aplicație](#pornire-aplicație)
- [Funcționalități](#funcționalități)

## Descriere
Aceasta este o aplicație web de tip dashboard pentru gestionarea unui sistem de închiriere auto (car rental). Aplicația este împărțită în două părți principale:
- **Backend**: Dezvoltat cu Express.js, gestionează conexiunea la baza de date și oferă API-uri pentru frontend
- **Frontend**: Dezvoltat cu React + Vite și Material UI, oferă interfața utilizator

## Structura Aplicației

### Backend
```
backend/
├── models/         # Modelele pentru tabelele din baza de date
├── routes/         # Rutele API și controllerele
├── utils/          # Utilitare, inclusiv configurarea bazei de date
└── index.js        # Punctul de intrare al aplicației
etc, nu toate fisierele prezente
```

### Frontend
```
frontend/
├── _mock/          # Date fake pentru dezvoltare
├── assets/         # Imagini și alte resurse statice
├── components/     # Componente reutilizabile (tabele, login, scroll, etc.)
├── hooks/          # Hooks personalizate pentru scroll și alte funcționalități
├── layouts/        # Structuri de layout
│   ├── dashboard/  # Layout pentru dashboard
│   └── simple/     # Layout pentru pagini simple
├── pages/          # Paginile aplicației
├── routes/         # Configurarea rutelor
├── sections/       # Secțiuni pentru pagini specifice
│   ├── auth/       # Autentificare
│   ├── cars/       # Gestionare mașini
│   ├── overview/   # Pagina principală de dashboard
│   ├── rental/     # Gestionare închirieri
│   ├── users/      # Gestionare utilizatori
│   ├── error/      # Pagini de eroare
│   └── blog/       # Blog
├── services/       # Servicii pentru comunicarea cu backend-ul
├── theme/          # Configurare temă UI
└── utils/          # Utilitare diverse
etc, nu toate fisierele prezente
```

## Configurare

### Cerințe
- Node.js (recomandat v14+)
- MySQL
- npm

### Configurare Bază de Date
Aplicația se conectează la o bază de date MySQL. Asigurați-vă că aveți MySQL instalat și funcțional.

1. Fișierul `.env` din directorul backend conține următoarele variabile (este deja creat, nu mai trebuie creat de tine):
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=car-app
```

2. Înainte de a porni aplicația, trebuie să configurați MySQL Workbench:
   - Deschideți MySQL Workbench
   - Creați o conexiune nouă: 
     - Connection Name: `car-app` (sau alt nume descriptiv)
     - Hostname: `localhost`
     - Username: `root`
     - Apăsați "Store in Vault" și introduceți parola `1234`


3. Baza de date va fi inițializată automat la prima pornire prin funcția `initializeDatabase()` din backend.

## Pornire Aplicație

### Backend
1. Navigați în directorul backend:
```
cd backend
```

2. Instalați dependențele (doar prima dată):
```
npm install
```

3. Porniți serverul de dezvoltare:
```
npm run dev
```

Serverul va porni pe portul specificat în fișierul `.env` (implicit 5000).

### Frontend
1. Deschideți un terminal nou și navigați în directorul frontend:
```
cd frontend
```

2. Instalați dependențele (doar prima dată, trebuie cu --legacy-peer-deps):
```
npm install --legacy-peer-deps
```

3. Porniți serverul de dezvoltare:
```
npm run dev
```

Frontend-ul va porni pe portul 3039 (port vite) și va deschide automat aplicația în browser. (dacă nu o deschide, intrați manual pe http://localhost:3039/)

## Funcționalități

### Autentificare
- Login pentru admin prin secțiunea `/auth`

### Dashboard
- Vizualizare generală a datelor de închiriere
- Statistici și grafice

### Gestionare Mașini
- Adăugare, editare, ștergere mașini
- Vizualizare status

### Închirieri
- Creare închirieri noi
- Vizualizare istoric închirieri
- Gestionare returnări

### Utilizatori
- Administrare conturi utilizatori
- Setări permisiuni

### Utilizare tehnologii
- **Backend**: Express.js pentru API-uri RESTful, MySQL pentru baza de date
- **Frontend**: React cu Vite pentru performanță, Material UI pentru componente de interfață
