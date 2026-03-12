(function () {
    'use strict';

    var STORAGE_KEY = 'tsi_beta_gate_v1';
    var ACCESS_VALUE = 'granted';
    var ACCESS_PASSWORD = 'baconsgoodforme';
    var GATE_GLOBE_SRC = 'assets/pages/gate/globe-beta-gate.html?v=20260311a';
    var TITLE_TEXT = 'Beta Access Portal';
    var MESSAGE_TEXT = 'This site is currently in limited beta while final polishing is completed. If you have been provided an access key, please enter it below.';
    var BUTTON_TEXT = 'Enter Site';
    var INPUT_LABEL = 'Access key';
    var ERROR_TEXT = 'The access key you entered is not valid.';
    var FOOTER_TEXT = 'Temporary launch gate for invited reviewers.';
    var ROOT_CLASS = 'tsi-beta-gate-root';
    var ACTIVE_ATTR = 'data-tsi-beta-gate-active';
    var STYLE_ID = 'tsi-beta-gate-styles';
    var LIVE_REGION_ID = 'tsi-beta-gate-status';

    if (!document.body || localStorage.getItem(STORAGE_KEY) === ACCESS_VALUE) {
        return;
    }

    injectStyles();
    activateGate();

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            'body[' + ACTIVE_ATTR + '="true"] { overflow: hidden; }',
            '.' + ROOT_CLASS + ' { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 24px; background: #050a12; overflow: hidden; font-family: "Segoe UI", Arial, sans-serif; }',
            '.' + ROOT_CLASS + '::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at top, rgba(130, 175, 255, 0.18), transparent 42%), linear-gradient(135deg, rgba(8, 24, 48, 0.56), rgba(4, 12, 24, 0.8)); }',
            '.' + ROOT_CLASS + '__scrim { position: absolute; inset: 0; z-index: 0; background: #050a12; backdrop-filter: blur(54px) saturate(135%); -webkit-backdrop-filter: blur(54px) saturate(135%); }',
            '.' + ROOT_CLASS + '__media { position: absolute; inset: -4%; z-index: 1; overflow: hidden; }',
            '.' + ROOT_CLASS + '__globe { position: absolute; left: 50%; top: 50%; width: 108%; height: 108%; border: 0; opacity: 0.52; filter: blur(9px) saturate(0.9); transform: translate(-50%, -50%) scale(1.04); pointer-events: none; }',
            '.' + ROOT_CLASS + '__panel { position: relative; z-index: 2; width: min(100%, 460px); padding: 32px 28px; border-top: 1px solid rgba(255, 255, 255, 0.18); border-right: 1px solid rgba(255, 255, 255, 0.18); border-bottom: 1px solid rgba(255, 255, 255, 0.18); border-left: 6px solid #98d8ff; border-radius: 0; background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08)); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32); color: #f4f7fb; }',
            '.' + ROOT_CLASS + '__eyebrow { display: inline-flex; margin-bottom: 14px; padding: 6px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); letter-spacing: 0.12em; font-size: 11px; text-transform: uppercase; color: rgba(244, 247, 251, 0.78); }',
            '.' + ROOT_CLASS + '__title { margin: 0 0 12px; font-size: clamp(28px, 4vw, 38px); line-height: 1.05; }',
            '.' + ROOT_CLASS + '__message { margin: 0 0 22px; font-size: 15px; line-height: 1.6; color: rgba(244, 247, 251, 0.84); }',
            '.' + ROOT_CLASS + '__form { display: grid; gap: 14px; }',
            '.' + ROOT_CLASS + '__label { font-size: 13px; font-weight: 600; color: rgba(244, 247, 251, 0.92); }',
            '.' + ROOT_CLASS + '__input { width: 100%; padding: 14px 16px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; background: rgba(6, 12, 24, 0.48); color: #ffffff; font: inherit; outline: none; box-sizing: border-box; }',
            '.' + ROOT_CLASS + '__input::placeholder { color: rgba(244, 247, 251, 0.46); }',
            '.' + ROOT_CLASS + '__input:focus { border-color: rgba(150, 198, 255, 0.88); box-shadow: 0 0 0 4px rgba(95, 163, 255, 0.18); }',
            '.' + ROOT_CLASS + '__actions { display: flex; gap: 12px; align-items: center; }',
            '.' + ROOT_CLASS + '__button { min-width: 152px; padding: 13px 18px; border: 0; border-radius: 4px; background: linear-gradient(135deg, #98d8ff, #dff4ff); color: #032238; font: inherit; font-weight: 700; cursor: pointer; }',
            '.' + ROOT_CLASS + '__button:hover { filter: brightness(1.03); }',
            '.' + ROOT_CLASS + '__button:focus-visible { outline: 3px solid rgba(223, 244, 255, 0.6); outline-offset: 2px; }',
            '.' + ROOT_CLASS + '__status { min-height: 20px; font-size: 13px; color: #ffd2d2; }',
            '.' + ROOT_CLASS + '__status[data-state="idle"] { color: rgba(244, 247, 251, 0.6); }',
            '.' + ROOT_CLASS + '__footer { margin: 18px 0 0; font-size: 12px; line-height: 1.5; color: rgba(244, 247, 251, 0.56); }',
            '@media (max-width: 640px) { .' + ROOT_CLASS + ' { padding: 16px; } .' + ROOT_CLASS + '__panel { padding: 24px 20px; border-radius: 0; } .' + ROOT_CLASS + '__actions { flex-direction: column; align-items: stretch; } .' + ROOT_CLASS + '__button { width: 100%; } }'
        ].join('');
        document.head.appendChild(style);
    }

    function activateGate() {
        var root = document.createElement('div');
        root.className = ROOT_CLASS;
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-labelledby', ROOT_CLASS + '-title');
        root.setAttribute('aria-describedby', ROOT_CLASS + '-message');

        root.innerHTML = [
            '<div class="' + ROOT_CLASS + '__scrim"></div>',
            '<div class="' + ROOT_CLASS + '__media" aria-hidden="true">',
            '<iframe class="' + ROOT_CLASS + '__globe" src="' + escapeHtml(GATE_GLOBE_SRC) + '" tabindex="-1" loading="eager"></iframe>',
            '</div>',
            '<div class="' + ROOT_CLASS + '__panel">',
            '<div class="' + ROOT_CLASS + '__eyebrow">Limited Beta</div>',
            '<h1 class="' + ROOT_CLASS + '__title" id="' + ROOT_CLASS + '-title">' + escapeHtml(TITLE_TEXT) + '</h1>',
            '<p class="' + ROOT_CLASS + '__message" id="' + ROOT_CLASS + '-message">' + escapeHtml(MESSAGE_TEXT) + '</p>',
            '<form class="' + ROOT_CLASS + '__form" novalidate>',
            '<label class="' + ROOT_CLASS + '__label" for="' + ROOT_CLASS + '-input">' + escapeHtml(INPUT_LABEL) + '</label>',
            '<input class="' + ROOT_CLASS + '__input" id="' + ROOT_CLASS + '-input" name="accessKey" type="password" autocomplete="current-password" placeholder="Enter access key" required>',
            '<div class="' + ROOT_CLASS + '__actions">',
            '<button class="' + ROOT_CLASS + '__button" type="submit">' + escapeHtml(BUTTON_TEXT) + '</button>',
            '<div class="' + ROOT_CLASS + '__status" id="' + LIVE_REGION_ID + '" data-state="idle" aria-live="polite">Authorized reviewers only.</div>',
            '</div>',
            '</form>',
            '<p class="' + ROOT_CLASS + '__footer">' + escapeHtml(FOOTER_TEXT) + '</p>',
            '</div>'
        ].join('');

        document.body.appendChild(root);
        lockBody(root);

        var form = root.querySelector('form');
        var input = root.querySelector('input');
        var status = root.querySelector('#' + LIVE_REGION_ID);

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var enteredPassword = input.value;

            if (enteredPassword === ACCESS_PASSWORD) {
                localStorage.setItem(STORAGE_KEY, ACCESS_VALUE);
                unlockBody(root);
                window.location.replace(buildFreshOverviewUrl());
                return;
            }

            status.textContent = ERROR_TEXT;
            status.setAttribute('data-state', 'error');
            input.value = '';
            input.focus();
            input.setAttribute('aria-invalid', 'true');
        });

        input.addEventListener('input', function () {
            input.removeAttribute('aria-invalid');
            status.textContent = 'Authorized reviewers only.';
            status.setAttribute('data-state', 'idle');
        });

        window.setTimeout(function () {
            input.focus();
        }, 0);
    }

    function lockBody(root) {
        document.body.setAttribute(ACTIVE_ATTR, 'true');
        Array.prototype.forEach.call(document.body.children, function (child) {
            if (child === root) {
                return;
            }

            if (child.hasAttribute('inert')) {
                child.setAttribute('data-tsi-beta-prev-inert', 'true');
            } else {
                child.setAttribute('data-tsi-beta-prev-inert', 'false');
                child.inert = true;
            }
        });
    }

    function unlockBody(root) {
        document.body.removeAttribute(ACTIVE_ATTR);
        Array.prototype.forEach.call(document.body.children, function (child) {
            if (child === root) {
                return;
            }

            if (child.getAttribute('data-tsi-beta-prev-inert') === 'false') {
                child.inert = false;
            }
            child.removeAttribute('data-tsi-beta-prev-inert');
        });
    }

    function buildFreshOverviewUrl() {
        var nextUrl;
        try {
            nextUrl = new URL(window.location.href);
        } catch (_) {
            return 'index.html?home=00#overview';
        }

            nextUrl.searchParams.set('home', 'full');
            nextUrl.hash = '#overview';
            return nextUrl.toString();
        }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
