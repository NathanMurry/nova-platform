# NOVA – Project Context

## 🎯 Was ist Nova?

**Nova** ist eine AI-Plattform, die Kleinunternehmern hilft, ihre IT-Probleme zu beschreiben – ohne technisches Wissen. Die Plattform:

1. **Führt ein Gespräch** mit dem Unternehmer (AI-ChatBot)
2. **Erstellt ein Lastenheft** aus dem Gespräch (für Entwickler)
3. **Vermittelt** an Programmierer (10% Provision)

---

## 🏗️ Technischer Stack

| Komponente | Technologie |
|------------|-------------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | TailwindCSS |
| **Backend** | Supabase (PostgreSQL) |
| **AI** | Google Gemini (gemini-2.0-flash-exp) |
| **Hosting** | Vercel |
| **Repository** | GitHub (NathanMurry/nova-platform) |

---

## 📁 Projektstruktur

```
NOVA 1.2/
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Supabase Client
│   │   ├── gemini.ts        # AI ChatBot (Prompt & Logik)
│   │   ├── lastenheft.ts    # Lastenheft-Generierung
│   │   └── database.types.ts
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── entrepreneur/
│   │   │   ├── ChatBot.tsx       # Haupt-ChatBot
│   │   │   └── LastenheftView.tsx
│   │   ├── admin/
│   │   │   └── Dashboard.tsx     # Admin-Übersicht
│   │   └── developer/
│   │       └── ProjectList.tsx
│   └── App.tsx
├── supabase/
│   └── schema.sql           # Datenbank-Schema
├── COMMUNICATION_GUIDE.md   # AI-Prompt Dokumentation
├── TODO.md                  # Aufgabenliste
└── PROJECT_CONTEXT.md       # Diese Datei
```

---

## 🔗 Live-URLs

| Seite | URL |
|-------|-----|
| **Landing** | https://nova-sigma-five.vercel.app |
| **ChatBot** | https://nova-sigma-five.vercel.app/entrepreneur |
| **Lastenheft** | https://nova-sigma-five.vercel.app/lastenheft/:id |
| **Admin** | https://nova-sigma-five.vercel.app/admin |

---

## 🗄️ Datenbank-Tabellen (Supabase)

| Tabelle | Beschreibung |
|---------|--------------|
| `conversations` | Chat-Verläufe zwischen User und AI |
| `specifications` | Generierte Lastenhefte |
| `entrepreneurs` | Unternehmer-Profile (für später) |
| `drafts` | Visuelle Entwürfe (für später) |
| `orders` | Aufträge an Programmierer (für später) |

---

## 🤖 AI-System

### ChatBot (gemini.ts)
- **Modell:** gemini-2.0-flash-exp
- **Stil:** Kumpel-Ton, kurze Nachrichten, keine IT-Begriffe
- **Phasen:** Hook → Trichter → Schmerz → Qualifizierung → Vision → Abschluss

### Lastenheft-Generator (lastenheft.ts)
Generiert aus dem Gespräch ein strukturiertes Dokument:
- 🎯 Zielsetzung
- 🔄 Workflow (Input → Processing → Output)
- 📊 Daten-Felder (mit Typen)
- 💻 Tech-Stack Vorschlag
- ✅ Definition of Done

---

## 📝 Environment Variables

```env
VITE_SUPABASE_URL=https://tpbwguncbyjtapxscjbs.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
```

---

## 🚀 Deployment

1. Push zu GitHub → Vercel deployed automatisch
2. Environment Variables in Vercel Settings
3. Vercel URL: https://nova-sigma-five.vercel.app

---

*Letzte Aktualisierung: 2024-12-15*
