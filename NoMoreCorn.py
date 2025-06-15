// ==UserScript==
// @name         YouTube Anti-AdBlock Bypass (Improved Fix)
// @version      2.1.0
// @description  Optimized ad-block bypass with immediate detection, reducing playback interruption. Uses MutationObserver on native video player classes.
// @author       ChatGPT
// @match        https://www.youtube.com/*
// @icon         https://www.gstatic.com/youtube/img/branding/favicon/favicon_192x192.png
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// ==/UserScript==

(async () => {
    'use strict';

    // Load settings or defaults
    const settings = {
        interval: await GM.getValue('interval', 500),
        animatedTitle: await GM.getValue('animatedTitle', false),
        accentColor: await GM.getValue('accentColor', '#FE2020'),
    };

    // Menu
    GM.registerMenuCommand('Bypasser Settings', async () => {
        const newInterval = prompt('Search interval in ms:', settings.interval);
        if (newInterval !== null) settings.interval = parseInt(newInterval, 10);
        settings.animatedTitle = confirm('Animated title?');
        const newColor = prompt('Accent hex color:', settings.accentColor);
        if (newColor && /^#([0-9A-F]{3}){1,2}$/i.test(newColor)) settings.accentColor = newColor;
        await GM.setValue('interval', settings.interval);
        await GM.setValue('animatedTitle', settings.animatedTitle);
        await GM.setValue('accentColor', settings.accentColor);
        alert('Settings saved. Reload the page.');
    });

    // Core bypass: observe player element for ad-showing class
    function initAdObserver() {
        const player = document.querySelector('.html5-video-player');
        if (!player) return;
        const observer = new MutationObserver(muts => {
            for (const m of muts) {
                if (m.attributeName === 'class') {
                    if (player.classList.contains('ad-showing')) {
                        const btn = document.getElementById('efyt-not-interested');
                        if (btn) {
                            btn.click();
                            console.log('[YT Bypass] Immediate Remove Ads clicked');
                        }
                    }
                }
            }
        });
        observer.observe(player, { attributes: true });
    }

    // Re-init on navigation
    new MutationObserver((muts, obs) => {
        if (document.querySelector('ytd-watch-flexy[page-loaded]')) {
            initAdObserver();
        }
    }).observe(document.documentElement, { childList: true, subtree: true });

    // Initial attempt
    initAdObserver();

    console.log('✅ YouTube Anti-AdBlock Bypass (Improved Fix) loaded');
})();
