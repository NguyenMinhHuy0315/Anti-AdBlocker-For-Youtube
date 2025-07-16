// ==UserScript==
// @name         YouTube Anti‑AdBlock Bypass (Improved + Buffer Kick + Overlay Fix v2.3.2)
// @namespace    https://e-z.bio/yaw
// @homepage     https://github.com/Yaw-Dev/YT-AntiAdBlock-Bypass
// @version      2.4.5
// @description  Ad‑block bypass + buffer‑kick + rock‑solid dedupe, now handles PiP focus switches.
// @author       ChatGPT
// @match        https://www.youtube.com/*
// @icon         https://www.gstatic.com/youtube/img/branding/favicon/favicon_192x192.png
// @license      MIT
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// ==/UserScript==

(async () => {
    'use strict';

    // ——— SETTINGS ———
    const settings = {
        interval:      await GM.getValue('interval', 150),
        animatedTitle: await GM.getValue('animatedTitle', true),
        accentColor:   await GM.getValue('accentColor', '#FE2020'),
    };
    GM.registerMenuCommand('Bypasser Settings', async () => {
        const i = prompt('Search interval in ms:', settings.interval);
        if (i != null) settings.interval = parseInt(i,10);
        settings.animatedTitle = confirm('Animated title?');
        const c = prompt('Accent hex color:', settings.accentColor);
        if (c && /^#([0-9A-F]{3}){1,2}$/i.test(c)) settings.accentColor = c;
        await GM.setValue('interval', settings.interval);
        await GM.setValue('animatedTitle', settings.animatedTitle);
        await GM.setValue('accentColor', settings.accentColor);
        alert('Saved. Reload page.');
    });

    // Animated title toggle
    if (settings.animatedTitle) {
        let t = 0;
        setInterval(() => {
            document.title = ['Enjoying YouTube with','Dr Sex, CEO of SexCorp'][t ^= 1];
        }, 1000);
    }

    // ——— AD‑BLOCK BYPASS ———
    function initAdObserver() {
        const p = document.querySelector('.html5-video-player');
        if (!p) return;
        new MutationObserver(muts => {
            muts.forEach(m => {
                if (m.attributeName==='class' && p.classList.contains('ad-showing')) {
                    p.querySelector('#efyt-not-interested')?.click();
                    console.log('[YT Bypass] clicked');
                }
            });
        }).observe(p, { attributes: true });
    }

    // ——— OVERLAY DEDUPE ———
    function dedupe(player = document.querySelector('.html5-video-player')) {
        if (!player) return;
        const bars = [...player.querySelectorAll('.ytp-chrome-bottom')];
        if (bars.length>1) bars.slice(1).forEach(e=>e.remove());
        const times = [...player.querySelectorAll('.ytp-time-display')];
        if (times.length>1) times.slice(1).forEach(e=>e.remove());
    }

function attachOverlayObserver() {
    const p = document.querySelector('.html5-video-player');
    if (!p || p._obs) return;

    // Mark that we've attached the observer
    p._obs = new MutationObserver(muts => {
        let added = false;
        muts.forEach(m => {
            m.addedNodes.forEach(n => {
                if (
                    n.nodeType === 1 &&
                    (n.matches('.ytp-chrome-bottom') || n.querySelector('.ytp-chrome-bottom'))
                ) {
                    added = true;
                }
            });
        });
        if (added) requestAnimationFrame(() => dedupe(p));
    });
    p._obs.observe(p, { childList: true, subtree: true });

    // Common UI state events
    const hook = () => setTimeout(() => dedupe(p), 200);
    [
        'enterpictureinpicture',
        'leavepictureinpicture',
        'fullscreenchange',
        'webkitfullscreenchange',
        'mozfullscreenchange'
    ].forEach(evt => document.addEventListener(evt, hook));

    // Player API state changes
    p.addEventListener('onStateChange', hook);

    // When you switch tabs or windows
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') dedupe(p);
    });
    window.addEventListener('focus', () => dedupe(p));

    // Only dedupe on click **if** there are actually duplicates, and wait 300 ms
    p.addEventListener('click', () => {
        setTimeout(() => {
            const bars = p.querySelectorAll('.ytp-chrome-bottom');
            const times = p.querySelectorAll('.ytp-time-display');
            if (bars.length > 1 || times.length > 1) {
                dedupe(p);
            }
        }, 300);
    });

    // Slow fallback sweep (in case something still slips through)
    setInterval(() => dedupe(p), 10000);
}

    function initTools() {
        initAdObserver();
        attachOverlayObserver();
    }

    // SPA nav watcher
    new MutationObserver(() => {
        if (document.querySelector('ytd-watch-flexy[page-loaded]')) initTools();
    }).observe(document.documentElement, { childList:true, subtree:true });
    initTools();

    // ——— BUFFER KICK ———
    const SEEK=0.1;
    new MutationObserver(()=>{
        document.querySelectorAll('video').forEach(v=>{
            if (!v._kicked) {
                v.addEventListener('loadedmetadata', ()=>{
                    v.currentTime = Math.min(v.duration*0.01,SEEK);
                    v._kicked=true;
                    console.debug('[Kick] at',v.currentTime);
                },{once:true});
            }
        });
    }).observe(document.documentElement,{childList:true,subtree:true});

    console.log('✅ YT Anti‑AdBlock+Kick+Overlay v2.3.2 loaded');
})();
