# Port-Konfiguration - WICHTIG!

## ⚠️ Port 3001 ist FEST konfiguriert!

Der Development-Server läuft **IMMER auf Port 3001**.

### Warum Port 3001?

**Grund: Strava OAuth Callback-URL**

Die Strava-Integration verwendet eine fest registrierte Callback-URL:
```
http://localhost:3001/api/auth/strava/callback
```

Diese URL ist in den Strava API-Einstellungen hinterlegt und **kann nicht einfach geändert werden**.

### Korrekte Verwendung:

✅ **Development-Server starten:**
```bash
npm run dev
```
→ Server läuft auf: **http://localhost:3001**

✅ **Browser öffnen:**
```
http://localhost:3001
```

❌ **NICHT Port 3000 verwenden!**
- Strava OAuth würde nicht funktionieren
- Callback würde fehlschlagen
- Login wäre nicht möglich

### Bei Port-Problemen:

Wenn Sie versehentlich auf Port 3000 zugreifen:
1. Schließen Sie den Browser-Tab
2. Öffnen Sie neu: **http://localhost:3001**
3. Hard Reload: **Strg+Shift+R**

### Konfiguration in package.json:

```json
{
  "scripts": {
    "dev": "next dev -p 3001"  // ← FEST auf Port 3001!
  }
}
```

**DIESE ZEILE NIEMALS ÄNDERN!**

---

*Erstellt: 31. Oktober 2025*  
*Grund: Strava OAuth Callback-Kompatibilität*
