# App Aufbau

# Aufbau der Nova App

Die Nova App ist hierarchisch aufgebaut, um das "Henne-Ei-Problem" zu lösen: **Der Fokus beim ersten Aufruf liegt zu 100% auf dem Unternehmer (Kundenakquise).**

## 1. Landing Page (Einstiegspunkt / Unternehmer-Fokus)

Die Startseite richtet sich exklusiv an Kleinunternehmer. Sie dient als Trichter, um Berührungsängste abzubauen und das Gespräch zu starten.

- **Hero-Sektion:** Klare Ansprache des Problems ("Keine Zeit für IT?").
- **Call-to-Action (CTA):** Ein zentraler Button "Jetzt Problem lösen" führt direkt in den Chat-Bot (Unternehmer-Bereich).
- **Navigation für Developer:** Ein deutlicher, aber sekundärer Button (z.B. "Für Developer" in der Navigation) ermöglicht den Wechsel zur Entwickler-Ansicht.
- **Admin-Zugang:** Ein versteckter oder diskreter Link (z.B. kleines Schloss-Icon im Footer) führt zum Admin-Login.

## 2. Unternehmer-Bereich (Chat)

Der Unternehmer-Bereich ist das Herzstück der Kommunikation.

- **Bot-Integration:** In diesem Bereich befindet sich der intelligente Bot, der als primärer Ansprechpartner fungiert.
- **Kommunikation:** Der Bot kommuniziert direkt mit dem Unternehmer, um Anforderungen aufzunehmen.
- **Profilerstellung:** Nach Abschluss der Gesprächsführung wird der Unternehmer gebeten, Kontaktdaten zu hinterlegen.

## 3. Developer-Bereich

Der Developer-Bereich ist für Entwickler, die nach geprüften Projekten suchen.

- **Zugang:** Erreichbar über den Header/Link auf der Landing Page.
- **Datenbank mit Lastenheften:** Zugriff auf Projekte mit genehmigten Prototypen.
- **Ranking-System:** Sortierung nach Attraktivität und Budget.
- **Sichtbarkeit:** Lastenhefte werden erst nach Prototyp-Erstellung durch den Admin sichtbar.

## 4. Admin-Bereich (Geschützt)

Der Admin-Bereich dient der Verwaltung und Qualitätssicherung.

- **Zugangsschutz:** Dieser Bereich ist **passwortgeschützt**. Der Zugang erfolgt über einen diskreten Button auf der Landing Page.
- **Dashboard:** Übersicht über Leads, Projekte und Status.
- **Prototyp-Freigabe:** Der Admin erstellt Prototypen basierend auf den Bot-Gesprächen und gibt Lastenhefte für Developer frei.
- **Verwaltung:** Zugriff auf Unternehmer- und Developer-Datenbanken.

## 5. Hinweise für die App-Entwicklung

### Backend-Architektur & Security

- **Sichere Backend-Struktur:** Authentifizierung für Admin-Routes zwingend erforderlich.
- **Datenbankschutz:** Verschlüsselung sensibler Unternehmerdaten.

### Deployment-Strategie

- **Build-Tool:** Vite (High-Performance Build für schnelle Entwicklung und optimierte Production-Builds).
- **Deployment:** Vercel via Git-Integration (Continuous Deployment: Automatisches Build & Deploy bei jedem Push ins Repository).
- **Stack:** React, TypeScript.
- **Code-Struktur:** Modulare Komponenten (`/components`, `/services`, `/config`).
