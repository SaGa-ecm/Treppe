// === PDF-Export für Bauteillisten ===
/**
 * Generiert eine PDF-Datei der aktuellen Treppenplanung.
 * @param {object} data - Die kompletten Planungsdaten (aus localStorage oder direkt aus main.js)
 * @param {string} userName - Optionaler Name des Benutzers/Planers
 * @param {string} stairName - Optionaler Name der Treppe (z.B. "Treppe OG")
 */
export function generatePDF(data, userName = '', stairName = '') {
    // Prüfen, ob jsPDF geladen ist
    if (typeof window.jspdf === 'undefined') {
        alert('Fehler: PDF-Bibliothek (jsPDF) nicht geladen. Bitte Internetverbindung prüfen.');
        return;
    }

    const { jsPDF } = window.jspdf;
    
    // A4 Format, Hochformat, Einheit: mm
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // --- Konstanten & Layout ---
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    let cursorY = margin; // Aktueller vertikaler Cursor

    // --- 1. Kopfzeile ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Treppenplaner · Bauteilliste", margin, cursorY);
    cursorY += 10;

    // Datum und Benutzerinfo
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString('de-DE');
    const userInfo = userName ? `Planer: ${userName}` : 'Ohne Angabe';
    const nameInfo = stairName ? `Projekt: ${stairName}` : 'Allgemeine Planung';
    
    doc.text(`${userInfo} | ${nameInfo}`, margin, cursorY);
    doc.text(`Erstellt am: ${dateStr}`, pageWidth - margin - 40, cursorY, { align: 'right' });
    cursorY += 15;

    // Trennlinie
    doc.setDrawColor(200);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 10;

    // --- 2. Zusammenfassung der Geometrie ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Geometrische Daten", margin, cursorY);
    cursorY += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    // Daten als Key-Value Paare
    const geoData = [
        { label: "Geschosshöhe", value: `${data.height} cm` },
        { label: "Lauflänge", value: `${data.laufLength.toFixed(1)} cm` },
        { label: "Steigung (s)", value: `${data.rise} cm` },
        { label: "Auftritt (a)", value: `${data.run} cm` },
        { label: "Stufenanzahl", value: `${data.steps}` },
        { label: "Winkel", value: `${data.angle}°` },
        { label: "Laufbreite", value: `${data.breite} cm` },
        { label: "Material", value: `${data.materialName}` }
    ];

    // Einfache Tabelle für Geometrie (2 Spalten)
    let colX = margin;
    let count = 0;
    geoData.forEach(item => {
        doc.text(`${item.label}:`, colX, cursorY);
        doc.setFont("helvetica", "bold");
        doc.text(item.value, colX + 45, cursorY);
        doc.setFont("helvetica", "normal");
        
        count++;
        if (count % 2 === 0) {
            colX = margin;
            cursorY += 6;
        } else {
            colX = pageWidth / 2;
        }
    });
    
    // Falls ungerade Anzahl, Cursor aufrücken
    if (count % 2 !== 0) cursorY += 2;
    cursorY += 5;

    // --- 3. Stückliste (BOM) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Materialliste & Zuschnitte", margin, cursorY);
    cursorY += 8;

    if (!data.positionen || data.positionen.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("Keine Bauteildaten verfügbar.", margin, cursorY);
    } else {
        // Tabellenkopf
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        const headers = ["Pos", "Menge", "Material", "Maße (L x B x D)", "Hinweis"];
        const colWidths = [15, 20, 40, 50, 55]; // Summe ca. 180mm
        
        let headY = cursorY;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, headY - 5, contentWidth, 6, 'F');
        
        let currentX = margin;
        headers.forEach((h, i) => {
            doc.text(h, currentX + 2, headY);
            currentX += colWidths[i];
        });
        
        cursorY = headY + 1;
        doc.setDrawColor(200);
        doc.line(margin, headY - 5, pageWidth - margin, headY - 5);
        doc.line(margin, headY + 1, pageWidth - margin, headY + 1);

        // Tabelleninhalt
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        data.positionen.forEach((row, index) => {
            // Zeilenumbruch prüfen (Simple Page Break)
            if (cursorY > pageHeight - 30) {
                doc.addPage();
                cursorY = margin;
                // Kopf wiederholen (optional, hier vereinfacht weggelassen für Kürze)
            }

            let rowX = margin;
            const rowHeight = 6;
            
            // Zellen zeichnen
            doc.text(row.pos || '', rowX + 2, cursorY + 4);
            rowX += colWidths[0];
            
            doc.text(String(row.menge), rowX + 2, cursorY + 4);
            rowX += colWidths[1];
            
            doc.text(row.material, rowX + 2, cursorY + 4);
            rowX += colWidths[2];
            
            // Maße zusammenbauen
            const dimString = `${row.laenge} × ${row.breite} × ${row.dicke}`;
            doc.text(dimString, rowX + 2, cursorY + 4);
            rowX += colWidths[3];
            
            // Hinweis (ggf. kürzen bei zu langem Text)
            let hint = row.hinweis || '';
            if (hint.length > 35) hint = hint.substring(0, 32) + '...';
            doc.text(hint, rowX + 2, cursorY + 4);
            
            // Unterste Linie der Zeile
            cursorY += rowHeight;
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
        });
    }

    cursorY += 10;

    // --- 4. Detailierte Verbindungsliste (falls vorhanden) ---
    if (data.bomDetails && data.bomDetails.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Detailierte Verbindungsmittel", margin, cursorY);
        cursorY += 7;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        // Nur die ersten 15 Einträge anzeigen, um Platz zu sparen, oder auf neuer Seite
        const detailsToShow = data.bomDetails.slice(0, 15);
        
        detailsToShow.forEach(item => {
            if (cursorY > pageHeight - 20) {
                doc.addPage();
                cursorY = margin;
            }
            const lineText = `• ${item.bezeichnung} (${item.menge}x): ${item.typ} - ${item.hinweis}`;
            // Split Text to fit width
            const lines = doc.splitTextToSize(lineText, contentWidth);
            doc.text(lines, margin, cursorY + 2);
            cursorY += (lines.length * 4) + 1;
        });
        
        if (data.bomDetails.length > 15) {
            doc.setFont("helvetica", "italic");
            doc.text(`... und ${data.bomDetails.length - 15} weitere Einträge im digitalen Datensatz.`, margin, cursorY);
            cursorY += 5;
        }
    }

    // --- 5. Fußzeile / Disclaimer ---
    // Auf die letzte Seite springen falls mehrere Seiten entstanden sind
    const totalPages = doc.getNumberOfPages();
    doc.setPage(totalPages);
    
    cursorY = pageHeight - 20;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100);
    
    const disclaimerLines = doc.splitTextToSize(
        "Hinweis: Diese Liste dient als Planungshilfe. Die statische Tragfähigkeit muss durch einen Fachplaner geprüft werden. " +
        "Alle Maße sind Zuschnittmaße ohne Berücksichtigung von notwendigen Toleranzen oder Überlängen. " +
        "Generiert mit Treppenplaner (Open Source).",
        contentWidth
    );
    
    doc.text(disclaimerLines, margin, cursorY);
    
    // Seitenzahl
    doc.setFont("helvetica", "normal");
    doc.text(`Seite ${totalPages} von ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    // --- Speichern ---
    const fileNameBase = stairName ? stairName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'treppenplan';
    doc.save(`${fileNameBase}_bauteilliste.pdf`);
}
