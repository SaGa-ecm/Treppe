// === Berechnungslogik für Treppengeometrie ===
import {
    MIN_SCHRITTMASS, MAX_SCHRITTMASS, IDEAL_SCHRITTMASS,
    MAX_RISE, MIN_RISE, IDEAL_RISE, MIN_RUN, IDEAL_RUN,
    ATTIC_MIN_RISE, ATTIC_MAX_RISE, ATTIC_MIN_RUN,
    MATERIAL_DB
} from './constants.js';

/**
 * Hilfsfunktion: Berechnet passende Verbindungsmittel basierend auf Material, Dicke und Last.
 * @param {string} materialKey - Schlüssel aus MATERIAL_DB
 * @param {number} stufenDickeMm - Stärke der Stufe in mm
 * @param {string} befestigung - Art der Befestigung (wange, bolzen, kragarm)
 * @param {number} breiteCm - Laufbreite zur Abschätzung der Lastverteilung
 * @returns {object} Objekt mit Schrauben- und Befestigungsdetails
 */
function computeFastenerSpecs(materialKey, stufenDickeMm, befestigung, breiteCm) {
    const material = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    const isWood = material.category === 'holz' || ['eiche', 'buche', 'fichte', 'kiefer', 'leimholz'].includes(materialKey);
    const isSteel = materialKey === 'stahl';
    const isConcrete = materialKey === 'beton';

    // Grundwerte für Holzverbindungen
    let screwDiameter = 6; // mm
    let screwLength = 80;  // mm
    let screwsPerStep = 4;
    let screwType = "Holzbauschraube";
    let preDrill = true;

    // Anpassung basierend auf Stufendicke (Eindringtiefe mind. 2/3 oder durchgehend bei dünnen Platten)
    if (isWood) {
        if (stufenDickeMm >= 40) {
            screwLength = Math.max(80, stufenDickeMm + 20); // Eindringen in die Wange
        } else {
            screwLength = stufenDickeMm + 30; // Durchschrauben + Mutter/Unterlegscheibe simuliert
        }
        
        // Bei sehr dicken Stufen (>60mm) größerer Durchmesser nötig
        if (stufenDickeMm > 60) {
            screwDiameter = 8;
            screwLength = Math.max(100, stufenDickeMm + 30);
        }
    }

    // Material-spezifische Overrides
    if (isSteel) {
        screwType = "Senkschraube DIN 7991";
        screwDiameter = 8;
        screwLength = Math.max(60, stufenDickeMm + 10); // Gewindeeingriff
        screwsPerStep = 4;
        preDrill = false; // Selbstschneidend oder vorgebohrt im Werk
    } else if (isConcrete) {
        screwType = "Betonankerschraube";
        screwDiameter = 10;
        screwLength = Math.max(100, stufenDickeMm + 60); // Verankerungstiefe
        screwsPerStep = 2; // Weniger, aber stärkere Anker
        preDrill = true;
    }

    // Befestigungsart-spezifische Anpassungen
    let anchorType = "Nylondübel S10";
    let anchorCount = 0;
    let bracketCount = 0;
    let specialHardware = [];

    if (befestigung === 'bolzen') {
        // Bolzentreppe: Spezielle Anker für Wandbefestigung
        screwType = "Bolzenanker M12 A4";
        screwDiameter = 12;
        screwLength = 120; // Standardlänge für Wandanker
        screwsPerStep = 1; // Pro Stufe ein zentraler Bolzen
        anchorType = "Integriert im Bolzenanker";
        anchorCount = 0;
    } else if (befestigung === 'kragarm') {
        // Kragarm: Keine Schrauben in der Stufe sichtbar, sondern Konsolen
        screwType = "Passschraube M10 (verdeckt)";
        screwDiameter = 10;
        screwLength = 50;
        screwsPerStep = 2;
        specialHardware.push("Kragarmkonsole Stahl S355");
    } else {
        // Wangentreppe (Standard)
        anchorCount = 8; // Für Wangenbefestigung oben/unten
        bracketCount = 4; // Winkelverbinder
    }

    return {
        screwType,
        screwDiameter,
        screwLength,
        screwsPerStep,
        preDrill,
        anchorType,
        anchorCount,
        bracketCount,
        specialHardware
    };
}

/**
 * Automatische Berechnung der optimalen Stufenmaße.
 */
export function calculateAuto(heightCm, availRunCm, type, podestCm, materialKey) {
    const isAttic = (type === 'dachboden');
    const minRise = isAttic ? ATTIC_MIN_RISE : MIN_RISE;
    const maxRise = isAttic ? ATTIC_MAX_RISE : MAX_RISE;
    const minRun  = isAttic ? ATTIC_MIN_RUN  : MIN_RUN;
    
    let effectiveRun = availRunCm;
    let podestUsed = false;
    let wendelAbzug = 0;
    
    if (type === 'viertel') wendelAbzug = 30;
    if (type === 'halb') wendelAbzug = 60;
    if (type === 'podest' && podestCm >= 80) {
        effectiveRun = availRunCm - podestCm;
        podestUsed = true;
    }
    if (type === 'viertel' || type === 'halb') {
        effectiveRun = Math.max(availRunCm - wendelAbzug, 80);
    }
    
    const material = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    const materialFactor = material.factor;
    
    let bestN = null, bestS = 0, bestA = 0, bestSchritt = 0, bestScore = Infinity;
    
    for (let n = 3; n <= 25; n++) {
        const s = heightCm / n;
        if (s < minRise - 0.5 || s > maxRise + 1.0) continue;
        
        let a;
        if (podestUsed) {
            a = effectiveRun / (n - 1);
        } else {
            a = effectiveRun / (n - 1);
        }
        if (a < minRun - 1.0 || a > 38) continue;
        
        const schritt = 2 * s + a;
        if (!isAttic) {
            if (schritt < MIN_SCHRITTMASS - 2 || schritt > MAX_SCHRITTMASS + 2) continue;
        }
        
        const angle = Math.atan(s / a) * 180 / Math.PI;
        const anglePenalty = angle > 35 ? (angle - 35) * 0.5 * materialFactor : 0;
        const score = Math.abs(schritt - IDEAL_SCHRITTMASS) * 2 
                    + Math.abs(s - IDEAL_RISE) * 1.5 
                    + anglePenalty;
                    
        if (bestN === null || score < bestScore) {
            bestN = n; bestS = s; bestA = a; bestSchritt = schritt; bestScore = score;
        }
    }
    
    if (bestN === null) {
        let nFallback = Math.round(heightCm / IDEAL_RISE);
        nFallback = Math.min(22, Math.max(3, nFallback));
        const sFallback = heightCm / nFallback;
        let aFallback = podestUsed ? effectiveRun / (nFallback - 1) : effectiveRun / (nFallback - 1);
        const schrittFallback = 2 * sFallback + aFallback;
        return {
            steps: nFallback, rise: sFallback, run: aFallback, schrittmass: schrittFallback,
            laufLength: availRunCm, angle: Math.atan(sFallback / aFallback) * 180 / Math.PI,
            valid: false, comfort: 'außerhalb Norm', podestUsed, wendelAbzug, effectiveRun, isAttic
        };
    }
    
    const angle = Math.atan(bestS / bestA) * 180 / Math.PI;
    let valid = isAttic 
        ? (bestS >= ATTIC_MIN_RISE && bestS <= ATTIC_MAX_RISE && bestA >= ATTIC_MIN_RUN)
        : (bestSchritt >= MIN_SCHRITTMASS && bestSchritt <= MAX_SCHRITTMASS && bestS <= MAX_RISE && bestA >= MIN_RUN);
    let comfort = valid ? (isAttic ? 'Raumspar' : 'DIN-konform') : 'nicht normgerecht';
    if (!isAttic && bestS < 16 && bestA > 29) comfort = 'sehr bequem';
    else if (!isAttic && bestS > 18.5) comfort = 'steil';
    
    return {
        steps: bestN, rise: bestS, run: bestA, schrittmass: bestSchritt,
        laufLength: availRunCm, angle, valid, comfort,
        podestUsed, wendelAbzug, effectiveRun, isAttic
    };
}

/**
 * Manuelle Berechnung mit vorgegebenen Steigung/Auftritt.
 */
export function calculateManual(heightCm, steigungCm, auftrittCm, type, podestCm) {
    const isAttic = (type === 'dachboden');
    const steps = Math.max(3, Math.round(heightCm / steigungCm));
    const actualRise = heightCm / steps;
    const laufLength = (steps - 1) * auftrittCm;
    const schrittmass = 2 * actualRise + auftrittCm;
    const angle = Math.atan(actualRise / auftrittCm) * 180 / Math.PI;
    
    let podestUsed = false;
    let wendelAbzug = 0;
    if (type === 'viertel') wendelAbzug = 30;
    if (type === 'halb') wendelAbzug = 60;
    if (type === 'podest' && podestCm >= 80) podestUsed = true;
    
    let valid = isAttic
        ? (actualRise >= ATTIC_MIN_RISE && actualRise <= ATTIC_MAX_RISE && auftrittCm >= ATTIC_MIN_RUN)
        : (schrittmass >= MIN_SCHRITTMASS && schrittmass <= MAX_SCHRITTMASS && actualRise <= MAX_RISE && auftrittCm >= MIN_RUN);
    let comfort = valid ? (isAttic ? 'Raumspar' : 'DIN-konform') : 'nicht normgerecht';
    
    return {
        steps, rise: actualRise, run: auftrittCm, schrittmass,
        laufLength, angle, valid, comfort,
        podestUsed, wendelAbzug, isAttic
    };
}

/**
 * Berechnet die empfohlene Lauflänge für eine gegebene Höhe (Idealfall).
 */
export function computeIdealLength(h) {
    const idealRise = IDEAL_RISE;
    const idealRun = IDEAL_RUN;
    let n = Math.round(h / idealRise);
    n = Math.max(3, n);
    return (n - 1) * idealRun;
}

/**
 * Prüft die geometrischen Randbedingungen der gewählten Befestigungsart.
 */
export function validateBefestigung(befestigung, breite, podestUsed, laufLength) {
    let ok = true;
    let message = '';
    
    switch (befestigung) {
        case 'bolzen':
            if (breite > 150) {
                ok = false;
                message = 'Bolzentreppe: Maximale Breite 150 cm empfohlen (Wandabstand).';
            } else {
                message = 'Bolzentreppe: Wandseitige Befestigung erforderlich.';
            }
            break;
        case 'kragarm':
            if (podestUsed) {
                ok = false;
                message = 'Kragarmtreppe: Podest nicht zulässig (freitragend).';
            } else if (laufLength > 400) {
                ok = false;
                message = 'Kragarmtreppe: Maximale Lauflänge 400 cm empfohlen.';
            } else {
                message = 'Kragarmtreppe: Massiver Untergrund (z. B. Betondecke) erforderlich.';
            }
            break;
        default: // wange
            message = 'Wangenkonstruktion: universell einsetzbar.';
    }
    return { ok, message };
}

/**
 * Berechnet die ungefähre Wangenlänge (Schräge) der Treppe.
 */
export function computeWangenLaenge(heightCm, laufLength) {
    return Math.sqrt(heightCm * heightCm + laufLength * laufLength);
}

/**
 * Erzeugt eine vollständige Stückliste (BOM) mit dynamischer Schraubenauswahl.
 */
export function generateBOM(p, type, podestCm, breiteCm, materialKey, befestigung, stufenDickeMm) {
    const material = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    const stufenDickeCm = stufenDickeMm / 10;
    const wangenLaenge = computeWangenLaenge(p.rise * p.steps, p.laufLength);
    const wangenHoehe = 26; // cm
    const wangenStaerke = 5; // cm
    
    const positionen = [];
    const bomDetails = [];
    
    // ---- 1. Wangen ----
    positionen.push({
        pos: 'Wangen',
        menge: 2,
        material: material.name,
        laenge: wangenLaenge.toFixed(1) + ' cm',
        breite: wangenHoehe + ' cm',
        dicke: wangenStaerke + ' cm',
        hinweis: `Winkel oben/unten: ${p.angle.toFixed(1)}°`
    });
    
    bomDetails.push({
        bezeichnung: 'Wange',
        menge: 2,
        typ: material.name,
        masse: `${wangenLaenge.toFixed(1)} × ${wangenHoehe} × ${wangenStaerke} cm`,
        hinweis: `oben/unten auf Gehrung (${p.angle.toFixed(1)}°) zuschneiden`
    });
    
    // ---- 2. Trittstufen ----
    const stufenAnzahl = p.steps;
    const auftrittCm = p.run;
    const stufenBreite = breiteCm;
    const stufenDickeAnzeige = stufenDickeMm + ' mm';
    
    positionen.push({
        pos: 'Trittstufen',
        menge: stufenAnzahl,
        material: material.name,
        laenge: stufenBreite + ' cm',
        breite: auftrittCm.toFixed(1) + ' cm',
        dicke: stufenDickeAnzeige,
        hinweis: p.podestUsed ? 'Erste Stufe evtl. Podest' : ''
    });
    
    for (let i = 1; i <= stufenAnzahl; i++) {
        bomDetails.push({
            bezeichnung: `Trittstufe ${i}`,
            menge: 1,
            typ: material.name,
            masse: `${stufenBreite} × ${auftrittCm.toFixed(1)} × ${stufenDickeAnzeige}`,
            hinweis: i === 1 && p.podestUsed ? 'entfällt ggf. durch Podest' : ''
        });
    }
    
    // ---- 3. Setzstufen (optional) ----
    if (!p.isAttic) {
        const setzHoehe = (p.rise - stufenDickeCm).toFixed(1);
        if (parseFloat(setzHoehe) > 0) {
            positionen.push({
                pos: 'Setzstufen (optional)',
                menge: stufenAnzahl - 1,
                material: material.name,
                laenge: stufenBreite + ' cm',
                breite: setzHoehe + ' cm',
                dicke: '2 cm (empfohlen)',
                hinweis: 'Höhe = Steigung minus Trittstufendicke'
            });
            
            for (let i = 1; i < stufenAnzahl; i++) {
                bomDetails.push({
                    bezeichnung: `Setzstufe ${i}`,
                    menge: 1,
                    typ: material.name,
                    masse: `${stufenBreite} × ${setzHoehe} × 2 cm`,
                    hinweis: 'optional, wird zwischen Trittstufen montiert'
                });
            }
        }
    }
    
    // ---- 4. Podest ----
    if (p.podestUsed) {
        positionen.push({
            pos: 'Podestplatte',
            menge: 1,
            material: material.name,
            laenge: breiteCm + ' cm',
            breite: podestCm + ' cm',
            dicke: stufenDickeAnzeige,
            hinweis: 'Tiefe = Podesttiefe'
        });
        
        bomDetails.push({
            bezeichnung: 'Podest',
            menge: 1,
            typ: material.name,
            masse: `${breiteCm} × ${podestCm} × ${stufenDickeAnzeige}`,
            hinweis: 'waagerechte Platte'
        });
    }
    
    // ---- 5. Verbindungsmittel (DYNAMISCH BERECHNET) ----
    const specs = computeFastenerSpecs(materialKey, stufenDickeMm, befestigung, breiteCm);
    const befestigungLower = befestigung.toLowerCase();

    // 5.1 Spezifische Hardware je nach Befestigungsart
    if (befestigungLower === 'wange') {
        bomDetails.push({
            bezeichnung: 'Winkelverbinder',
            menge: specs.bracketCount,
            typ: 'Stahl verzinkt 90×90×65 mm',
            masse: '—',
            hinweis: 'zur Befestigung der Wangen an Decke/Boden'
        });
        if (specs.anchorCount > 0) {
            bomDetails.push({
                bezeichnung: 'Dübel',
                menge: specs.anchorCount,
                typ: specs.anchorType,
                masse: '—',
                hinweis: 'für Winkelbefestigung in Beton/Mauerwerk'
            });
        }
    } else if (befestigungLower === 'bolzen') {
        bomDetails.push({
            bezeichnung: 'Bolzenanker',
            menge: stufenAnzahl,
            typ: `${specs.screwType} M${specs.screwDiameter}`,
            masse: 'Länge: ' + specs.screwLength + ' mm',
            hinweis: 'pro Stufe ein Anker in der Wand (tragfähig)'
        });
        bomDetails.push({
            bezeichnung: 'Distanzhülse',
            menge: stufenAnzahl,
            typ: 'M12 Edelstahl',
            masse: 'variiert je nach Wandabstand',
            hinweis: 'zwischen Stufe und Wand'
        });
    } else if (befestigungLower === 'kragarm') {
        bomDetails.push({
            bezeichnung: 'Kragarmkonsole',
            menge: 2,
            typ: 'Stahl S355 lasergeschnitten',
            masse: `${(breiteCm - 10)} × 10 × 1 cm`,
            hinweis: 'seitlich an tragender Wand'
        });
        bomDetails.push({
            bezeichnung: 'Schwerlastanker',
            menge: 8,
            typ: 'M12 Verbundanker',
            masse: 'Länge 100 mm',
            hinweis: 'zur Befestigung der Konsolen'
        });
    }

    // 5.2 Schrauben für Stufen (nur wenn nicht durch Spezialsystem wie Bolzen/Kragarm komplett ersetzt)
    if (befestigungLower !== 'bolzen' && befestigungLower !== 'kragarm') {
        const schraubenGesamt = stufenAnzahl * specs.screwsPerStep;
        const schraubenBeschreibung = `${specs.screwType} Ø${specs.screwDiameter}x${specs.screwLength}mm`;
        
        bomDetails.push({
            bezeichnung: 'Verbindungsschrauben',
            menge: schraubenGesamt,
            typ: schraubenBeschreibung,
            masse: '—',
            hinweis: `pro Stufe ${specs.screwsPerStep} Stück${specs.preDrill ? ' (Vorbohren empfohlen)' : ''}`
        });
    } else if (befestigungLower === 'kragarm') {
        // Bei Kragarm nur verdeckte Passschrauben
        const schraubenGesamt = stufenAnzahl * specs.screwsPerStep;
        bomDetails.push({
            bezeichnung: 'Passschrauben (verdeckt)',
            menge: schraubenGesamt,
            typ: `${specs.screwType} M${specs.screwDiameter}x${specs.screwLength}mm`,
            masse: '—',
            hinweis: 'zur Befestigung auf Konsole'
        });
    }

    // ---- 6. Handlauf (Optional aber empfohlen) ----
    const handlaufLaenge = wangenLaenge;
    positionen.push({
        pos: 'Handlauf (empfohlen)',
        menge: 1,
        material: material.name === 'Stahl' ? 'Edelstahl' : 'Holz',
        laenge: handlaufLaenge.toFixed(1) + ' cm',
        breite: '—',
        dicke: '—',
        hinweis: 'Beidseitig bei öffentl. Gebäuden'
    });

    bomDetails.push({
        bezeichnung: 'Handlauf',
        menge: 1,
        typ: material.name === 'Stahl' ? 'Edelstahlrohr Ø 42,4 mm' : 'Holzhandlauf rund/oval',
        masse: `${handlaufLaenge.toFixed(1)} cm`,
        hinweis: 'inkl. Halterungen alle 80–100 cm'
    });

    const halterAbstand = 90;
    const halterAnzahl = Math.max(2, Math.ceil(handlaufLaenge / halterAbstand));
    bomDetails.push({
        bezeichnung: 'Handlaufhalter',
        menge: halterAnzahl,
        typ: 'Wandhalterung (verstellbar)',
        masse: '—',
        hinweis: 'mit Dübeln und Schrauben'
    });

    return {
        positionen: positionen,
        bomDetails: bomDetails
    };
}

// Kompatibilitäts-Alias
export function generateMaterialListe(p, type, podest, breite, materialKey, befestigung, dicke) {
    const bom = generateBOM(p, type, podest, breite, materialKey, befestigung, dicke);
    return bom.positionen;
}
