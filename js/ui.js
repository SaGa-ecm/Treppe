// === UI-Hilfsfunktionen ===
// Synchronisation Slider <-> Number Input, Darkmode, Hilfsfunktionen

import { MINDESTBREITE_WOHN, MINDESTBREITE_PUBLIC, LASTEN, MINDESTLAST_WOHN, MINDESTLAST_PUBLIC } from './constants.js';

/**
 * Synchronisiert einen Slider mit einem Number-Input und aktualisiert ein Display.
 * @param {HTMLInputElement} slider - Range-Slider
 * @param {HTMLInputElement} input - Number-Input
 * @param {HTMLElement} display - Element zur Anzeige des Werts
 * @param {string} unit - Einheit (z.B. 'cm')
 * @param {Function} callback - Wird nach Wertänderung aufgerufen
 */
export function syncSliderInput(slider, input, display, unit, callback) {
    function updateFromSlider() {
        input.value = slider.value;
        display.textContent = slider.value + ' ' + unit;
        if (callback) callback();
    }
    function updateFromInput() {
        let val = parseFloat(input.value);
        if (isNaN(val)) return;
        val = Math.min(slider.max, Math.max(slider.min, val));
        slider.value = val;
        input.value = val;
        display.textContent = val + ' ' + unit;
        if (callback) callback();
    }
    slider.addEventListener('input', updateFromSlider);
    input.addEventListener('change', updateFromInput);
}

// === Darkmode ===
export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    return theme;
}

export function updateToggleIcon(theme, iconEl, textEl) {
    if (theme === 'dark') {
        iconEl.textContent = '☀️';
        textEl.textContent = 'Hell';
    } else {
        iconEl.textContent = '🌙';
        textEl.textContent = 'Dunkel';
    }
}

export function toggleTheme(iconEl, textEl) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme, iconEl, textEl);
}

// === Norm-Hilfsfunktionen ===
export function getMindestbreite(gebaeudeTyp) {
    return gebaeudeTyp === 'wohn' ? MINDESTBREITE_WOHN : MINDESTBREITE_PUBLIC;
}

export function getLasten(gebaeudeTyp) {
    return gebaeudeTyp === 'wohn' ? LASTEN.wohn : LASTEN.public;
}

export function getMindestlast(gebaeudeTyp) {
    return gebaeudeTyp === 'wohn' ? MINDESTLAST_WOHN : MINDESTLAST_PUBLIC;
}