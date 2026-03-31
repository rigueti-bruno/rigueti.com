import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const analyticsSource = readFileSync(join(__dirname, '../analytics.js'), 'utf-8');

// Tracks all gtag() calls made during a test.
let gtagCalls = [];

/**
 * Returns true if Google Analytics was activated: consent updated to 'granted'
 * AND the external gtag.js script was injected into <head>.
 */
function gaWasLoaded() {
  const consentGranted = gtagCalls.some(
    (call) =>
      call[0] === 'consent' &&
      call[1] === 'update' &&
      call[2]?.analytics_storage === 'granted'
  );
  const scriptInjected =
    document.head.querySelectorAll('script[src*="googletagmanager"]').length > 0;
  return consentGranted && scriptInjected;
}

/**
 * Returns true if Microsoft Clarity was initialised (window.clarity was set
 * and a <script> pointing to clarity.ms was inserted).
 */
function clarityWasLoaded() {
  return (
    typeof window.clarity === 'function' &&
    document.querySelectorAll('script[src*="clarity.ms"]').length > 0
  );
}

/**
 * Set up a minimal DOM that mirrors the cookie banner HTML in index.html,
 * then execute the analytics script so its DOMContentLoaded handler runs.
 *
 * A dummy <script> element is seeded in <head> so that loadMicrosoftClarity
 * can find an existing script as an insertBefore anchor (it calls
 * document.getElementsByTagName('script')[0]).
 *
 * A mock gtag() function is installed on window so analytics.js can call
 * gtag('consent', 'update', ...) without the actual GA script being loaded.
 */
function setupDOM(localStorageValue) {
  // Seed a script anchor for the Clarity IIFE.
  document.head.innerHTML = '<script id="test-anchor"></script>';

  document.body.innerHTML = `
    <div id="cookie-banner" style="display:none">
      <button id="accept-cookies">Aceitar</button>
      <button id="reject-cookies">Recusar</button>
    </div>
  `;

  // Reset and install mock gtag.
  gtagCalls = [];
  window.gtag = function () { gtagCalls.push(Array.from(arguments)); };
  window.dataLayer = [];

  if (localStorageValue === null) {
    localStorage.clear();
  } else {
    localStorage.setItem('cookiesAccepted', localStorageValue);
  }

  // Execute the script source so the DOMContentLoaded listener is registered.
  // Using Function constructor avoids module-scope issues with jsdom.
  // eslint-disable-next-line no-new-func
  new Function(analyticsSource)();

  // Trigger DOMContentLoaded so the handler inside analytics.js runs.
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

describe('analytics.js — cookie banner logic', () => {
  afterEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.clarity;
    delete window.dataLayer;
    delete window.gtag;
    gtagCalls = [];
  });

  // -------------------------------------------------------------------------
  // Banner visibility
  // -------------------------------------------------------------------------

  it('shows the cookie banner when cookiesAccepted is not set (null)', () => {
    setupDOM(null);

    expect(document.getElementById('cookie-banner').style.display).toBe('block');
  });

  it('does not show the banner when cookiesAccepted is "true"', () => {
    setupDOM('true');

    expect(document.getElementById('cookie-banner').style.display).not.toBe('block');
  });

  it('does not show the banner when cookiesAccepted is "false"', () => {
    setupDOM('false');

    expect(document.getElementById('cookie-banner').style.display).not.toBe('block');
  });

  // -------------------------------------------------------------------------
  // Analytics loading
  // -------------------------------------------------------------------------

  it('grants GA consent immediately when cookiesAccepted is "true"', () => {
    setupDOM('true');

    expect(gaWasLoaded()).toBe(true);
  });

  it('loads Microsoft Clarity immediately when cookiesAccepted is "true"', () => {
    setupDOM('true');

    expect(clarityWasLoaded()).toBe(true);
  });

  it('does not grant GA consent when cookiesAccepted is "false"', () => {
    setupDOM('false');

    expect(gaWasLoaded()).toBe(false);
    expect(clarityWasLoaded()).toBe(false);
  });

  it('does not grant GA consent on first visit before user interacts with the banner', () => {
    setupDOM(null);

    expect(gaWasLoaded()).toBe(false);
    expect(clarityWasLoaded()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Accept button
  // -------------------------------------------------------------------------

  it('accept button: sets cookiesAccepted to "true" in localStorage', () => {
    setupDOM(null);

    document.getElementById('accept-cookies').click();

    expect(localStorage.getItem('cookiesAccepted')).toBe('true');
  });

  it('accept button: hides the cookie banner', () => {
    setupDOM(null);

    document.getElementById('accept-cookies').click();

    expect(document.getElementById('cookie-banner').style.display).toBe('none');
  });

  it('accept button: grants GA consent', () => {
    setupDOM(null);

    document.getElementById('accept-cookies').click();

    expect(gaWasLoaded()).toBe(true);
  });

  it('accept button: loads Microsoft Clarity', () => {
    setupDOM(null);

    document.getElementById('accept-cookies').click();

    expect(clarityWasLoaded()).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Reject button
  // -------------------------------------------------------------------------

  it('reject button: sets cookiesAccepted to "false" in localStorage', () => {
    setupDOM(null);

    document.getElementById('reject-cookies').click();

    expect(localStorage.getItem('cookiesAccepted')).toBe('false');
  });

  it('reject button: hides the cookie banner', () => {
    setupDOM(null);

    document.getElementById('reject-cookies').click();

    expect(document.getElementById('cookie-banner').style.display).toBe('none');
  });

  it('reject button: does not grant GA consent', () => {
    setupDOM(null);

    document.getElementById('reject-cookies').click();

    expect(gaWasLoaded()).toBe(false);
  });

  it('reject button: does not load Microsoft Clarity', () => {
    setupDOM(null);

    document.getElementById('reject-cookies').click();

    expect(clarityWasLoaded()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// HTML structure — required DOM elements for analytics.js to work
// ---------------------------------------------------------------------------

describe('index.html — required DOM elements', () => {
  const html = readFileSync(join(__dirname, '../index.html'), 'utf-8');

  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('has a #cookie-banner element', () => {
    expect(document.getElementById('cookie-banner')).not.toBeNull();
  });

  it('has an #accept-cookies button', () => {
    expect(document.getElementById('accept-cookies')).not.toBeNull();
  });

  it('has a #reject-cookies button', () => {
    expect(document.getElementById('reject-cookies')).not.toBeNull();
  });

  it('has a non-empty <title>', () => {
    expect(document.title.trim().length).toBeGreaterThan(0);
  });

  it('has a meta description tag', () => {
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta.getAttribute('content').trim().length).toBeGreaterThan(0);
  });

  it('has an Open Graph title tag', () => {
    const og = document.querySelector('meta[property="og:title"]');
    expect(og).not.toBeNull();
  });

  it('has a Twitter Card tag', () => {
    const tc = document.querySelector('meta[name="twitter:card"]');
    expect(tc).not.toBeNull();
  });

  it('has a canonical link', () => {
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical.getAttribute('href')).toMatch(/^https?:\/\//);
  });

  it('has the inline gtag config script in <head> with the correct measurement ID', () => {
    const scripts = Array.from(document.querySelectorAll('script:not([src])'));
    const hasConfig = scripts.some((s) => s.textContent.includes('G-GZSHCJH5WY'));
    expect(hasConfig).toBe(true);
  });

  it('profile image has a non-empty alt attribute', () => {
    const img = document.querySelector('.profile-photo');
    expect(img).not.toBeNull();
    expect(img.getAttribute('alt').trim().length).toBeGreaterThan(0);
  });

  it('all external links have rel="noopener noreferrer"', () => {
    const externalLinks = Array.from(document.querySelectorAll('a[target="_blank"]'));
    expect(externalLinks.length).toBeGreaterThan(0);
    externalLinks.forEach((link) => {
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    });
  });

  it('contact form has action and method attributes', () => {
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    expect(form.getAttribute('action').trim().length).toBeGreaterThan(0);
    expect(form.getAttribute('method')).toBe('POST');
  });

  it('nav anchor targets (#sobre, #habilidades, etc.) exist in the document', () => {
    const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
    expect(navLinks.length).toBeGreaterThan(0);
    navLinks.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      expect(document.getElementById(id), `Missing section with id="${id}"`).not.toBeNull();
    });
  });
});
