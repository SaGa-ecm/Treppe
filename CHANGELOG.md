# Changelog

Alle wichtigen Änderungen dieses Projekts werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1] – 2026‑04‑20

### Behoben
- Darkmode‑Fehler: Das Theme wurde nicht korrekt auf das `html`‑Element angewendet.
- Canvas‑Fehler: Leere Zeichenfläche bei ungültigen Werten (Fallback‑Meldung hinzugefügt).
- Responsive Probleme: Seitenverschiebung beim Bedienen der Slider auf Mobilgeräten durch `touch‑action: none` behoben.

### Geändert
- Wertebereiche aller Slider erweitert (z. B. Nutzlast ab 40 kg/m², Laufbreite ab 15 cm).
- Tooltips und Beschreibungstexte entschlackt und sachlicher formuliert.
- Spenden‑Button durch ein vollständiges PayPal‑Formular mit Betrag und Verwendungszweck ersetzt.

## [3.0] – 2026‑04‑20

### Hinzugefügt
- Manuelle Eingabe von **Auftritt (a)**, **Steigung (s)** und **Stufendicke** über separate Slider.
- Manueller Modus: Deaktiviert die automatische Optimierung und verwendet benutzerdefinierte Maße.
- Prüfung der berechneten Lauflänge gegen die verfügbare horizontale Entfernung.
- Synchronisation von Slider und Number‑Input für präzise Dezimaleingaben.
- Statusanzeige für die Stufendicke (Warnung bei < 50 mm).

### Geändert
- Die horizontale Entfernung dient jetzt als maximale Platzvorgabe und wird nicht mehr automatisch angepasst.

## [2.0] – 2026‑04‑19

### Hinzugefügt
- Unterstützung für gewendelte Treppen (90° und 180°), Podesttreppe und Dachbodentreppe.
- Nutzbare Laufbreite und Gebäudetyp (Wohnen/Öffentlich) mit normativen Prüfungen.
- Lastannahmen nach Eurocode 1 in kN/m² und kg‑Äquivalent.
- Darkmode mit Speicherung der Benutzereinstellung.
- Spendenlink zu PayPal.

### Geändert
- Verbesserte Benutzeroberfläche mit Tooltips und Ampelsystem.

## [1.0] – 2026‑04‑19

### Hinzugefügt
- Initiale Version mit Berechnung gerader Wangentreppen nach DIN 18065.
- Schrittmaßregel (2s+a), optimale Stufenzahl, Prüfung der Normkonformität.
- Canvas‑Visualisierung der Treppe.
