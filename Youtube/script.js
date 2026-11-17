// ==UserScript==
// @name         Youtube 'Video paused' auto clicker
// @namespace    Youtube 'Video paused' auto clicker
// @version      1
// @description  Auto clicks 'Video paused. Continue watching?' on YouTube Music and YouTube.
// @author       Sledmine
// @match        *://youtube.com/*
// @match        *://www.youtube.com/*
// @match        *://music.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const PROMPT_REGEX = /video paused\.?\s*continue watching\?/i;

    function getText(element) {
        if (!element) return '';

        let text = element.innerText || element.textContent || '';

        // Also inspect open shadow roots used by newer YouTube components.
        if (element.shadowRoot) {
            text += ' ' + (element.shadowRoot.innerText || element.shadowRoot.textContent || '');
        }

        return text.replace(/\s+/g, ' ').trim();
    }

    function getPromptContainers() {
        return document.querySelectorAll(
            'ytmusic-you-there-renderer, yt-confirm-dialog-renderer, tp-yt-paper-dialog, [role="dialog"]'
        );
    }

    function isTargetPrompt(container) {
        if (!container || container.hidden) return false;

        const text = getText(container);
        if (!PROMPT_REGEX.test(text)) return false;

        // Verify that this is the YouTube Music prompt renderer. This avoids
        // clicking unrelated dialogs that happen to contain "continue watching".
        return !!container.closest('tp-yt-paper-dialog, ytmusic-popup-container') ||
            container.matches('ytmusic-you-there-renderer, yt-confirm-dialog-renderer');
    }

    function findConfirmButton(container) {
        // This is the exact structure in the supplied YouTube Music DOM:
        // ytmusic-you-there-renderer > yt-button-renderer[dialog-confirm] > button
        const explicit = container.querySelector(
            'yt-button-renderer[dialog-confirm] button, ' +
            '#confirm-button, ' +
            'button[aria-label="Yes"], ' +
            'button[aria-label="Continue"], ' +
            'button[aria-label="OK"]'
        );
        if (explicit && explicit.dataset.tmAutoConfirmed !== '1') return explicit;

        for (const button of container.querySelectorAll('button')) {
            if (button.dataset.tmAutoConfirmed === '1') continue;

            const label = getText(button);
            if (/^(yes|ok|continue)$/i.test(label) ||
                /^(yes|ok|continue)$/i.test(button.getAttribute('aria-label') || '')) {
                return button;
            }
        }

        return null;
    }

    function clickContinueWatching() {
        for (const container of getPromptContainers()) {
            if (!isTargetPrompt(container) || container.dataset.tmAutoConfirmed === '1') {
                continue;
            }

            const button = findConfirmButton(container);
            if (!button) continue;

            button.dataset.tmAutoConfirmed = '1';
            container.dataset.tmAutoConfirmed = '1';
            button.click();
        }
    }

    const observer = new MutationObserver(clickContinueWatching);
    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    setInterval(clickContinueWatching, 3000);
    clickContinueWatching();
})();