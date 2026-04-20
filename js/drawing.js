// === Canvas-Visualisierung ===

/**
 * Zeichnet die Treppe auf das Canvas.
 * @param {object} p - Berechnungsergebnis (von calculator)
 * @param {string} type - Treppentyp
 * @param {number} podest - Podesttiefe in cm
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
 * @param {number} width - Canvas-Breite
 * @param {number} height - Canvas-Höhe
 */
export function drawCanvas(p, type, podest, ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    
    // Fallback bei ungültigen Werten
    if (!p || p.laufLength <= 0 || p.steps <= 0 || p.rise <= 0 || p.run <= 0) {
        ctx.fillStyle = '#b55a2b';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Ungültige Werte – bitte anpassen', width/2, height/2);
        return;
    }
    
    const margin = { left: 50, right: 30, top: 25, bottom: 40 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    
    // Seitenansicht für gerade, Podest- und Dachbodentreppen
    if (type === 'gerade' || type === 'podest' || type === 'dachboden') {
        const scaleX = Math.min(plotW / p.laufLength, 5);
        const totalRise = p.rise * p.steps;
        const scaleY = plotH / totalRise;
        let x = margin.left, y = margin.top + plotH;
        ctx.fillStyle = '#e5cdb5';
        ctx.strokeStyle = '#7a5e4a';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < p.steps; i++) {
            let stepW = (i === 0 && p.podestUsed) ? podest * scaleX : p.run * scaleX;
            const stepH = p.rise * scaleY;
            ctx.fillRect(x, y - stepH, stepW, stepH);
            ctx.strokeRect(x, y - stepH, stepW, stepH);
            if (i < p.steps - 1) {
                ctx.beginPath();
                ctx.moveTo(x + stepW, y - stepH);
                ctx.lineTo(x + stepW, y);
                ctx.stroke();
            }
            ctx.fillStyle = '#2c241e';
            ctx.font = 'bold 10px system-ui';
            ctx.fillText(`${i+1}`, x+4, y - stepH/2 + 4);
            x += stepW;
            y -= stepH;
            ctx.fillStyle = '#e5cdb5';
        }
        // Winkel-Linie
        ctx.beginPath();
        ctx.strokeStyle = '#6f4e37';
        ctx.lineWidth = 3;
        ctx.moveTo(margin.left, margin.top + plotH);
        ctx.lineTo(margin.left + p.laufLength * scaleX, margin.top + plotH - totalRise * scaleY);
        ctx.stroke();
        ctx.fillStyle = '#3f332a';
        ctx.font = '11px system-ui';
        ctx.fillText(`Höhe ${totalRise.toFixed(0)} cm`, margin.left-10, margin.top-5);
        ctx.fillText(`Lauflänge ${p.laufLength.toFixed(0)} cm`, margin.left + p.laufLength*scaleX/2-30, height-10);
    } 
    else {
        // === Draufsicht für gewendelte Treppen ===
        // Vereinfachte Darstellung als Grundriss
        
        // Hintergrund
        ctx.fillStyle = '#f0ebe5';
        ctx.fillRect(margin.left, margin.top, plotW, plotH);
        ctx.strokeStyle = '#a08874';
        ctx.lineWidth = 1;
        ctx.strokeRect(margin.left, margin.top, plotW, plotH);
        
        // Hilfsfunktion: Text zentriert
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#2e241e';
        
        if (type === 'viertel') {
            // Viertelgewendelt: zwei Läufe im 90°-Winkel
            const lauf1Len = p.laufLength * 0.55; // erster Lauf etwas länger
            const lauf2Len = p.laufLength - lauf1Len;
            const breiteSkaliert = Math.min(plotW * 0.15, 40); // Darstellungsbreite der Treppe
            
            const startX = margin.left + 30;
            const startY = margin.top + plotH - 30;
            
            // Erster Lauf (horizontal)
            ctx.fillStyle = '#c4a98e';
            ctx.fillRect(startX, startY - breiteSkaliert, lauf1Len * 0.8, breiteSkaliert);
            ctx.strokeStyle = '#6f4e37';
            ctx.strokeRect(startX, startY - breiteSkaliert, lauf1Len * 0.8, breiteSkaliert);
            
            // Zweiter Lauf (vertikal nach oben)
            ctx.fillStyle = '#b89a7a';
            ctx.fillRect(startX + lauf1Len * 0.8 - breiteSkaliert, startY - lauf2Len * 0.9, breiteSkaliert, lauf2Len * 0.9);
            ctx.strokeRect(startX + lauf1Len * 0.8 - breiteSkaliert, startY - lauf2Len * 0.9, breiteSkaliert, lauf2Len * 0.9);
            
            // Wendelung (Kreisbogen)
            ctx.beginPath();
            ctx.strokeStyle = '#8b5e3c';
            ctx.lineWidth = 2;
            ctx.arc(startX + lauf1Len * 0.8 - breiteSkaliert/2, startY - breiteSkaliert/2, breiteSkaliert/1.5, 0, Math.PI/2);
            ctx.stroke();
            
            // Pfeile für Laufrichtung
            ctx.fillStyle = '#3b2e26';
            ctx.font = 'bold 12px system-ui';
            ctx.fillText('↓', startX + lauf1Len*0.4, startY - breiteSkaliert/2);
            ctx.fillText('→', startX + lauf1Len*0.8 - breiteSkaliert/2, startY - lauf2Len*0.5);
            
            ctx.fillStyle = '#2e241e';
            ctx.font = '10px system-ui';
            ctx.fillText('90° Wendelung', margin.left + plotW/2, margin.top + 15);
        } 
        else if (type === 'halb') {
            // Halbgewendelt: zwei parallele Läufe in Gegenrichtung
            const laufBreite = Math.min(plotW * 0.12, 35);
            const podestBreite = p.podestUsed ? podest * 0.5 : 40;
            
            const startX = margin.left + 20;
            const startY = margin.top + plotH/2 - laufBreite/2;
            
            // Erster Lauf (nach rechts)
            ctx.fillStyle = '#c4a98e';
            ctx.fillRect(startX, startY, plotW * 0.6, laufBreite);
            ctx.strokeStyle = '#6f4e37';
            ctx.strokeRect(startX, startY, plotW * 0.6, laufBreite);
            
            // Podest / Wendelung
            ctx.fillStyle = '#d4bca5';
            ctx.fillRect(startX + plotW * 0.6, startY - laufBreite, podestBreite, laufBreite * 3);
            ctx.strokeRect(startX + plotW * 0.6, startY - laufBreite, podestBreite, laufBreite * 3);
            
            // Zweiter Lauf (nach links, oberhalb)
            ctx.fillStyle = '#b89a7a';
            ctx.fillRect(startX + plotW * 0.6 + podestBreite - plotW * 0.6, startY - laufBreite*1.5, plotW * 0.6, laufBreite);
            ctx.strokeRect(startX + plotW * 0.6 + podestBreite - plotW * 0.6, startY - laufBreite*1.5, plotW * 0.6, laufBreite);
            
            // Pfeile
            ctx.fillStyle = '#3b2e26';
            ctx.font = 'bold 12px system-ui';
            ctx.fillText('→', startX + plotW*0.3, startY + laufBreite/2);
            ctx.fillText('←', startX + plotW*0.8, startY - laufBreite);
            
            ctx.fillStyle = '#2e241e';
            ctx.font = '10px system-ui';
            ctx.fillText('180° Wendelung', margin.left + plotW/2, margin.top + 15);
        }
        
        // Allgemeine Beschriftung
        ctx.fillStyle = '#3f332a';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`Lauflänge gesamt: ${p.laufLength.toFixed(0)} cm`, margin.left+10, margin.top+plotH-10);
        
        // Podest-Info falls vorhanden
        if (p.podestUsed) {
            ctx.fillText(`Podest: ${podest} cm`, margin.left+10, margin.top+plotH-25);
        }
    }
}