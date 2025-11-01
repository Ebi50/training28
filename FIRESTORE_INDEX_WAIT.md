# 🔥 Firestore Index wird erstellt

## Problem
Der Firestore Index für Activities/Plans wird gerade erstellt und ist noch nicht fertig.

## Status prüfen
1. Öffne: https://console.firebase.google.com/project/training-21219029-6377a/firestore/indexes
2. Warte bis Status = **"Enabled"** (grün)
3. Aktuell: **"Building"** (gelb/orange) - dauert ~5-10 Minuten

## Workarounds bis Index fertig ist

### Option 1: Privates Fenster
1. Ctrl+Shift+N (Chrome) oder Ctrl+Shift+P (Firefox)
2. http://localhost:3001
3. Login
4. Error sollte weg sein

### Option 2: Browser Cache leeren
1. F12 → Network Tab
2. Rechtsklick → "Clear browser cache"
3. F5 (Reload)

### Option 3: Warten (empfohlen)
- **5-10 Minuten warten**
- Dann F5 drücken
- Index sollte fertig sein

## Warum passiert das?
Firestore braucht einen Index für komplexe Queries (z.B. "get all activities ordered by date").
Der Index wird automatisch erstellt wenn die Query das erste Mal ausgeführt wird.

## Nach Index-Erstellung
- Error verschwindet
- App läuft normal
- **Buttons werden sichtbar!**
