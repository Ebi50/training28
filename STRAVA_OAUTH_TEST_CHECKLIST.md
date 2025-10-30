# 🧪 Strava OAuth Integration - Test Checklist

**Datum:** 30. Oktober 2025  
**User ID:** `Kx5XdlLwxXcAdY0FQRNJEZ3P2h2`  
**Dev Server:** http://localhost:3001

---

## ✅ SCHRITT A: OAuth Flow Test

### Vorbereitung
- [ ] Dev Server läuft auf Port 3001 (`npm run dev`)
- [ ] Browser Konsole geöffnet (F12 → Console Tab)
- [ ] Strava Account bereit zum Einloggen

### Test-Ablauf
1. [ ] **Dashboard öffnen**
   ```
   URL: http://localhost:3001/dashboard
   ```

2. [ ] **"Connect Strava" Button klicken**
   - Erwartung: Redirect zu `https://www.strava.com/oauth/authorize`
   - URL sollte enthalten: `client_id`, `redirect_uri`, `scope`

3. [ ] **Bei Strava authorisieren**
   - Erwartung: Strava zeigt Permissions-Screen
   - Klick auf "Authorize" Button

4. [ ] **Callback verarbeitet**
   - Erwartung: Redirect zu `http://localhost:3001/dashboard?strava_connected=true`
   - Browser Console: Keine Fehler
   - Server Terminal: Log mit "Strava tokens saved successfully"

### Fehler-Diagnose
**Problem:** Redirect funktioniert nicht
- [ ] Server Terminal prüfen: Fehlermeldungen im Callback?
- [ ] `.env.local` prüfen: `STRAVA_CLIENT_ID` und `STRAVA_CLIENT_SECRET` gesetzt?
- [ ] Strava API Settings: Callback URL = `http://localhost:3001/api/auth/strava/callback`

**Problem:** 401 Unauthorized beim Callback
- [ ] Strava API Credentials falsch oder abgelaufen
- [ ] Client Secret in `.env.local` korrekt?

---

## ✅ SCHRITT B: Token-Speicherung prüfen

### Debug-Endpoint aufrufen
```
http://localhost:3001/api/debug/check-tokens?userId=Kx5XdlLwxXcAdY0FQRNJEZ3P2h2
```

### Erwartetes Ergebnis (SUCCESS)
```json
{
  "userId": "Kx5XdlLwxXcAdY0FQRNJEZ3P2h2",
  "mainDocument": {
    "exists": true,
    "stravaConnected": true
  },
  "stravaIntegration": {
    "exists": true,
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "expiresAt": 1730123456,
    "tokenExpired": false
  }
}
```

### Checklist
- [ ] `mainDocument.exists` = `true`
- [ ] `mainDocument.stravaConnected` = `true`
- [ ] `stravaIntegration.exists` = `true`
- [ ] `stravaIntegration.hasAccessToken` = `true`
- [ ] `stravaIntegration.hasRefreshToken` = `true`
- [ ] `stravaIntegration.tokenExpired` = `false`

### Fehler-Diagnose
**Problem:** `stravaIntegration.exists = false`
- [ ] Callback wurde nicht aufgerufen oder hat Fehler geworfen
- [ ] Zurück zu SCHRITT A, Server Logs prüfen

**Problem:** `tokenExpired = true`
- [ ] Normal bei alten Tokens
- [ ] Weiter zu SCHRITT C - Auto-Refresh sollte funktionieren

**Problem:** 500 Internal Server Error
- [ ] Firebase Admin SDK initialisiert? `.env.local` hat Service Account?
- [ ] Firestore Rules erlauben Server-Zugriff?

---

## ✅ SCHRITT C: Activities API Test

### API-Endpoint aufrufen
```
http://localhost:3001/api/strava/activities?userId=Kx5XdlLwxXcAdY0FQRNJEZ3P2h2
```

### Erwartetes Ergebnis (SUCCESS)
```json
[
  {
    "id": 12345678,
    "name": "Morning Ride",
    "type": "Ride",
    "distance": 25000.0,
    "moving_time": 3600,
    "average_speed": 6.94,
    "start_date": "2025-10-30T08:00:00Z"
  }
  // ... weitere Activities
]
```

### Checklist
- [ ] HTTP Status = `200 OK`
- [ ] Response ist Array von Activities
- [ ] Jede Activity hat: `id`, `name`, `type`, `distance`, `moving_time`
- [ ] Keine 401 Unauthorized Fehler mehr! 🎉

### Fehler-Diagnose
**Problem:** 401 Unauthorized
- [ ] Zurück zu SCHRITT B: Tokens wirklich gespeichert?
- [ ] Server Terminal: Log "Failed to get valid Strava token"?
- [ ] Token manuell in Firestore prüfen (Firebase Console)

**Problem:** 400 Bad Request
- [ ] `userId` Parameter in URL fehlt oder falsch
- [ ] Richtige User ID verwendet?

**Problem:** 500 Internal Server Error
- [ ] Server Terminal prüfen: Welcher Fehler?
- [ ] Strava API Rate Limit erreicht? (600 requests/15min)
- [ ] Network Error beim Strava API Call?

**Problem:** Leeres Array `[]`
- [ ] SUCCESS! Bedeutet nur: keine Activities in letzten 30 Tagen
- [ ] Mit `after` Parameter ältere Activities holen:
   ```
   ?userId=XXX&after=1577836800
   ```

---

## 🔧 Zusätzliche Debug-Tools

### 1. Firestore manuell prüfen
```
Firebase Console → Firestore Database
→ users/Kx5XdlLwxXcAdY0FQRNJEZ3P2h2
→ integrations/strava
```
Sollte enthalten:
- `accessToken`: "xxx..."
- `refreshToken`: "xxx..."
- `expiresAt`: Unix timestamp
- `athleteId`: Deine Strava Athlete ID

### 2. Token-Refresh manuell testen
Browser Console (auf Dashboard-Seite):
```javascript
fetch('/api/strava/activities?userId=Kx5XdlLwxXcAdY0FQRNJEZ3P2h2')
  .then(r => r.json())
  .then(console.log);
```

### 3. Server Logs beobachten
```bash
# Terminal mit "npm run dev" im Auge behalten
# Sollte zeigen:
# - "Fetching Strava token for user: XXX"
# - "Token valid until: XXX"
# - Oder: "Refreshing expired Strava token"
```

---

## 📊 Success Criteria (Alle müssen ✅ sein)

| Schritt | Kriterium | Status |
|---------|-----------|--------|
| A | OAuth Flow redirected zu Dashboard | ⬜ |
| A | Keine Fehler in Browser Console | ⬜ |
| A | Server Log zeigt "tokens saved" | ⬜ |
| B | mainDocument.stravaConnected = true | ⬜ |
| B | stravaIntegration.exists = true | ⬜ |
| B | hasAccessToken + hasRefreshToken = true | ⬜ |
| C | Activities API returns 200 OK | ⬜ |
| C | Response enthält Activity Array | ⬜ |
| C | Keine 401 Errors mehr | ⬜ |

---

## 🎯 Bei Erfolg: Nächste Schritte

Wenn alle Tests ✅ sind:
1. **Dashboard UI erweitern** - Activities anzeigen
2. **Auto-Sync implementieren** - Webhooks für neue Activities
3. **Plan Generator testen** - Mit echten Strava-Daten
4. **Production Deployment** - Firebase Hosting

---

## 📞 Bei Problemen

Wenn du bei einem Schritt hängen bleibst:
1. ❌ Markiere den fehlgeschlagenen Schritt
2. 📋 Kopiere die Fehlermeldung (Browser Console + Server Terminal)
3. 🔍 Nutze "Fehler-Diagnose" Sektion
4. 💬 Berichte: "Schritt X fehlgeschlagen mit Fehler Y"

**Dateiname für Referenz:** `STRAVA_OAUTH_TEST_CHECKLIST.md`
