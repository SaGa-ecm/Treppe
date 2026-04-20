// === Normgrenzen & Konstanten ===
// Quelle: DIN 18065 (Wohngebäude) & Eurocode 1

export const MIN_SCHRITTMASS = 59;       // cm
export const MAX_SCHRITTMASS = 65;       // cm
export const IDEAL_SCHRITTMASS = 62.5;   // cm

export const MAX_RISE = 19.0;            // cm (Wohngebäude)
export const MIN_RISE = 14.0;            // cm
export const IDEAL_RISE = 17.0;          // cm

export const MIN_RUN = 24.0;             // cm (notwendige Treppe)
export const IDEAL_RUN = 29.0;           // cm

// Dachbodentreppe (Raumspar, nicht notwendig)
export const ATTIC_MIN_RISE = 18.0;
export const ATTIC_MAX_RISE = 26.0;
export const ATTIC_MIN_RUN = 15.0;

// Laufbreiten (Mindestmaße nach Gebäudetyp)
export const MINDESTBREITE_WOHN = 80;    // cm
export const MINDESTBREITE_PUBLIC = 100; // cm

// Lastannahmen nach Eurocode 1 (kN/m², kN Einzellast)
export const LASTEN = {
    wohn:   { flaeche: 3.0, einzel: 2.0 },
    public: { flaeche: 5.0, einzel: 2.0 }
};

// Nutzlast-Mindestwerte in kg/m² (zur Anzeige)
export const MINDESTLAST_WOHN = 300;
export const MINDESTLAST_PUBLIC = 500;

// Stufendicke (Empfehlung Basis)
export const EMPFOHLENE_DICKE = 50;      // mm

// === Materialdatenbank (erweitert für CR FEAT‑007) ===
// Dichte in kg/m³, minDicke in mm, factor für Optimierung (>1 = schwerer → flachere Treppe bevorzugt)
export const MATERIAL_DB = {
    eiche:   { name: 'Eiche/Buche', dichte: 700, minDicke: 40, factor: 1.0 },
    fichte:  { name: 'Fichte/Kiefer', dichte: 500, minDicke: 50, factor: 0.9 },
    leimholz:{ name: 'Leimholz', dichte: 600, minDicke: 45, factor: 0.95 },
    stahl:   { name: 'Stahl', dichte: 7850, minDicke: 10, factor: 2.0 }, // Stahl sehr schwer, daher starker Flachheitsbonus
    beton:   { name: 'Stahlbeton', dichte: 2500, minDicke: 80, factor: 1.5 }
};

// === Befestigungs-Prüfungen (Hilfsfunktionen in calculator.js) ===
export const BEFESTIGUNG_TYPEN = {
    wange:   'Wangenkonstruktion',
    bolzen:  'Bolzentreppe',
    kragarm: 'Kragarmtreppe'
};