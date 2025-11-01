# Training System - TODO Liste

## 🚀 Priorität: Hoch

### ML-Integration
- [ ] ML-Model für TSS-Vorhersage einbinden
- [ ] ML-basierte Workout-Empfehlungen
- [ ] Trainingsbelastung mit ML optimieren

### Farbschema ändern
- [x] Neue Farbpalette implementieren:
  - Primary: #2176AE (Blau)
  - Secondary: #57B8FF (Hellblau)
  - Accent 1: #B6BD0D (Olivgrün)
  - Accent 2: #FBB13C (Orange)
  - Accent 3: #FE6847 (Koralle)
- [x] Tailwind Config anpassen
- [x] Dark Mode Varianten erstellen
- [x] CSS-Komponenten aktualisieren (Buttons, Cards, Badges)
- [x] Dokumentation erstellen (COLOR_SCHEME.md)
- [ ] Alle bestehenden Komponenten mit neuen Farben aktualisieren

### Plan-Inhalt verbessern
- [ ] Session-Namen und Beschreibungen aussagekräftiger machen
- [ ] TSS-Berechnungen für Sessions korrigieren
- [ ] Verschiedene Workout-Typen implementieren (Sweet Spot, Threshold, VO2max, Endurance)
- [ ] Richtige Zonen-Zuordnung basierend auf FTP

### Automatische Plan-Generierung
- [ ] Plan automatisch nach absolviertem Training aktualisieren
- [ ] CTL/ATL/TSB in Echtzeit berechnen
- [ ] Anpassung basierend auf tatsächlicher Performance
- [ ] Wöchentliche Auto-Regeneration mit Opt-out Option

## 📋 Offene Aufgaben

### Dashboard Verbesserungen
- [ ] Tooltips für alle Metriken (CTL, ATL, TSB, FTP, etc.)
- [ ] Erklärung beim Hover über Parameter
- [ ] Info-Icons mit Popup-Beschreibungen

### Onboarding
- [ ] Hilfsfenster beim ersten Login entfernen/verbessern
- [ ] Optionales Tutorial für neue User
- [ ] Quick-Start Guide statt Auto-Popup

### UI/UX Verbesserungen
- [ ] Wochennavigation auf /dashboard/plan testen und verfeinern
- [ ] Loading States verbessern
- [ ] Error Handling für fehlgeschlagene API-Calls

### Training Details & Export
- [ ] MyWhoosh Workout Export
  - Indoor-Training direkt als MyWhoosh Workout exportieren
  - Workout-Format konvertieren (Details folgen)
  - Export-Button in Training-Details
- [ ] Kommentar-Funktion für Trainings
  - Kommentarfeld zu jedem Training hinzufügen
  - Notizen vor/nach Training speichern
  - Anzeige in Activity Details und History

### Daten & Logik
- [ ] availableTimeSlots richtig aus User-Profil laden
- [ ] ML-Model Integration wieder aktivieren (optional)
- [ ] Historische Metriken für bessere Planung verwenden

### Features
- [ ] Activity Details Ansicht
- [ ] Manuelle Plan-Bearbeitung
- [ ] Export-Funktion (zu Garmin/Wahoo)
- [ ] Calendar View

### Trainingscamps & Events
- [ ] Integration von Trainingscamps im Plan
  - Camp-Zeitraum definieren (Start-/Enddatum)
  - Höhere Trainingsbelastung während Camp
  - Automatische Deload-Woche nach Camp
- [ ] Event-Management (Wettkämpfe, Granfondos, etc.)
  - Event-Datum und Priorität festlegen
  - Taper-Phase vor Event automatisch einplanen
  - Build-Phase auf Event-Termin ausrichten
- [ ] Multi-Event-Support mit Prioritäten

### Wochenausrichtung & Zeitplanung
- [ ] Standardwochen vs. reale Wochen überprüfen
  - Aktuelles Verhalten dokumentieren
  - ISO-Wochennummern vs. Kalenderwochen
  - Montag als Wochenstart sicherstellen
- [ ] Wochenübergänge und Datumsanzeigen korrigieren
- [ ] Zeitslot-Zuordnung zu echten Wochentagen prüfen

### Krafttraining & Beweglichkeit für Radsportler
- [ ] Krafttraining-Modul implementieren
  - Radsport-spezifische Übungen (Core, Beine, Stabilität)
  - Periodisierung: Base/Build/Maintenance-Phasen
  - Integration in Wochenplan (Off-Bike-Tage)
- [ ] Beweglichkeits-/Mobility-Programm
  - Stretching-Routinen für Radfahrer
  - Yoga/Pilates-Übungen
  - Faszien-Training
- [ ] Übungsbibliothek mit Erklärungen
  - Detaillierte Beschreibung jeder Übung
  - Ausführungstipps und häufige Fehler
  - Sets/Reps/Dauer-Empfehlungen
- [ ] Video-Integration
  - YouTube-Links zu Übungsvideos
  - Embed-Option für Videos in der App
  - Kuratierte Playlist für Radsportler
- [ ] UI für Krafttraining
  - Wöchentliche Krafttrainings-Ansicht
  - Abhaken von absolvierten Übungen
  - Fortschritt tracken (Gewichte, Wiederholungen)

## ✅ Erledigt
- [x] Strava OAuth Integration
- [x] Activities Page mit wöchentlicher Navigation
- [x] CTL/ATL/TSB Berechnung
- [x] 8-Wochen Plan Generator
- [x] Plan wird automatisch geladen und angezeigt
- [x] Wochennavigation funktioniert
- [x] Sessions werden generiert (Standard-Zeitslots wenn keine definiert)

---
*Letzte Aktualisierung: 31. Oktober 2025*
