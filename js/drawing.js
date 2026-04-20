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
    
    const margin = { left: 60, right: 30, top: 25, bottom: 40 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    
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
    } else {
        // Platzhalter für gewendelte Treppen
        ctx.fillStyle = '#d9c4b0';
        ctx.fillRect(margin.left, margin.top, plotW, plotH);
        ctx.strokeStyle = '#6f4e37';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin.left, margin.top, plotW, plotH);
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#3b2e26';
        ctx.textAlign = 'center';
        if (type === 'viertel') {
            ctx.fillText('↗ 90° Wendelung', width/2, height/2);
            ctx.fillText('Draufsicht (schematisch)', width/2, height/2+25);
        } else {
            ctx.fillText('↻ 180° Wendelung', width/2, height/2);
            ctx.fillText('Draufsicht (schematisch)', width/2, height/2+25);
        }
        ctx.textAlign = 'left';
        ctx.font = '11px system-ui';
        ctx.fillText(`Lauflänge ${p.laufLength.toFixed(0)} cm`, margin.left+10, margin.top+plotH-10);
    }
}