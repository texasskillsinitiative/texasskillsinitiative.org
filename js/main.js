    const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzDrmbMTExgcsq7-LfzYv7VLu9X5w93lDZMkXRfi0EnhPzlKL6KASMvukCGD5LvxHKD/exec';
    const SUBMIT_MIN_MS = 3000;
    const SUCCESS_GRACE_MS = 2000;
    const SUBMIT_MAX_MS = 30000;
    const HOLD_CLEAR_MS = 2000;
    window._formLastState = null;
    window._formOpenTime = 0;
    window._isSubmitting = false;
    window._submitStartedAt = 0;
    window._submitStatusTimer = null;
    window._submitMaxWaitTimer = null;
    // 021026_DigitalConcierge
    const _021026_TIER_MESSAGES = {
        '1': 'Thank you for reaching out. We recognize the importance of your perspective. Your information has been shared with our team for review, and we will follow up with you directly to discuss how your experience aligns with our regional work.',
        '2': 'Thank you for sharing your perspective. Your input has been received and added to our regional review to help inform our understanding of local conditions. We value these insights as we continue our exploratory work in the area.'
    };

    function _021026_setConciergeVisibility(form, tier) {
        const groups = form.querySelectorAll('[data-concierge-group]');
        groups.forEach(group => {
            const groupName = group.getAttribute('data-concierge-group');
            const shouldShow = tier && (groupName === 'common' || groupName === 'shared' || groupName === (tier === '1' ? 'tier-1' : 'tier-2'));
            group.hidden = !shouldShow;
            group.classList.toggle('is-visible', shouldShow);
            group.querySelectorAll('input, textarea, select').forEach(field => {
                field.disabled = !shouldShow;
            });
        });
    }

    function _021026_resetConcierge(form) {
        const buttons = form.querySelectorAll('[data-concierge-track]');
        const grid = form.querySelector('.concierge-grid');
        const backBtn = form.querySelector('#conciergeBackBtn');
        const error = form.querySelector('#conciergeError');
        const handlerTierInput = form.querySelector('#handlerTier');
        const trackInput = form.querySelector('#conciergeTrack');

        buttons.forEach(button => {
            button.classList.remove('is-active');
            button.classList.remove('is-hidden');
            button.setAttribute('aria-pressed', 'false');
        });
        if (grid) grid.classList.remove('is-collapsed');
        if (backBtn) backBtn.classList.remove('is-visible');
        form.classList.remove('has-concierge');

        if (handlerTierInput) handlerTierInput.value = '';
        if (trackInput) trackInput.value = '';
        if (error) {
            error.textContent = '';
            error.classList.remove('visible');
        }

        _021026_setConciergeVisibility(form, '');
    }

    function resetFormDataOnly() {
        const form = document.getElementById('stakeholderForm');
        if (form) {
            form.reset();
            _021026_resetConcierge(form);
        }
        const submitBtn = document.querySelector('.form-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
        window._formOpenTime = undefined;
        window._formLastState = null;
        window._isSubmitting = false;
        stopSubmissionTimers();
        clearFormStatus();
    }

    function setFormStatus(message) {
        const status = document.getElementById('formStatus');
        if (!status) return;
        status.textContent = message;
        status.hidden = false;
    }

    function clearFormStatus() {
        const status = document.getElementById('formStatus');
        if (!status) return;
        status.textContent = '';
        status.hidden = true;
    }

    function startSubmissionTimers() {
        stopSubmissionTimers();
        const startedAt = window._submitStartedAt;
        const updateProgress = () => {
            const elapsed = Date.now() - startedAt;
            if (elapsed <= 10000) {
                setFormStatus('Submitting your form...');
            } else if (elapsed <= 20000) {
                setFormStatus('Still sending—thanks for your patience.');
            } else if (elapsed <= 30000) {
                setFormStatus('This is taking longer than expected.');
            }
        };
        updateProgress();
        window._submitStatusTimer = setInterval(updateProgress, 1000);
        window._submitMaxWaitTimer = setTimeout(() => {
            const networkError = document.getElementById('formNetworkError');
            const submitBtn = document.querySelector('.form-submit');
            if (networkError) {
                networkError.querySelector('p').textContent = "We couldn't submit your form right now. Please try again.";
                networkError.hidden = false;
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
            window._isSubmitting = false;
            window._successShownAt = null;
            clearFormStatus();
            stopSubmissionTimers();
        }, SUBMIT_MAX_MS);
    }

    function stopSubmissionTimers() {
        if (window._submitStatusTimer) {
            clearInterval(window._submitStatusTimer);
            window._submitStatusTimer = null;
        }
        if (window._submitMaxWaitTimer) {
            clearTimeout(window._submitMaxWaitTimer);
            window._submitMaxWaitTimer = null;
        }
    }

    function generateSubmissionId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return 'sub_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function formatLocalTimestamp(date) {
        const pad = (value) => String(value).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        const tzOffsetMinutes = -date.getTimezoneOffset();
        const sign = tzOffsetMinutes >= 0 ? '+' : '-';
        const offsetHours = pad(Math.floor(Math.abs(tzOffsetMinutes) / 60));
        const offsetMinutes = pad(Math.abs(tzOffsetMinutes) % 60);
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${sign}${offsetHours}:${offsetMinutes}`;
    }

    // This handles the "Soft Close"
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
        modal.style.display = 'flex'; // or 'block' depending on your CSS
        document.body.style.overflow = 'hidden'; // Prevents background scrolling
        if (modalId === 'accessModal' && !window._formOpenTime) {
            window._formOpenTime = Date.now();
        }
    } else {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    }

    function handleOutsideClick(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'accessModal') {
            requestCloseAccessModal();
            return;
        }
        toggleModal(modalId, false);
    }
}

    function requestCloseAccessModal() {
        const formSuccess = document.getElementById('formSuccess');
        const isSuccessView = formSuccess && !formSuccess.hidden;

        if (window._isSubmitting) {
            return;
        }

        if (isSuccessView) {
            const now = Date.now();
            if (window._successShownAt && (now - window._successShownAt < SUCCESS_GRACE_MS)) {
                return;
            }
            closeSuccess();
            return;
        }

        toggleModal('accessModal', false);
    }
    
function resetFormToNew() {
    const form = document.getElementById('stakeholderForm');
    const formSuccess = document.getElementById('formSuccess');
    const modalBody = document.getElementById('accessModalBody');
    const submitBtn = form.querySelector('.form-submit');

        // 1. Clear all previous inputs
        form.reset();
        _021026_resetConcierge(form);

        // 2. CRITICAL: Re-enable the submit button 
        // It was set to .disabled = true in the submit handler
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }

        // 3. Swap the visibility
        form.hidden = false; // Show the form again
        if (formSuccess) {
        formSuccess.hidden = true; // Hide the success overlay
    }

    // 4. Remove the blur from the background
    if (modalBody) {
        modalBody.classList.remove('success-visible');
    }

    // 5. Reset the Time Trap
    window._formOpenTime = Date.now();
    window._successShownAt = null;
    window._isSubmitting = false;
    stopSubmissionTimers();
    clearFormStatus();
}

function closeSuccess() {
    const form = document.getElementById('stakeholderForm');
    const formSuccess = document.getElementById('formSuccess');
    const submitBtn = form.querySelector('.form-submit');

    // 1. RESET THE UI: This is what was missing
    if (form) {
        form.reset();         // Clears the text
        form.hidden = false;  // Makes form visible for next time
        _021026_resetConcierge(form);
    }
    if (formSuccess) formSuccess.hidden = true; // Hides the "Thank You"
    
    // 2. RESET THE BUTTON: Unlocks the "Sending..." state
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }

    // 3. EXIT
    toggleModal('accessModal', false);
    document.getElementById('accessModalBody').classList.remove('success-visible');
    
    // 4. RESET GLOBALS
    window._formLastState = 'ready';
    window._successShownAt = null;
    window._isSubmitting = false;
    stopSubmissionTimers();
    clearFormStatus();
}

function softCloseModal() {
    // Just hide the modal container
    document.getElementById('accessModal').style.display = 'none';
    
    // DO NOT call form.reset() here. 
    // This preserves the text for when they click "Open" again.
}

    // THE SUBMIT HANDLER
    document.getElementById('stakeholderForm').addEventListener('submit', function(e) {
        // PREVENT the page from clearing/refreshing
        e.preventDefault(); 

        if (window._isSubmitting) {
            return;
        }
        
        const form = this;
        const submitBtn = form.querySelector('.form-submit');
        const timeError = document.getElementById('formTimeError');
        const networkError = document.getElementById('formNetworkError');
        const nameError = document.getElementById('nameError');
        const locCountryError = document.getElementById('locCountryError');
        const messageError = document.getElementById('messageError');
        const emailError = document.getElementById('emailError');
        const conciergeError = document.getElementById('conciergeError');
        const handlerTierInput = document.getElementById('handlerTier');
        const successSub = document.getElementById('formSuccessSub');
        const modalBody = document.getElementById('accessModalBody');
        const formSuccess = document.getElementById('formSuccess');
        const successCloseBtn = document.getElementById('successCloseBtn');
        const successAnotherBtn = document.getElementById('successAnotherBtn');

        // Reset UI state
        if (timeError) timeError.hidden = true;
        if (networkError) {
            networkError.hidden = true;
            networkError.querySelector('p').textContent = "Something didn't go through. Please try again.";
        }
        if (nameError) nameError.classList.remove('visible');
        if (locCountryError) locCountryError.classList.remove('visible');
        if (messageError) messageError.classList.remove('visible');
        if (emailError) emailError.classList.remove('visible');
        if (conciergeError) {
            conciergeError.textContent = '';
            conciergeError.classList.remove('visible');
        }

        if (!handlerTierInput || !handlerTierInput.value) {
            if (conciergeError) {
                conciergeError.textContent = 'Select a perspective to continue.';
                conciergeError.classList.add('visible');
            }
            return;
        }

        const nameValue = document.getElementById('name').value.trim();
        if (!nameValue) {
            if (nameError) {
                nameError.textContent = 'Please enter your name.';
                nameError.classList.add('visible');
            }
            return;
        }

        const locCountryValue = document.getElementById('locCountry').value.trim();
        if (!locCountryValue) {
            if (locCountryError) {
                locCountryError.textContent = 'Country is required.';
                locCountryError.classList.add('visible');
            }
            return;
        }

        const messageValue = document.getElementById('message').value.trim();
        if (!messageValue) {
            if (messageError) {
                messageError.textContent = 'Please add a short message.';
                messageError.classList.add('visible');
            }
            return;
        }

        // 1. Check Time Trap (3 seconds)
        const timeElapsed = Date.now() - (window._formOpenTime || 0);
        if (timeElapsed < SUBMIT_MIN_MS) {
            if (timeError) timeError.hidden = false;
            return; // Stops here, text stays in boxes
        }

        // 2. Simple Email Validation
        const email = document.getElementById('email').value;
        if (!email.includes('@')) {
            if (emailError) {
                emailError.textContent = "Please enter a valid email address.";
                emailError.classList.add('visible');
            }
            return;
        }

        // 3. Start Submission
        window._isSubmitting = true;
        window._submitStartedAt = Date.now();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        startSubmissionTimers();

        // Prepare data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        data.page_path = window.location.pathname || '/';
        data.referrer = document.referrer || 'direct';
        data.submission_id = generateSubmissionId();
        data.timestamp_local = formatLocalTimestamp(new Date());

        fetch(FORM_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(data)
        })
        .then(res => {
            return res
                .json()
                .catch(() => null)
                .then(body => ({ res, body }));
        })
        .then(({ res, body }) => {
            if (!window._isSubmitting) {
                return;
            }
            const isOk = res.ok && body && body.ok === true;
            if (isOk) {
                window._successShownAt = Date.now();
                window._formLastState = 'success';
                window._isSubmitting = false;
                stopSubmissionTimers();
                clearFormStatus();
                // Trigger Success UI
                if (successSub) {
                    successSub.textContent = _021026_TIER_MESSAGES[handlerTierInput.value] || _021026_TIER_MESSAGES['2'];
                }
                if (modalBody) {
                    modalBody.scrollTop = 0;
                    modalBody.classList.add('success-visible');
                }
                if (formSuccess) {
                    formSuccess.hidden = false;
                    formSuccess.classList.add('reveal-active');
                }
                if (successCloseBtn) successCloseBtn.disabled = true;
                if (successAnotherBtn) successAnotherBtn.disabled = true;
                setTimeout(() => {
                    if (successCloseBtn) successCloseBtn.disabled = false;
                    if (successAnotherBtn) successAnotherBtn.disabled = false;
                }, SUCCESS_GRACE_MS);
                form.hidden = true;
            } else {
                throw new Error((body && body.error) ? body.error : 'Server error');
            }
        })
        .catch(err => {
            if (!window._isSubmitting) {
                return;
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
            if (networkError) networkError.hidden = false;
            window._isSubmitting = false;
            window._successShownAt = null;
            stopSubmissionTimers();
            clearFormStatus();
        });
    });

    function _021026_initConciergeForm() {
        const form = document.getElementById('stakeholderForm');
        if (!form) return;

        const buttons = form.querySelectorAll('[data-concierge-track]');
        const grid = form.querySelector('.concierge-grid');
        const backBtn = form.querySelector('#conciergeBackBtn');
        const handlerTierInput = form.querySelector('#handlerTier');
        const trackInput = form.querySelector('#conciergeTrack');
        const error = form.querySelector('#conciergeError');

        buttons.forEach(button => {
            button.setAttribute('aria-pressed', 'false');
            button.addEventListener('click', () => {
                const tier = button.getAttribute('data-concierge-tier') || '';
                const label = button.textContent.trim();
                buttons.forEach(btn => {
                    btn.classList.remove('is-active');
                    btn.classList.remove('is-hidden');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('is-active');
                button.setAttribute('aria-pressed', 'true');
                buttons.forEach(btn => {
                    if (btn !== button) {
                        btn.classList.add('is-hidden');
                    }
                });
                if (grid) grid.classList.add('is-collapsed');
                if (backBtn) backBtn.classList.add('is-visible');
                form.classList.add('has-concierge');
                if (handlerTierInput) handlerTierInput.value = tier;
                if (trackInput) trackInput.value = label;
                if (error) {
                    error.textContent = '';
                    error.classList.remove('visible');
                }
                _021026_setConciergeVisibility(form, tier);
            });
        });

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                _021026_resetConcierge(form);
            });
        }

        const initialTier = handlerTierInput ? handlerTierInput.value : '';
        if (initialTier) {
            form.classList.add('has-concierge');
        }
        _021026_setConciergeVisibility(form, initialTier);
    }

    function initModalTriggers() {
        document.querySelectorAll('[data-modal-open]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal-open');
                if (modalId) toggleModal(modalId, true);
            });
        });

        document.querySelectorAll('[data-modal-close]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal-close');
                if (!modalId) return;
                if (modalId === 'accessModal') {
                    requestCloseAccessModal();
                    return;
                }
                toggleModal(modalId, false);
            });
        });

        document.querySelectorAll('[data-modal-overlay]').forEach(overlay => {
            overlay.addEventListener('click', (event) => handleOutsideClick(event, overlay.id));
        });

        document.querySelectorAll('[data-action=\"success-close\"]').forEach(button => {
            button.addEventListener('click', closeSuccess);
        });

        document.querySelectorAll('[data-action=\"success-another\"]').forEach(button => {
            button.addEventListener('click', resetFormToNew);
        });
    }

    function initPortalOptions() {
        const form = document.getElementById('portalLoginForm');
        if (!form) return;
        const submitBtn = document.getElementById('portalSubmit');
        const status = document.getElementById('portalStatus');
        const failure = document.getElementById('portalFailure');
        const usernameInput = document.getElementById('portalUsername');

        if (status) status.hidden = true;
        if (failure) failure.hidden = true;

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!submitBtn) return;

            const rawUsername = usernameInput ? usernameInput.value.trim() : '';
            const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawUsername);
            const domainOk = rawUsername.toLowerCase().endsWith('@texasskillsinitiative.org');

            if (!emailOk) {
                if (failure) {
                    failure.textContent = 'Please enter a valid email address.';
                    failure.hidden = false;
                }
                if (status) status.hidden = true;
                return;
            }

            if (!domainOk) {
                if (failure) {
                    failure.textContent = 'External emails are not permitted.';
                    failure.hidden = false;
                }
                if (status) status.hidden = true;
                return;
            }

            submitBtn.disabled = true;
            submitBtn.classList.add('is-loading');
            if (status) {
                status.textContent = 'Verifying identity...';
                status.hidden = false;
            }
            if (failure) failure.hidden = true;

            const delay = 1500 + Math.floor(Math.random() * 500);
            window.setTimeout(() => {
                if (status) status.hidden = true;
                if (failure) {
                    failure.textContent = 'Authentication unavailable.\nPlease contact system administration for access updates.';
                    failure.hidden = false;
                }
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
            }, delay);
        });
    }

    initModalTriggers();
    _021026_initConciergeForm();
    initPortalOptions();
    initHoldToClear();
    initTeamTabs();
    initPipelineMap();

    // Theme Toggle & Animations (Keep your existing code here)
    const toggleSwitch = document.querySelector('#checkbox');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-theme', e.target.checked ? 'light' : 'dark');
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active'); 
                if (entry.target.classList.contains('asset-image')) entry.target.classList.add('revealed');
                if (entry.target.id === 'pipeline-metrics') {
                    entry.target.querySelectorAll('.sync-progress').forEach(bar => {
                        const target = parseInt(bar.getAttribute('data-target'));
                        bar.style.width = target + '%';
                    });
                }
            } 
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-text, .asset-image, #pipeline-metrics').forEach(el => observer.observe(el));
    const overview = document.querySelector('.overview-hero');
    if (overview) {
        const tagline = overview.querySelector('.overview-tagline');
        const lines = overview.querySelectorAll('.overview-line');
        const overviewCopy = overview.querySelector('.overview-copy');
        const overviewPhrases = overview.querySelectorAll('.overview-phrase');
        const overviewContinue = overview.querySelector('.overview-continue');
        const lineGap = 1.5;
        const wordGap = 0.7;
        const overviewTimers = [];

        const clearOverviewTimers = () => {
            overviewTimers.forEach(timer => window.clearTimeout(timer));
            overviewTimers.length = 0;
        };

        const schedule = (fn, delaySeconds) => {
            const timer = window.setTimeout(fn, Math.max(delaySeconds, 0) * 1000);
            overviewTimers.push(timer);
        };

        const runOverviewSequence = () => {
            clearOverviewTimers();

            const revealItems = overview.querySelectorAll('.reveal-text');
            revealItems.forEach(item => item.classList.remove('reveal-active'));
            overviewPhrases.forEach(phrase => phrase.classList.remove('is-phrase-visible'));
            if (overviewCopy) {
                overviewCopy.classList.remove('is-body-visible');
            }
            if (overviewContinue) {
                overviewContinue.classList.remove('is-visible');
            }

            void overview.offsetWidth;

            let delay = 0.2;
            let maxWordDelay = 0;

            if (tagline) {
                tagline.style.setProperty('--reveal-delay', `${delay}s`);
                delay += lineGap;
            }

            lines.forEach(line => {
                const words = line.querySelectorAll('.reveal-word');
                words.forEach((word, idx) => {
                    const wordDelay = delay + idx * wordGap;
                    word.style.setProperty('--reveal-delay', `${wordDelay}s`);
                    if (wordDelay > maxWordDelay) {
                        maxWordDelay = wordDelay;
                    }
                });
                delay += lineGap;
            });

            requestAnimationFrame(() => {
                revealItems.forEach(item => item.classList.add('reveal-active'));
            });

            if (overviewCopy) {
                const phraseStartDelay = maxWordDelay + 0.6;
                const phraseGap = 1.6;
                overviewPhrases.forEach((phrase, idx) => {
                    const phraseDelay = phraseStartDelay + idx * phraseGap;
                    schedule(() => {
                        phrase.classList.add('is-phrase-visible');
                    }, phraseDelay);
                });

                const bodyDelay = phraseStartDelay + (overviewPhrases.length * phraseGap) + 0.3;
                schedule(() => {
                    overviewCopy.classList.add('is-body-visible');
                }, bodyDelay);

                if (overviewContinue) {
                    const continueDelay = bodyDelay + 1.0;
                    schedule(() => {
                        overviewContinue.classList.add('is-visible');
                    }, continueDelay);
                }
            }
        };

        window._runOverviewSequence = runOverviewSequence;

        if (overviewContinue) {
            overviewContinue.addEventListener('click', () => {
                window.location.hash = '#mandate';
            });
        }
    }

    const jumpViewportToTop = () => {
        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
        root.style.scrollBehavior = previousScrollBehavior;
    };

    function setActiveTabFromHash(options = {}) {
        const shouldResetScroll = options.resetScroll !== false;
        const hash = window.location.hash || '#overview';
        const tabId = hash.startsWith('#') ? hash.slice(1) : 'overview';
        const targetExists = document.getElementById(tabId);
        const resolvedId = targetExists ? tabId : 'overview';

        document.body.dataset.activeTab = resolvedId;

        document.querySelectorAll('.header-index a').forEach(link => {
            const isActive = link.getAttribute('href') === `#${resolvedId}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
            link.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (resolvedId === 'overview' && typeof window._runOverviewSequence === 'function') {
            window._runOverviewSequence();
        }

        if (shouldResetScroll) {
            requestAnimationFrame(() => {
                jumpViewportToTop();
            });
        }
    }

    if (window.history && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    window.addEventListener('hashchange', () => setActiveTabFromHash({ resetScroll: true }));
    setActiveTabFromHash({ resetScroll: true });

    function initTeamTabs() {
        const tabs = document.querySelectorAll('.team-tab');
        if (!tabs.length) return;

        const panels = document.querySelectorAll('.team-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-team-target');
                const targetPanel = target ? document.querySelector(`.team-panel[data-team-panel=\"${target}\"]`) : null;
                panels.forEach(panel => {
                    const isActive = panel === targetPanel;
                    panel.classList.toggle('is-active', isActive);
                    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                });
                tabs.forEach(btn => btn.classList.toggle('is-active', btn === tab));
                tabs.forEach(btn => btn.setAttribute('aria-selected', btn === tab ? 'true' : 'false'));
            });
        });

        tabs[0].click();
    }

    function initPipelineMap() {
        const maps = Array.from(document.querySelectorAll('.pipeline-map svg'))
            .filter(map => map.getAttribute('data-map-disabled') !== 'true');
        const frameToMap = new WeakMap();
        const pointerModeSetters = new WeakMap();
        const mapDotGrid = new WeakMap();
        const mapColumnGlowRuntimes = new WeakMap();
        const mapGlowTuningDefaults = {
            dotSize: 7,
            falloffPx: 0.5,
            activeOpacity: 1,
            easing: 0.24,
            lingerMs: 160
        };
        const mapFlashTuningDefaults = {
            radiusCells: 1.4,
            durationMs: 80,
            intensity: 1,
            gridStep: 0.65,
            throttleMs: 10
        };
        const mapFlashDurationBounds = {
            min: 80,
            max: 2000
        };
        const mapFlashDurationTestValues = [460, 720, 960, 1440, 2000];
        const mapColumnGlowDefaults = {
            speedMs: 1200,
            maxOpacity: 0.1,
            activeLines: 3,
            loadMs: 600,
            startupSpeedMs: 20,
            startupMaxOpacity: 1,
            startupActiveLines: 3,
            startupLoadMs: 20
        };
        const mapStartupSprinkleDefaults = {
            durationMs: 1500,
            stepMs: 20,
            seed: 37
        };
        const mapFlashVisualDefaults = {
            compactGlow: true
        };
        const mapFlashPresetDefaults = {
            presetId: 'compact',
            presets: {
                compact: {
                    label: 'Flash Compact',
                    radiusCells: 0.5,
                    durationMs: 80,
                    intensity: 0.88,
                    gridStep: 0.72,
                    throttleMs: 12,
                    centerOnly: true
                }
            }
        };
        let mapTestsToastTimer = 0;
        const showMapTestsToggleNotice = (visible) => {
            let toast = document.getElementById('mapTestsToggleToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'mapTestsToggleToast';
                toast.className = 'map-tests-toggle-toast';
                toast.setAttribute('role', 'status');
                toast.setAttribute('aria-live', 'polite');
                document.body.appendChild(toast);
            }
            toast.textContent = visible
                ? 'Map test settings shown'
                : 'Map test settings hidden';
            toast.classList.add('is-visible');
            if (mapTestsToastTimer) {
                window.clearTimeout(mapTestsToastTimer);
                mapTestsToastTimer = 0;
            }
            mapTestsToastTimer = window.setTimeout(() => {
                toast.classList.remove('is-visible');
                mapTestsToastTimer = 0;
            }, 1200);
        };
        const mapTestsVisibilityStorageKey = 'tsi-map-tests-visible';
        const readMapTestsVisibility = () => {
            try {
                return window.localStorage.getItem(mapTestsVisibilityStorageKey) === '1';
            } catch (_) {
                return false;
            }
        };
        let mapTestsVisible = readMapTestsVisibility();
        const syncMapTestsVisibility = () => {
            document.querySelectorAll('[data-map-tests], [data-test-settings]').forEach(node => {
                node.hidden = !mapTestsVisible;
                node.setAttribute('aria-hidden', mapTestsVisible ? 'false' : 'true');
                node.style.display = mapTestsVisible ? '' : 'none';
            });
        };
        const setMapTestsVisible = (nextVisible) => {
            mapTestsVisible = Boolean(nextVisible);
            try {
                if (mapTestsVisible) {
                    window.localStorage.setItem(mapTestsVisibilityStorageKey, '1');
                } else {
                    window.localStorage.removeItem(mapTestsVisibilityStorageKey);
                }
            } catch (_) {
                // Ignore storage failures; visibility still updates for this session.
            }
            syncMapTestsVisibility();
        };
        const applyFlashPresetToFrame = (frame, presetId) => {
            if (!frame) return mapFlashPresetDefaults.presetId;
            const preset = mapFlashPresetDefaults.presets[presetId] || mapFlashPresetDefaults.presets[mapFlashPresetDefaults.presetId];
            const resolvedPresetId = mapFlashPresetDefaults.presets[presetId] ? presetId : mapFlashPresetDefaults.presetId;
            frame.dataset.mapFlashPreset = resolvedPresetId;
            frame.dataset.mapFlashRadiusCells = String(preset.radiusCells);
            frame.dataset.mapFlashDurationMs = String(preset.durationMs);
            frame.dataset.mapFlashIntensity = String(preset.intensity);
            frame.dataset.mapFlashGridStep = String(preset.gridStep);
            frame.dataset.mapFlashThrottleMs = String(preset.throttleMs);
            frame.dataset.mapFlashCenterOnly = preset.centerOnly ? 'true' : 'false';
            return resolvedPresetId;
        };
        maps.forEach(map => {
            const frame = map.closest('.pipeline-map-frame');
            if (frame && !frameToMap.has(frame)) {
                frameToMap.set(frame, map);
            }
        });
        const clampNumber = (value, min, max, fallback) => {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) return fallback;
            return Math.min(max, Math.max(min, numericValue));
        };
        const ensureFrameCategoryFlashLayer = (frame) => {
            if (!frame) return;
            if (frame.querySelector('.map-frame-gap-flash-layer')) return;
            const layer = document.createElement('span');
            layer.className = 'map-frame-gap-flash-layer';
            layer.setAttribute('aria-hidden', 'true');
            frame.insertBefore(layer, frame.firstChild);
        };
        const ensureFrameTuningDefaults = (frame) => {
            if (!frame) return;
            ensureFrameCategoryFlashLayer(frame);
            if (!frame.dataset.mapPointerDotSize) frame.dataset.mapPointerDotSize = String(mapGlowTuningDefaults.dotSize);
            if (!frame.dataset.mapPointerEase) frame.dataset.mapPointerEase = String(mapGlowTuningDefaults.easing);
            if (!frame.dataset.mapPointerLinger) frame.dataset.mapPointerLinger = String(mapGlowTuningDefaults.lingerMs);
            if (!frame.dataset.mapPointerMode) frame.dataset.mapPointerMode = 'trail';
            if (!frame.dataset.mapFlashCompactGlow) frame.dataset.mapFlashCompactGlow = mapFlashVisualDefaults.compactGlow ? 'true' : 'false';
            if (!frame.dataset.mapGlowForceOn) frame.dataset.mapGlowForceOn = 'false';
            if (!frame.dataset.mapGlowEnabled) frame.dataset.mapGlowEnabled = 'false';
            if (!frame.dataset.mapGlowMaxOpacity) frame.dataset.mapGlowMaxOpacity = String(mapColumnGlowDefaults.maxOpacity);
            if (!frame.dataset.mapGlowActiveLines) frame.dataset.mapGlowActiveLines = String(mapColumnGlowDefaults.activeLines);
            if (!frame.dataset.mapGlowSpeedMs) frame.dataset.mapGlowSpeedMs = String(mapColumnGlowDefaults.speedMs);
            if (!frame.dataset.mapGlowLoadMs) frame.dataset.mapGlowLoadMs = String(mapColumnGlowDefaults.loadMs);
            if (!frame.dataset.mapGlowTailLoadSync) frame.dataset.mapGlowTailLoadSync = 'false';
            if (!frame.dataset.mapGlowLeadFull) frame.dataset.mapGlowLeadFull = 'false';
            if (!frame.dataset.mapGlowLeadEdgeLine) frame.dataset.mapGlowLeadEdgeLine = 'false';
            if (!frame.dataset.mapGlowStartupMode) frame.dataset.mapGlowStartupMode = 'sprinkle';
            if (!frame.dataset.mapGlowSprinkleMs) frame.dataset.mapGlowSprinkleMs = String(mapStartupSprinkleDefaults.durationMs);
            if (!frame.dataset.mapGlowSprinkleStepMs) frame.dataset.mapGlowSprinkleStepMs = String(mapStartupSprinkleDefaults.stepMs);
            if (!frame.dataset.mapGlowSprinkleSeed) frame.dataset.mapGlowSprinkleSeed = String(mapStartupSprinkleDefaults.seed);
            if (!frame.dataset.mapGlowStartupSpeedMs) frame.dataset.mapGlowStartupSpeedMs = String(mapColumnGlowDefaults.startupSpeedMs);
            if (!frame.dataset.mapGlowStartupMaxOpacity) frame.dataset.mapGlowStartupMaxOpacity = String(mapColumnGlowDefaults.startupMaxOpacity);
            if (!frame.dataset.mapGlowStartupActiveLines) frame.dataset.mapGlowStartupActiveLines = String(mapColumnGlowDefaults.startupActiveLines);
            if (!frame.dataset.mapGlowStartupLoadMs) frame.dataset.mapGlowStartupLoadMs = String(mapColumnGlowDefaults.startupLoadMs);
            applyFlashPresetToFrame(frame, frame.dataset.mapFlashPreset || mapFlashPresetDefaults.presetId);
            if (!frame.style.getPropertyValue('--map-pointer-falloff-px')) {
                frame.style.setProperty('--map-pointer-falloff-px', `${mapGlowTuningDefaults.falloffPx}px`);
            }
            if (!frame.style.getPropertyValue('--map-pointer-active-opacity')) {
                frame.style.setProperty('--map-pointer-active-opacity', String(mapGlowTuningDefaults.activeOpacity));
            }
        };
        const stopColumnGlow = (map, removeLayer = false) => {
            const runtime = mapColumnGlowRuntimes.get(map);
            if (runtime) {
                if (runtime.timerId) {
                    window.clearInterval(runtime.timerId);
                    runtime.timerId = 0;
                }
                if (runtime.sprinkleTimerId) {
                    window.clearInterval(runtime.sprinkleTimerId);
                    runtime.sprinkleTimerId = 0;
                }
                if (runtime.leadRafId) {
                    window.cancelAnimationFrame(runtime.leadRafId);
                    runtime.leadRafId = 0;
                }
                if (runtime.dissipateRafId) {
                    window.cancelAnimationFrame(runtime.dissipateRafId);
                    runtime.dissipateRafId = 0;
                }
                if (runtime.sprinkleDotsHidden && runtime.grid && Array.isArray(runtime.grid.dots)) {
                    runtime.grid.dots.forEach(dot => {
                        if (dot) dot.style.opacity = '';
                    });
                    runtime.sprinkleDotsHidden = false;
                }
                mapColumnGlowRuntimes.delete(map);
            }
            map.style.clipPath = '';
            map.style.webkitClipPath = '';
            if (removeLayer) {
                const existingLayer = map.querySelector('.map-column-glow-layer');
                if (existingLayer) existingLayer.remove();
            }
        };
        const buildSprinkleOrder = (total, seedRaw) => {
            const order = new Array(total);
            for (let i = 0; i < total; i += 1) order[i] = i;
            let seed = Math.abs(Math.floor(Number(seedRaw))) || mapStartupSprinkleDefaults.seed;
            const nextRand = () => {
                seed ^= (seed << 13);
                seed ^= (seed >>> 17);
                seed ^= (seed << 5);
                return seed >>> 0;
            };
            for (let i = total - 1; i > 0; i -= 1) {
                const j = nextRand() % (i + 1);
                const temp = order[i];
                order[i] = order[j];
                order[j] = temp;
            }
            return order;
        };
        const startColumnGlow = (map) => {
            const frame = map.closest('.pipeline-map-frame');
            ensureFrameTuningDefaults(frame);
            const sweepEnabled = frame && frame.dataset.mapGlowEnabled !== 'false';
            const forceOn = frame && frame.dataset.mapGlowForceOn === 'true';
            const allowMotion = forceOn || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!allowMotion) {
                stopColumnGlow(map, true);
                return;
            }
            const grid = mapDotGrid.get(map);
            if (!grid || !Number.isFinite(grid.width) || grid.width <= 0 || !Number.isFinite(grid.height) || grid.height <= 0) {
                stopColumnGlow(map, true);
                return;
            }
            const maxOpacity = clampNumber(frame && frame.dataset.mapGlowMaxOpacity, 0.1, 1, mapColumnGlowDefaults.maxOpacity);
            const activeLines = Math.round(clampNumber(
                frame && frame.dataset.mapGlowActiveLines,
                1,
                24,
                mapColumnGlowDefaults.activeLines
            ));
            const speedMs = Math.round(clampNumber(
                frame && frame.dataset.mapGlowSpeedMs,
                8,
                1200,
                mapColumnGlowDefaults.speedMs
            ));
            const loadMs = Math.round(clampNumber(
                frame && frame.dataset.mapGlowLoadMs,
                20,
                600,
                mapColumnGlowDefaults.loadMs
            ));
            const startupMaxOpacity = clampNumber(
                frame && frame.dataset.mapGlowStartupMaxOpacity,
                0.1,
                1,
                mapColumnGlowDefaults.startupMaxOpacity
            );
            const startupActiveLines = Math.round(clampNumber(
                frame && frame.dataset.mapGlowStartupActiveLines,
                1,
                24,
                mapColumnGlowDefaults.startupActiveLines
            ));
            const startupSpeedMs = Math.round(clampNumber(
                frame && frame.dataset.mapGlowStartupSpeedMs,
                8,
                1200,
                mapColumnGlowDefaults.startupSpeedMs
            ));
            const startupLoadMs = Math.round(clampNumber(
                frame && frame.dataset.mapGlowStartupLoadMs,
                20,
                600,
                mapColumnGlowDefaults.startupLoadMs
            ));
            const startupMode = frame && frame.dataset.mapGlowStartupMode === 'sprinkle' ? 'sprinkle' : 'sweep';
            const startupSprinkleMs = Math.round(clampNumber(
                frame && frame.dataset.mapGlowSprinkleMs,
                200,
                12000,
                mapStartupSprinkleDefaults.durationMs
            ));
            const startupSprinkleStepMs = Math.round(clampNumber(
                frame && frame.dataset.mapGlowSprinkleStepMs,
                8,
                250,
                mapStartupSprinkleDefaults.stepMs
            ));
            const startupSprinkleSeed = Math.round(clampNumber(
                frame && frame.dataset.mapGlowSprinkleSeed,
                1,
                999999,
                mapStartupSprinkleDefaults.seed
            ));
            const shouldRunInitialReveal = Boolean(frame && frame.dataset.mapGlowInitialRevealDone !== 'true');
            const useSprinkleStartup = shouldRunInitialReveal && startupMode === 'sprinkle';
            if (!sweepEnabled && !useSprinkleStartup) {
                stopColumnGlow(map, true);
                return;
            }
            if (!sweepEnabled && useSprinkleStartup) {
                stopColumnGlow(map, true);
                const dots = grid.dots;
                if (!Array.isArray(dots) || !dots.length) {
                    if (frame) frame.dataset.mapGlowInitialRevealDone = 'true';
                    return;
                }
                const order = buildSprinkleOrder(dots.length, startupSprinkleSeed);
                dots.forEach(dot => {
                    if (dot) dot.style.opacity = '0';
                });
                let revealed = 0;
                const tickCount = Math.max(1, Math.ceil(startupSprinkleMs / startupSprinkleStepMs));
                const batchSize = Math.max(1, Math.ceil(order.length / tickCount));
                const runtime = {
                    timerId: 0,
                    sprinkleTimerId: 0,
                    leadRafId: 0,
                    dissipateRafId: 0,
                    grid,
                    sprinkleDotsHidden: true
                };
                mapColumnGlowRuntimes.set(map, runtime);
                const revealBatch = () => {
                    const next = Math.min(order.length, revealed + batchSize);
                    for (let i = revealed; i < next; i += 1) {
                        const dot = dots[order[i]];
                        if (dot) dot.style.opacity = '';
                    }
                    revealed = next;
                    if (revealed >= order.length) {
                        if (runtime.sprinkleTimerId) {
                            window.clearInterval(runtime.sprinkleTimerId);
                            runtime.sprinkleTimerId = 0;
                        }
                        runtime.sprinkleDotsHidden = false;
                        if (frame) frame.dataset.mapGlowInitialRevealDone = 'true';
                        mapColumnGlowRuntimes.delete(map);
                    }
                };
                revealBatch();
                if (revealed < order.length) {
                    runtime.sprinkleTimerId = window.setInterval(revealBatch, startupSprinkleStepMs);
                }
                return;
            }
            const syncTailFadeToLoad = Boolean(frame && frame.dataset.mapGlowTailLoadSync === 'true');
            const forceLeadFullOpacity = Boolean(frame && frame.dataset.mapGlowLeadFull === 'true');
            const showLeadEdgeLine = Boolean(frame && frame.dataset.mapGlowLeadEdgeLine === 'true');
            const startupLineCount = Math.max(1, Math.min(startupActiveLines, grid.width));
            const normalLineCount = Math.max(1, Math.min(activeLines, grid.width));
            const lineCount = Math.max(startupLineCount, normalLineCount);
            const landFadeExponent = 0.88;
            const oceanFadeExponent = 1.12;
            const columnLandRatios = new Array(grid.width).fill(0);
            for (let x = 0; x < grid.width; x += 1) {
                let landCount = 0;
                for (let y = 0; y < grid.height; y += 1) {
                    const dot = grid.dots[(y * grid.width) + x];
                    if (dot && dot.classList.contains('is-land')) landCount += 1;
                }
                columnLandRatios[x] = landCount / grid.height;
            }

            stopColumnGlow(map, true);

            const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            layer.setAttribute('class', 'map-column-glow-layer');
            layer.setAttribute('aria-hidden', 'true');

            const lineRects = [];
            for (let i = 0; i < lineCount; i += 1) {
                const lineRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                lineRect.setAttribute('class', 'map-column-glow map-column-glow--line');
                lineRect.setAttribute('x', '0');
                lineRect.setAttribute('y', '0');
                lineRect.setAttribute('width', '1');
                lineRect.setAttribute('height', String(grid.height));
                lineRect.style.opacity = '0';
                layer.appendChild(lineRect);
                lineRects.push(lineRect);
            }
            const dissipateRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            dissipateRect.setAttribute('class', 'map-column-glow map-column-glow--line');
            dissipateRect.setAttribute('x', '0');
            dissipateRect.setAttribute('y', '0');
            dissipateRect.setAttribute('width', '1');
            dissipateRect.setAttribute('height', String(grid.height));
            dissipateRect.style.opacity = '0';
            layer.appendChild(dissipateRect);
            const edgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            edgeRect.setAttribute('class', 'map-column-glow map-column-glow--line map-column-glow--edge');
            edgeRect.setAttribute('x', '0');
            edgeRect.setAttribute('y', '0');
            edgeRect.setAttribute('width', '0.1');
            edgeRect.setAttribute('height', String(grid.height));
            edgeRect.style.opacity = '0';
            layer.appendChild(edgeRect);

            map.appendChild(layer);

            const runtime = {
                timerId: 0,
                sprinkleTimerId: 0,
                lineRects,
                dissipateRect,
                edgeRect,
                grid,
                currentColumn: -1,
                leadRafId: 0,
                dissipateRafId: 0,
                prevTrailingColumn: -1,
                prevTrailingOpacity: 0,
                sprinkleDotsHidden: false,
                initialRevealActive: shouldRunInitialReveal
            };
            const getPhaseConfig = () => (runtime.initialRevealActive
                ? {
                    lineCount: startupLineCount,
                    maxOpacity: startupMaxOpacity,
                    loadMs: startupLoadMs,
                    stepMs: Math.max(startupSpeedMs, startupLoadMs)
                }
                : {
                    lineCount: normalLineCount,
                    maxOpacity,
                    loadMs,
                    stepMs: Math.max(speedMs, loadMs)
                });
            if (runtime.initialRevealActive && !useSprinkleStartup) {
                map.style.clipPath = 'inset(0 100% 0 0)';
                map.style.webkitClipPath = 'inset(0 100% 0 0)';
            }
            const revealLeadLine = (lineRect, columnX, opacity, revealMs) => {
                lineRect.style.transition = 'none';
                lineRect.setAttribute('x', String(columnX));
                lineRect.setAttribute('y', '0');
                lineRect.setAttribute('height', '0');
                lineRect.style.opacity = opacity.toFixed(3);
                if (runtime.leadRafId) {
                    window.cancelAnimationFrame(runtime.leadRafId);
                    runtime.leadRafId = 0;
                }
                runtime.leadRafId = window.requestAnimationFrame(() => {
                    runtime.leadRafId = 0;
                    lineRect.style.transition = `height ${revealMs}ms cubic-bezier(0.22, 0.72, 0.26, 1), opacity ${revealMs}ms linear`;
                    lineRect.setAttribute('height', String(grid.height));
                });
            };
            const dissipateTrailingLine = (columnX, startOpacity, dissipateMs) => {
                if (!runtime.dissipateRect || !Number.isFinite(columnX) || startOpacity <= 0) return;
                if (runtime.dissipateRafId) {
                    window.cancelAnimationFrame(runtime.dissipateRafId);
                    runtime.dissipateRafId = 0;
                }
                const targetY = Math.max(0, grid.height - 0.55);
                runtime.dissipateRect.style.transition = 'none';
                runtime.dissipateRect.setAttribute('x', String(columnX));
                runtime.dissipateRect.setAttribute('y', '0');
                runtime.dissipateRect.setAttribute('height', String(grid.height));
                runtime.dissipateRect.style.opacity = startOpacity.toFixed(3);
                runtime.dissipateRafId = window.requestAnimationFrame(() => {
                    runtime.dissipateRafId = 0;
                    runtime.dissipateRect.style.transition = `y ${dissipateMs}ms cubic-bezier(0.2, 0.65, 0.22, 1), height ${dissipateMs}ms cubic-bezier(0.2, 0.65, 0.22, 1), opacity ${dissipateMs}ms linear`;
                    runtime.dissipateRect.setAttribute('y', targetY.toFixed(3));
                    runtime.dissipateRect.setAttribute('height', '0.55');
                    runtime.dissipateRect.style.opacity = '0';
                });
            };
            const advanceInitialReveal = () => {
                if (!runtime.initialRevealActive) return;
                const revealedColumns = Math.max(0, Math.min(grid.width, runtime.currentColumn + 1));
                const rightPercent = ((grid.width - revealedColumns) / grid.width) * 100;
                const clipValue = `inset(0 ${rightPercent.toFixed(3)}% 0 0)`;
                map.style.clipPath = clipValue;
                map.style.webkitClipPath = clipValue;
                if (revealedColumns >= grid.width) {
                    runtime.initialRevealActive = false;
                    if (frame) frame.dataset.mapGlowInitialRevealDone = 'true';
                    map.style.clipPath = '';
                    map.style.webkitClipPath = '';
                    if (runtime.timerId) {
                        const nextPhase = getPhaseConfig();
                        window.clearInterval(runtime.timerId);
                        runtime.timerId = window.setInterval(runStep, nextPhase.stepMs);
                    }
                }
            };
            const runStartupSprinkle = (onComplete) => {
                const dots = grid.dots;
                if (!Array.isArray(dots) || !dots.length) {
                    if (typeof onComplete === 'function') onComplete();
                    return;
                }
                const order = buildSprinkleOrder(dots.length, startupSprinkleSeed);
                dots.forEach(dot => {
                    if (dot) dot.style.opacity = '0';
                });
                runtime.sprinkleDotsHidden = true;
                let revealed = 0;
                const tickCount = Math.max(1, Math.ceil(startupSprinkleMs / startupSprinkleStepMs));
                const batchSize = Math.max(1, Math.ceil(order.length / tickCount));
                const revealBatch = () => {
                    const next = Math.min(order.length, revealed + batchSize);
                    for (let i = revealed; i < next; i += 1) {
                        const dot = dots[order[i]];
                        if (dot) dot.style.opacity = '';
                    }
                    revealed = next;
                    if (revealed >= order.length) {
                        if (runtime.sprinkleTimerId) {
                            window.clearInterval(runtime.sprinkleTimerId);
                            runtime.sprinkleTimerId = 0;
                        }
                        runtime.sprinkleDotsHidden = false;
                        if (typeof onComplete === 'function') onComplete();
                    }
                };
                revealBatch();
                if (revealed < order.length) {
                    runtime.sprinkleTimerId = window.setInterval(revealBatch, startupSprinkleStepMs);
                }
            };
            const runStep = () => {
                runtime.currentColumn = (runtime.currentColumn + 1) % grid.width;
                advanceInitialReveal();
                const phase = getPhaseConfig();
                if (runtime.prevTrailingColumn >= 0 && runtime.prevTrailingOpacity > 0) {
                    const dissipateMs = syncTailFadeToLoad
                        ? Math.round(phase.loadMs * 1.12)
                        : Math.max(80, Math.round(Math.min(phase.stepMs, phase.loadMs)));
                    dissipateTrailingLine(runtime.prevTrailingColumn, runtime.prevTrailingOpacity, dissipateMs);
                }
                if (runtime.edgeRect) {
                    runtime.edgeRect.style.transition = 'none';
                    runtime.edgeRect.style.opacity = '0';
                }
                let nextTrailingColumn = -1;
                let nextTrailingOpacity = 0;
                runtime.lineRects.forEach((lineRect, lineIdx) => {
                    const columnX = (runtime.currentColumn - lineIdx + grid.width) % grid.width;
                    if (lineIdx >= phase.lineCount) {
                        lineRect.style.transition = 'none';
                        lineRect.setAttribute('x', String(columnX));
                        lineRect.setAttribute('y', '0');
                        lineRect.setAttribute('height', String(grid.height));
                        lineRect.style.opacity = '0';
                        return;
                    }
                    if (lineIdx === 0) {
                        const leadOpacity = forceLeadFullOpacity ? 1 : phase.maxOpacity;
                        revealLeadLine(lineRect, columnX, leadOpacity, phase.loadMs);
                        if (showLeadEdgeLine && runtime.edgeRect) {
                            const edgeOpacity = Math.max(0.3, Math.min(1, leadOpacity * 2.8));
                            runtime.edgeRect.setAttribute('x', (columnX + 0.95).toFixed(3));
                            runtime.edgeRect.setAttribute('y', '0');
                            runtime.edgeRect.setAttribute('height', String(grid.height));
                            runtime.edgeRect.style.opacity = edgeOpacity.toFixed(3);
                        }
                        return;
                    }
                    const landRatio = columnLandRatios[columnX] || 0;
                    const fadeExponent = oceanFadeExponent + ((landFadeExponent - oceanFadeExponent) * landRatio);
                    const baseTailWeight = (phase.lineCount - lineIdx) / phase.lineCount;
                    const tailWeight = Math.pow(Math.max(0, baseTailWeight), fadeExponent);
                    const opacity = phase.maxOpacity * tailWeight;
                    const tailFadeMs = syncTailFadeToLoad
                        ? phase.loadMs
                        : Math.max(80, Math.round(Math.min(phase.stepMs, phase.loadMs * 0.68)));
                    lineRect.style.transition = `opacity ${tailFadeMs}ms linear`;
                    lineRect.setAttribute('x', String(columnX));
                    lineRect.setAttribute('y', '0');
                    lineRect.setAttribute('height', String(grid.height));
                    lineRect.style.opacity = opacity.toFixed(3);
                    if (lineIdx === phase.lineCount - 1) {
                        nextTrailingColumn = columnX;
                        nextTrailingOpacity = opacity;
                    }
                });
                runtime.prevTrailingColumn = nextTrailingColumn;
                runtime.prevTrailingOpacity = nextTrailingOpacity;
            };
            mapColumnGlowRuntimes.set(map, runtime);
            if (useSprinkleStartup) {
                runStartupSprinkle(() => {
                    runtime.initialRevealActive = false;
                    if (frame) frame.dataset.mapGlowInitialRevealDone = 'true';
                    runStep();
                    runtime.timerId = window.setInterval(runStep, getPhaseConfig().stepMs);
                });
                return;
            }
            runStep();
            const initialStepMs = getPhaseConfig().stepMs;
            runtime.timerId = window.setInterval(runStep, initialStepMs);
        };
        const syncColumnGlowForMap = (map) => {
            startColumnGlow(map);
        };

        const applyMapSizeClass = (map) => {
            const width = map.getBoundingClientRect().width;
            map.classList.toggle('map--compact', width < 900);
            map.classList.toggle('map--tiny', width < 600);
            const frame = map.closest('.pipeline-map-frame');
            if (frame && width > 0) {
                ensureFrameTuningDefaults(frame);
                const rawViewBox = map.getAttribute('viewBox') || '0 0 181 89';
                const viewBoxParts = rawViewBox.trim().split(/\s+/);
                const viewWidth = Number(viewBoxParts[2]) || 181;
                const dotStepPx = width / viewWidth;
                const dotSize = clampNumber(frame.dataset.mapPointerDotSize, 3, 20, mapGlowTuningDefaults.dotSize);
                const pointerSizePx = Math.max(24, Math.min(64, dotStepPx * dotSize));
                frame.style.setProperty('--map-pointer-size', `${pointerSizePx.toFixed(1)}px`);
            }
        };

        if (typeof ResizeObserver === 'function') {
            const mapResizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => applyMapSizeClass(entry.target));
            });
            maps.forEach(map => {
                applyMapSizeClass(map);
                mapResizeObserver.observe(map);
            });
        } else {
            const onResize = () => maps.forEach(applyMapSizeClass);
            onResize();
            window.addEventListener('resize', onResize);
        }

        // Premium pointer highlight modes: trail prints or per-dot hover flash, RAF-throttled.
        const canUsePointerGlow = window.matchMedia('(hover: hover) and (pointer: fine)').matches
            && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (canUsePointerGlow) {
            const mapFrames = Array.from(
                new Set(
                    maps
                        .map(map => map.closest('.pipeline-map-frame'))
                        .filter(Boolean)
                )
            );
            mapFrames.forEach(frame => {
                ensureFrameTuningDefaults(frame);
                let trailLayer = frame.querySelector('.map-pointer-trail-layer');
                if (!trailLayer) {
                    trailLayer = document.createElement('span');
                    trailLayer.className = 'map-pointer-trail-layer';
                    trailLayer.setAttribute('aria-hidden', 'true');
                    frame.appendChild(trailLayer);
                }
                if (trailLayer.childElementCount === 0) {
                    for (let i = 0; i < 24; i += 1) {
                        const print = document.createElement('span');
                        print.className = 'map-pointer-print';
                        trailLayer.appendChild(print);
                    }
                }
                const trailPrints = Array.from(trailLayer.querySelectorAll('.map-pointer-print'));
                const trailPrintAnims = new Array(trailPrints.length).fill(null);
                let trailPrintCursor = 0;
                let rafId = 0;
                let targetX = 0;
                let targetY = 0;
                let lastPrintX = 0;
                let lastPrintY = 0;
                let lastPrintAt = 0;
                let lastFlashCellX = -999;
                let lastFlashCellY = -999;
                let lastFlashAt = 0;
                let isPointerInside = false;
                let hideTimer = 0;
                const dotFlashAnims = new Map();
                const dotFlashRuntimeVarResetTimers = new Map();
                const getPointerMode = () => (frame.dataset.mapPointerMode === 'flash' ? 'flash' : 'trail');
                const applyPointerMode = (mode) => {
                    const normalizedMode = mode === 'flash' ? 'flash' : 'trail';
                    frame.dataset.mapPointerMode = normalizedMode;
                    const isFlash = normalizedMode === 'flash';
                    frame.classList.toggle('map-pointer-mode-flash', isFlash);
                    if (isFlash) {
                        if (hideTimer) {
                            window.clearTimeout(hideTimer);
                            hideTimer = 0;
                        }
                        frame.classList.remove('has-pointer-glow');
                    }
                };
                pointerModeSetters.set(frame, applyPointerMode);
                applyPointerMode(frame.dataset.mapPointerMode);
                const renderPointerGlow = () => {
                    rafId = 0;
                    frame.style.setProperty('--map-pointer-x', `${targetX.toFixed(1)}px`);
                    frame.style.setProperty('--map-pointer-y', `${targetY.toFixed(1)}px`);
                };
                const emitTrailPrint = (x, y, force = false) => {
                    if (!trailPrints.length) return;
                    const now = performance.now();
                    const trailEase = clampNumber(frame.dataset.mapPointerEase, 0.05, 0.6, mapGlowTuningDefaults.easing);
                    const easeRatio = (trailEase - 0.05) / 0.55;
                    const pointerSizePx = clampNumber(
                        parseFloat(frame.style.getPropertyValue('--map-pointer-size')),
                        24,
                        64,
                        42
                    );
                    const minIntervalMs = Math.round(30 - (easeRatio * 14));
                    const minDistancePx = pointerSizePx * (0.18 + ((1 - easeRatio) * 0.16));
                    const movedDistance = Math.hypot(x - lastPrintX, y - lastPrintY);
                    if (!force && (now - lastPrintAt) < minIntervalMs && movedDistance < minDistancePx) return;

                    const activeOpacity = clampNumber(
                        parseFloat(frame.style.getPropertyValue('--map-pointer-active-opacity')),
                        0,
                        1,
                        mapGlowTuningDefaults.activeOpacity
                    );
                    const lingerMs = clampNumber(frame.dataset.mapPointerLinger, 0, 1500, mapGlowTuningDefaults.lingerMs);
                    const printDurationMs = Math.round(clampNumber(lingerMs * 2.4, 220, 2600, 560));
                    const printOpacity = (activeOpacity * (0.2 + (easeRatio * 0.18))).toFixed(3);
                    const printScaleFrom = (0.76 + (easeRatio * 0.14)).toFixed(3);
                    const printScaleMid = (0.93 + (easeRatio * 0.08)).toFixed(3);
                    const printScaleTo = (1.03 + (easeRatio * 0.06)).toFixed(3);
                    const baseTransform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;

                    const idx = trailPrintCursor;
                    const printNode = trailPrints[idx];
                    trailPrintCursor = (trailPrintCursor + 1) % trailPrints.length;

                    if (trailPrintAnims[idx]) {
                        trailPrintAnims[idx].cancel();
                        trailPrintAnims[idx] = null;
                    }

                    printNode.style.transform = `${baseTransform} scale(${printScaleFrom})`;
                    printNode.style.opacity = printOpacity;

                    if (typeof printNode.animate === 'function') {
                        const numericOpacity = Number(printOpacity);
                        const anim = printNode.animate(
                            [
                                { transform: `${baseTransform} scale(${printScaleFrom})`, opacity: numericOpacity },
                                { transform: `${baseTransform} scale(${printScaleMid})`, opacity: numericOpacity * 0.48, offset: 0.58 },
                                { transform: `${baseTransform} scale(${printScaleTo})`, opacity: 0 }
                            ],
                            {
                                duration: printDurationMs,
                                easing: 'cubic-bezier(0.18, 0.72, 0.24, 1)',
                                fill: 'forwards'
                            }
                        );
                        trailPrintAnims[idx] = anim;
                        anim.onfinish = () => {
                            if (trailPrintAnims[idx] === anim) {
                                trailPrintAnims[idx] = null;
                                printNode.style.opacity = '0';
                            }
                        };
                    } else {
                        window.requestAnimationFrame(() => {
                            printNode.style.opacity = '0';
                        });
                    }

                    lastPrintX = x;
                    lastPrintY = y;
                    lastPrintAt = now;
                };
                const clearFlashRuntimeVars = (dot) => {
                    dot.style.removeProperty('--map-dot-hover-flash-runtime-from');
                    dot.style.removeProperty('--map-dot-hover-flash-runtime-mid');
                    dot.style.removeProperty('--map-dot-hover-flash-runtime-to');
                    dot.style.removeProperty('--map-dot-hover-flash-runtime-filter-start');
                    dot.style.removeProperty('--map-dot-hover-flash-runtime-filter-mid');
                    dot.style.removeProperty('--map-dot-hover-flash-runtime-filter-end');
                };
                const flashDot = (dot, strength = 1, durationMsOverride = null, options = null) => {
                    if (!dot) return;
                    const runtimeResetTimer = dotFlashRuntimeVarResetTimers.get(dot);
                    if (runtimeResetTimer) {
                        window.clearTimeout(runtimeResetTimer);
                        dotFlashRuntimeVarResetTimers.delete(dot);
                    }
                    clearFlashRuntimeVars(dot);
                    const existingAnim = dotFlashAnims.get(dot);
                    if (existingAnim) {
                        existingAnim.cancel();
                        dotFlashAnims.delete(dot);
                    }
                    const cappedStrength = clampNumber(strength, 0.2, 1, 1);
                    const useOppositePalette = Boolean(options && options.useOppositePalette);
                    const suppressFilter = Boolean(options && options.suppressFilter);
                    const flashFrom = dot.style.getPropertyValue('--map-dot-hover-flash-from') || 'var(--map-dot-base-fill)';
                    const flashMidDefault = dot.style.getPropertyValue('--map-dot-hover-flash-mid') || flashFrom;
                    const flashToDefault = dot.style.getPropertyValue('--map-dot-hover-flash-to') || flashMidDefault;
                    const flashMidOpposite = dot.style.getPropertyValue('--map-dot-hover-flash-opposite-mid') || flashMidDefault;
                    const flashToOpposite = dot.style.getPropertyValue('--map-dot-hover-flash-opposite-to') || flashToDefault;
                    const flashMid = useOppositePalette ? flashMidOpposite : flashMidDefault;
                    const flashTo = useOppositePalette ? flashToOpposite : flashToDefault;
                    if (typeof dot.animate === 'function') {
                        const startInvert = clampNumber(0.55 + (cappedStrength * 0.45), 0, 1, 1);
                        const midInvert = clampNumber(0.16 + (cappedStrength * 0.2), 0, 1, 0.32);
                        const startBrightness = (1.05 + (cappedStrength * 0.24)).toFixed(3);
                        const midBrightness = (1.01 + (cappedStrength * 0.08)).toFixed(3);
                        const durationMs = Math.round(
                            Number.isFinite(Number(durationMsOverride))
                                ? clampNumber(durationMsOverride, mapFlashDurationBounds.min, mapFlashDurationBounds.max, mapFlashTuningDefaults.durationMs)
                                : (130 + ((1 - cappedStrength) * 110))
                        );
                        const flashKeyframes = suppressFilter
                            ? [
                                { fill: flashTo, filter: 'none' },
                                { fill: flashMid, filter: 'none', offset: 0.46 },
                                { fill: flashFrom, filter: 'none' }
                            ]
                            : [
                                { fill: flashTo, filter: `invert(${startInvert.toFixed(3)}) brightness(${startBrightness}) saturate(1.12)` },
                                { fill: flashMid, filter: `invert(${midInvert.toFixed(3)}) brightness(${midBrightness}) saturate(1.05)`, offset: 0.46 },
                                { fill: flashFrom, filter: 'none' }
                            ];
                        const flashAnim = dot.animate(
                            flashKeyframes,
                            {
                                duration: durationMs,
                                easing: 'cubic-bezier(0.2, 0.62, 0.3, 1)',
                                fill: 'none'
                            }
                        );
                        dotFlashAnims.set(dot, flashAnim);
                        flashAnim.onfinish = () => {
                            if (dotFlashAnims.get(dot) === flashAnim) {
                                dotFlashAnims.delete(dot);
                            }
                        };
                        flashAnim.oncancel = () => {
                            if (dotFlashAnims.get(dot) === flashAnim) {
                                dotFlashAnims.delete(dot);
                            }
                        };
                        return;
                    }

                    const fallbackDurationMs = Math.round(
                        Number.isFinite(Number(durationMsOverride))
                            ? clampNumber(durationMsOverride, mapFlashDurationBounds.min, mapFlashDurationBounds.max, mapFlashTuningDefaults.durationMs)
                            : (130 + ((1 - cappedStrength) * 110))
                    );
                    dot.style.setProperty('--map-dot-hover-flash-runtime-from', flashFrom);
                    dot.style.setProperty('--map-dot-hover-flash-runtime-mid', flashMid);
                    dot.style.setProperty('--map-dot-hover-flash-runtime-to', flashTo);
                    if (suppressFilter) {
                        dot.style.setProperty('--map-dot-hover-flash-runtime-filter-start', 'none');
                        dot.style.setProperty('--map-dot-hover-flash-runtime-filter-mid', 'none');
                        dot.style.setProperty('--map-dot-hover-flash-runtime-filter-end', 'none');
                    }
                    dot.style.setProperty('--map-dot-hover-flash-duration', `${fallbackDurationMs}ms`);
                    dot.classList.remove('map-dot--hover-flash');
                    // Force keyframe restart only for non-WAAPI fallback engines.
                    void dot.getBoundingClientRect();
                    dot.classList.add('map-dot--hover-flash');
                    const resetTimer = window.setTimeout(() => {
                        const activeTimer = dotFlashRuntimeVarResetTimers.get(dot);
                        if (activeTimer === resetTimer) {
                            dotFlashRuntimeVarResetTimers.delete(dot);
                            clearFlashRuntimeVars(dot);
                        }
                    }, fallbackDurationMs + 40);
                    dotFlashRuntimeVarResetTimers.set(dot, resetTimer);
                };
                const emitHoverFlash = (event, force = false) => {
                    const map = frameToMap.get(frame);
                    if (!map) return;
                    const grid = mapDotGrid.get(map);
                    if (!grid || !grid.width || !grid.height || !Array.isArray(grid.dots) || !grid.dots.length) return;

                    const rect = map.getBoundingClientRect();
                    if (rect.width <= 0 || rect.height <= 0) return;
                    const localX = event.clientX - rect.left;
                    const localY = event.clientY - rect.top;
                    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return;

                    const gridX = Math.floor((localX / rect.width) * grid.width);
                    const gridY = Math.floor((localY / rect.height) * grid.height);
                    if (!Number.isFinite(gridX) || !Number.isFinite(gridY)) return;

                    const now = performance.now();
                    const movedCells = Math.hypot(gridX - lastFlashCellX, gridY - lastFlashCellY);
                    const flashRadiusCells = clampNumber(frame.dataset.mapFlashRadiusCells, 0.5, 4, mapFlashTuningDefaults.radiusCells);
                    const flashDurationMs = clampNumber(frame.dataset.mapFlashDurationMs, mapFlashDurationBounds.min, mapFlashDurationBounds.max, mapFlashTuningDefaults.durationMs);
                    const flashIntensity = clampNumber(frame.dataset.mapFlashIntensity, 0.2, 1.6, mapFlashTuningDefaults.intensity);
                    const flashGridStep = clampNumber(frame.dataset.mapFlashGridStep, 0, 2, mapFlashTuningDefaults.gridStep);
                    const flashThrottleMs = clampNumber(frame.dataset.mapFlashThrottleMs, 0, 40, mapFlashTuningDefaults.throttleMs);
                    const flashCenterOnly = frame.dataset.mapFlashCenterOnly === 'true';
                    const flashCompactGlow = frame.dataset.mapFlashCompactGlow !== 'false';
                    if (!force && movedCells < flashGridStep && (now - lastFlashAt) < flashThrottleMs) return;

                    if (flashCenterOnly) {
                        if (!flashCompactGlow) {
                            Array.from(dotFlashAnims.entries()).forEach(([activeDot, activeAnim]) => {
                                activeAnim.cancel();
                                if (activeDot) {
                                    activeDot.style.filter = 'none';
                                    activeDot.classList.remove('map-dot--hover-flash');
                                }
                            });
                            dotFlashAnims.clear();
                        }
                        const centerDot = grid.dots[(gridY * grid.width) + gridX];
                        flashDot(centerDot, flashIntensity, flashDurationMs, { useOppositePalette: true, suppressFilter: true });
                        lastFlashCellX = gridX;
                        lastFlashCellY = gridY;
                        lastFlashAt = now;
                        return;
                    }

                    const radiusInt = Math.max(1, Math.ceil(flashRadiusCells));
                    for (let offsetY = -radiusInt; offsetY <= radiusInt; offsetY += 1) {
                        for (let offsetX = -radiusInt; offsetX <= radiusInt; offsetX += 1) {
                            const distance = Math.hypot(offsetX, offsetY);
                            if (distance > flashRadiusCells) continue;
                            const x = gridX + offsetX;
                            const y = gridY + offsetY;
                            if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) continue;
                            const ringFalloff = Math.max(0, 1 - (distance / (flashRadiusCells + 0.001)));
                            const strength = clampNumber((0.22 + (ringFalloff * 0.78)) * flashIntensity, 0.15, 1.4, 1);
                            const dot = grid.dots[(y * grid.width) + x];
                            flashDot(dot, strength, flashDurationMs);
                        }
                    }
                    lastFlashCellX = gridX;
                    lastFlashCellY = gridY;
                    lastFlashAt = now;
                };
                const queuePointerGlow = (event) => {
                    const frameRect = frame.getBoundingClientRect();
                    targetX = event.clientX - frameRect.left;
                    targetY = event.clientY - frameRect.top;
                    if (getPointerMode() === 'flash') {
                        emitHoverFlash(event);
                        frame.classList.remove('has-pointer-glow');
                        return;
                    }
                    emitTrailPrint(targetX, targetY);
                    if (!rafId) rafId = window.requestAnimationFrame(renderPointerGlow);
                };
                frame.addEventListener('pointerenter', (event) => {
                    if (hideTimer) {
                        window.clearTimeout(hideTimer);
                        hideTimer = 0;
                    }
                    isPointerInside = true;
                    const frameRect = frame.getBoundingClientRect();
                    targetX = event.clientX - frameRect.left;
                    targetY = event.clientY - frameRect.top;
                    if (getPointerMode() === 'flash') {
                        frame.classList.remove('has-pointer-glow');
                        emitHoverFlash(event, true);
                        return;
                    }
                    frame.classList.add('has-pointer-glow');
                    lastPrintX = targetX;
                    lastPrintY = targetY;
                    lastPrintAt = performance.now();
                    emitTrailPrint(targetX, targetY, true);
                    queuePointerGlow(event);
                });
                frame.addEventListener('pointermove', queuePointerGlow);
                frame.addEventListener('pointerleave', () => {
                    isPointerInside = false;
                    if (hideTimer) window.clearTimeout(hideTimer);
                    if (getPointerMode() === 'flash') {
                        frame.classList.remove('has-pointer-glow');
                        return;
                    }
                    const lingerMs = clampNumber(frame.dataset.mapPointerLinger, 0, 1500, mapGlowTuningDefaults.lingerMs);
                    hideTimer = window.setTimeout(() => {
                        frame.classList.remove('has-pointer-glow');
                    }, lingerMs);
                    if (!rafId) rafId = window.requestAnimationFrame(renderPointerGlow);
                });
            });
        }

        const createDot = (x, y, isLand, radius, overrideStyle, gridX, gridY) => {
            const overrideBlinkModes = ['rapid', 'slow', 'fade'];
            const blinkDurationByMode = {
                rapid: 1.2,
                slow: 2.8,
                fade: 3.4,
                glow: 3.4,
                blend: 3.4
            };
            const baseFill = isLand ? 'var(--map-dot-land)' : 'var(--map-dot-water)';
            const flashAccentWater = 'color-mix(in srgb, #38bdf8 62%, #ffffff)';
            const flashAccentLand = 'color-mix(in srgb, #f59e0b 62%, #ffffff)';
            const resolveBlinkMode = (blinkValue) => {
                if (!blinkValue) return '';
                if (blinkValue === 'random') {
                    const idx = Math.floor(Math.random() * overrideBlinkModes.length);
                    return overrideBlinkModes[idx];
                }
                return blinkValue;
            };
            const resolveAsyncBlinkDelay = (blinkMode, xIdx, yIdx) => {
                const duration = blinkDurationByMode[blinkMode];
                if (!duration) return 0;
                const seed = ((xIdx + 1) * 73856093) ^ ((yIdx + 1) * 19349663);
                const normalized = Math.abs(Math.sin(seed * 0.0001) * 10000) % 1;
                return normalized * duration;
            };
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x);
            dot.setAttribute('cy', y);
            dot.setAttribute('r', radius);
            dot.style.setProperty('--map-dot-base-fill', baseFill);
            let flashFrom = baseFill;
            let flashMid = isLand ? 'color-mix(in srgb, var(--map-dot-land) 72%, #ffffff)' : 'color-mix(in srgb, var(--map-dot-water) 72%, #ffffff)';
            let flashTo = isLand ? flashAccentLand : flashAccentWater;
            const flashMidOpposite = isLand ? 'var(--map-dot-water)' : 'var(--map-dot-land)';
            const flashToOpposite = flashMidOpposite;
            const classes = ['map-dot'];
            if (isLand) classes.push('is-land');
            if (overrideStyle) {
                const hasColor = Boolean(overrideStyle.color);
                const hasColor2 = Boolean(overrideStyle.color2);
                const hasBlink = Boolean(overrideStyle.blink);
                if (hasColor) {
                    classes.push('map-dot--override');
                    dot.style.fill = overrideStyle.color;
                    flashFrom = overrideStyle.color;
                    flashMid = hasColor2 ? overrideStyle.color : `color-mix(in srgb, ${overrideStyle.color} 76%, #ffffff)`;
                    flashTo = hasColor2 ? overrideStyle.color2 : `color-mix(in srgb, ${overrideStyle.color} 58%, #ffffff)`;
                }
                if (!hasColor && hasColor2) {
                    flashMid = `color-mix(in srgb, ${baseFill} 70%, ${overrideStyle.color2})`;
                    flashTo = overrideStyle.color2;
                }
                if (hasBlink) {
                    const resolvedBlinkMode = resolveBlinkMode(overrideStyle.blink);
                    if (resolvedBlinkMode) {
                        if ((resolvedBlinkMode === 'glow' || resolvedBlinkMode === 'blend') && hasColor) {
                            const glowFrom = hasColor2 ? overrideStyle.color : baseFill;
                            const glowTo = hasColor2 ? overrideStyle.color2 : overrideStyle.color;
                            dot.style.setProperty('--map-dot-glow-from', glowFrom);
                            dot.style.setProperty('--map-dot-glow-to', glowTo);
                            classes.push(`map-dot--blink-${resolvedBlinkMode}`);
                        } else if (resolvedBlinkMode === 'glow' || resolvedBlinkMode === 'blend') {
                            if (hasColor2) {
                                dot.style.setProperty('--map-dot-glow-from', baseFill);
                                dot.style.setProperty('--map-dot-glow-to', overrideStyle.color2);
                                classes.push(`map-dot--blink-${resolvedBlinkMode}`);
                            } else {
                                classes.push('map-dot--blink-fade');
                            }
                        } else {
                            classes.push(`map-dot--blink-${resolvedBlinkMode}`);
                        }
                        const phaseMode = overrideStyle.phase || 'sync';
                        if (phaseMode === 'async') {
                            const delaySec = resolveAsyncBlinkDelay(resolvedBlinkMode, gridX, gridY);
                            dot.style.setProperty('--map-dot-blink-delay', `-${delaySec.toFixed(3)}s`);
                        }
                    }
                }
            }
            dot.style.setProperty('--map-dot-hover-flash-from', flashFrom);
            dot.style.setProperty('--map-dot-hover-flash-mid', flashMid);
            dot.style.setProperty('--map-dot-hover-flash-to', flashTo);
            dot.style.setProperty('--map-dot-hover-flash-opposite-mid', flashMidOpposite);
            dot.style.setProperty('--map-dot-hover-flash-opposite-to', flashToOpposite);
            dot.setAttribute('class', classes.join(' '));
            return dot;
        };

        const renderDots = (map, width, height, resolveDotState) => {
            const dotGroup = map.querySelector('[data-dot-grid]');
            if (!dotGroup) return;

            map.setAttribute('viewBox', `0 0 ${width} ${height}`);
            const ocean = map.querySelector('.map-ocean');
            if (ocean) {
                ocean.setAttribute('width', width);
                ocean.setAttribute('height', height);
            }

            dotGroup.innerHTML = '';
            const radius = 0.42;
            const dots = new Array(width * height);
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    const dotState = resolveDotState(x, y);
                    const isLand = typeof dotState === 'object' ? !!dotState.isLand : !!dotState;
                    const overrideStyle = typeof dotState === 'object' ? (dotState.overrideStyle || null) : null;
                    const dot = createDot(x + 0.5, y + 0.5, isLand, radius, overrideStyle, x, y);
                    dotGroup.appendChild(dot);
                    dots[(y * width) + x] = dot;
                }
            }
            mapDotGrid.set(map, { width, height, dots });
            syncColumnGlowForMap(map);
        };

        const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const resolveMdControls = (map) => {
            const frame = map.closest('.pipeline-map-frame');
            const sibling = frame ? frame.previousElementSibling : null;
            if (sibling && sibling.getAttribute('data-map-controls') === 'md') return sibling;
            return document.querySelector('[data-map-controls="md"]');
        };
        const applyMdToggleData = (toggleGroups, map, controls) => {
            if (!map || !controls) return;
            controls.innerHTML = '';
            const mapShell = controls.closest('.pipeline-map');
            const frame = map.closest('.pipeline-map-frame');
            if (mapShell) {
                let helper = mapShell.querySelector('.map-controls-helper');
                if (!helper) {
                    helper = document.createElement('p');
                    helper.className = 'map-controls-helper';
                    if (frame && frame.parentNode === mapShell) {
                        mapShell.insertBefore(helper, frame);
                    } else {
                        mapShell.appendChild(helper);
                    }
                }
                helper.textContent = 'Click a category to toggle map markers. You can leave multiple categories on at once.';
            }
            let testsDock = mapShell ? mapShell.querySelector('[data-map-tests]') : null;
            if (!testsDock && mapShell) {
                testsDock = document.createElement('div');
                testsDock.className = 'pipeline-map-tests';
                testsDock.setAttribute('data-map-tests', 'true');
                mapShell.insertBefore(testsDock, controls);
            }
            if (testsDock) {
                testsDock.innerHTML = '';
                testsDock.hidden = !mapTestsVisible;
                testsDock.setAttribute('aria-hidden', mapTestsVisible ? 'false' : 'true');
                testsDock.style.display = mapTestsVisible ? '' : 'none';
            }

            map.querySelectorAll('.map-overlay').forEach(node => node.remove());
            const overlayFragment = document.createDocumentFragment();
            toggleGroups.forEach(toggleGroup => {
                const representativeColor = (toggleGroup.markers[0] && toggleGroup.markers[0].color) || 'var(--map-accent)';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'map-control';
                btn.setAttribute('data-map-target', toggleGroup.targetClass);
                btn.setAttribute('aria-pressed', 'false');
                btn.style.setProperty('--map-control-color', representativeColor);
                btn.textContent = toggleGroup.buttonLabel;
                controls.appendChild(btn);
                const categoryDescription = document.createElement('p');
                categoryDescription.className = 'map-category-description';
                categoryDescription.setAttribute('data-map-description-target', toggleGroup.targetClass);
                categoryDescription.style.setProperty('--map-description-color', representativeColor);
                categoryDescription.textContent = toggleGroup.description || 'No category description set in world-map.md.';
                controls.appendChild(categoryDescription);

                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.setAttribute('class', `map-overlay ${toggleGroup.targetClass}`);

                toggleGroup.markers.forEach(marker => {
                    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    markerGroup.setAttribute('class', 'map-marker');
                    if (marker.shape === 'square') {
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', marker.x - marker.size);
                        rect.setAttribute('y', marker.y - marker.size);
                        rect.setAttribute('width', marker.size * 2);
                        rect.setAttribute('height', marker.size * 2);
                        rect.setAttribute('rx', Math.max(1, marker.size * 0.35));
                        rect.style.fill = marker.color;
                        markerGroup.appendChild(rect);
                    } else {
                        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('cx', marker.x);
                        circle.setAttribute('cy', marker.y);
                        circle.setAttribute('r', marker.size);
                        circle.style.fill = marker.color;
                        markerGroup.appendChild(circle);
                    }

                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', marker.x + (marker.size * 2));
                    label.setAttribute('y', marker.y + (marker.size * 1.8));
                    label.textContent = marker.label;
                    markerGroup.appendChild(label);
                    group.appendChild(markerGroup);
                });
                overlayFragment.appendChild(group);
            });
            map.appendChild(overlayFragment);

            if (frame) {
                ensureFrameTuningDefaults(frame);
                const setPointerMode = pointerModeSetters.get(frame);
                if (typeof setPointerMode === 'function') setPointerMode('flash');

                const tuningStrip = document.createElement('div');
                tuningStrip.className = 'map-tuning-strip';
                tuningStrip.setAttribute('role', 'group');
                tuningStrip.setAttribute('aria-label', 'Map glow tuning');
                const tuningInputs = {};
                let syncEffectReadouts = () => {};
                const flashTuningGroup = document.createElement('div');
                flashTuningGroup.className = 'map-tuning-group map-tuning-group--flash';
                tuningStrip.appendChild(flashTuningGroup);
                const createTuningField = (id, labelText, inputValue, onInput, groupNode, step = 'any') => {
                    const field = document.createElement('div');
                    field.className = 'map-tuning-field';
                    const label = document.createElement('label');
                    label.className = 'map-tuning-label';
                    label.setAttribute('for', id);
                    label.textContent = labelText;
                    const input = document.createElement('input');
                    input.className = 'map-tuning-input';
                    input.id = id;
                    input.type = 'text';
                    input.inputMode = 'decimal';
                    input.autocomplete = 'off';
                    input.spellcheck = false;
                    input.value = inputValue;
                    input.setAttribute('data-step', step);
                    input.addEventListener('change', () => {
                        onInput(input.value, input);
                        syncEffectReadouts();
                    });
                    input.addEventListener('blur', () => {
                        onInput(input.value, input);
                        syncEffectReadouts();
                    });
                    field.appendChild(label);
                    field.appendChild(input);
                    groupNode.appendChild(field);
                    tuningInputs[id] = input;
                    return input;
                };
                const flashDurationButtons = [];
                const flashVisualButtons = [];
                const sweepActionButtons = [];
                const startupModeButtons = [];
                const flashDurationRow = document.createElement('div');
                flashDurationRow.className = 'map-flash-presets map-flash-presets--duration';
                const flashVisualRow = document.createElement('div');
                flashVisualRow.className = 'map-flash-presets map-flash-presets--visual';
                const startupModeRow = document.createElement('div');
                startupModeRow.className = 'map-flash-presets map-flash-presets--visual';
                const startupGlowControlsRow = document.createElement('div');
                startupGlowControlsRow.className = 'map-flash-presets map-flash-presets--glow-controls';
                const startupSprinkleControlsRow = document.createElement('div');
                startupSprinkleControlsRow.className = 'map-flash-presets map-flash-presets--glow-controls';
                const runtimeGlowControlsRow = document.createElement('div');
                runtimeGlowControlsRow.className = 'map-flash-presets map-flash-presets--glow-controls';
                const setFlashDurationMs = (rawValue, input = null) => {
                    const nextValue = Math.round(clampNumber(
                        rawValue,
                        mapFlashDurationBounds.min,
                        mapFlashDurationBounds.max,
                        mapFlashTuningDefaults.durationMs
                    ));
                    frame.dataset.mapFlashDurationMs = String(nextValue);
                    if (input) input.value = String(nextValue);
                    syncEffectReadouts();
                };
                const syncFlashDurationControls = () => {
                    const activeDuration = Math.round(clampNumber(
                        frame.dataset.mapFlashDurationMs,
                        mapFlashDurationBounds.min,
                        mapFlashDurationBounds.max,
                        mapFlashTuningDefaults.durationMs
                    ));
                    frame.dataset.mapFlashDurationMs = String(activeDuration);
                    if (tuningInputs.mapTuneFlashLinger) {
                        tuningInputs.mapTuneFlashLinger.value = String(activeDuration);
                    }
                    flashDurationButtons.forEach(({ value, button }) => {
                        const isActive = value === activeDuration;
                        button.classList.toggle('is-active', isActive);
                        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                    syncEffectReadouts();
                };
                const syncFlashVisualButtons = () => {
                    flashVisualButtons.forEach(({ mode, button }) => {
                        const isActive = mode === 'compactGlow'
                            ? frame.dataset.mapFlashCompactGlow !== 'false'
                            : false;
                        button.classList.toggle('is-active', isActive);
                        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                    syncEffectReadouts();
                };
                const syncSweepActionButtons = () => {
                    sweepActionButtons.forEach(({ mode, button }) => {
                        const isActive = mode === 'sweepEnabled'
                            ? frame.dataset.mapGlowEnabled !== 'false'
                            : (mode === 'tailLoadSync'
                            ? frame.dataset.mapGlowTailLoadSync === 'true'
                            : (mode === 'leadFull'
                                ? frame.dataset.mapGlowLeadFull === 'true'
                                : (mode === 'leadEdgeLine'
                                    ? frame.dataset.mapGlowLeadEdgeLine === 'true'
                                    : false)));
                        button.classList.toggle('is-active', isActive);
                        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                    syncEffectReadouts();
                };
                const syncStartupModeButtons = () => {
                    startupModeButtons.forEach(({ mode, button }) => {
                        const activeMode = frame.dataset.mapGlowStartupMode === 'sprinkle' ? 'sprinkle' : 'sweep';
                        const isActive = mode === activeMode;
                        button.classList.toggle('is-active', isActive);
                        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                    syncEffectReadouts();
                };
                const effectsReadout = document.createElement('div');
                effectsReadout.className = 'map-effects-readout';
                const glowTailReadout = document.createElement('p');
                glowTailReadout.className = 'map-effect-line';
                const flashReadout = document.createElement('p');
                flashReadout.className = 'map-effect-line';
                const sweepReadout = document.createElement('p');
                sweepReadout.className = 'map-effect-line';
                const startupReadout = document.createElement('p');
                startupReadout.className = 'map-effect-line';
                effectsReadout.appendChild(glowTailReadout);
                effectsReadout.appendChild(flashReadout);
                effectsReadout.appendChild(sweepReadout);
                effectsReadout.appendChild(startupReadout);
                const applyEffectTier = (node, tier) => {
                    node.classList.remove('map-effect-line--low', 'map-effect-line--medium', 'map-effect-line--high');
                    node.classList.add(`map-effect-line--${tier}`);
                };
                const calcSweepStats = (activeLinesRaw, speedMsRaw, loadMsRaw, defaults) => {
                    const activeLines = Math.round(clampNumber(
                        activeLinesRaw,
                        1,
                        24,
                        defaults.activeLines
                    ));
                    const speedMs = Math.round(clampNumber(
                        speedMsRaw,
                        8,
                        1200,
                        defaults.speedMs
                    ));
                    const loadMs = Math.round(clampNumber(
                        loadMsRaw,
                        20,
                        600,
                        defaults.loadMs
                    ));
                    const effectiveStepMs = Math.max(speedMs, loadMs);
                    const updatesPerSec = 1000 / Math.max(1, effectiveStepMs);
                    const lineUpdatesPerSec = activeLines * updatesPerSec;
                    const domWritesPerSec = lineUpdatesPerSec * 2;
                    const baselineStepMs = Math.max(defaults.speedMs, defaults.loadMs);
                    const baselineLineUpdatesPerSec = defaults.activeLines * (1000 / baselineStepMs);
                    const relativeLoad = lineUpdatesPerSec / baselineLineUpdatesPerSec;
                    const tier = lineUpdatesPerSec >= 80 ? 'high' : (lineUpdatesPerSec >= 35 ? 'medium' : 'low');
                    return { activeLines, speedMs, loadMs, effectiveStepMs, lineUpdatesPerSec, domWritesPerSec, relativeLoad, tier };
                };
                syncEffectReadouts = () => {
                    const flashDurationMs = Math.round(clampNumber(
                        frame.dataset.mapFlashDurationMs,
                        mapFlashDurationBounds.min,
                        mapFlashDurationBounds.max,
                        mapFlashTuningDefaults.durationMs
                    ));
                    const flashThrottleMs = Math.round(clampNumber(
                        frame.dataset.mapFlashThrottleMs,
                        0,
                        40,
                        mapFlashTuningDefaults.throttleMs
                    ));
                    const compactGlow = frame.dataset.mapFlashCompactGlow !== 'false';
                    const flashEventsPerSec = 1000 / Math.max(1, flashThrottleMs);
                    const glowTailOverlap = compactGlow
                        ? Math.max(1, flashDurationMs / Math.max(1, flashThrottleMs))
                        : 0;
                    const glowTailTier = glowTailOverlap >= 18 ? 'high' : (glowTailOverlap >= 8 ? 'medium' : 'low');
                    applyEffectTier(glowTailReadout, glowTailTier);
                    glowTailReadout.textContent = compactGlow
                        ? `Glow Tail (on): ~${glowTailOverlap.toFixed(1)} overlapping fades at max hover rate.`
                        : 'Glow Tail (off): single-dot flash only (no overlap trail).';

                    const flashConcurrency = compactGlow ? glowTailOverlap : 1;
                    const flashTier = flashConcurrency >= 18 ? 'high' : (flashConcurrency >= 8 ? 'medium' : 'low');
                    applyEffectTier(flashReadout, flashTier);
                    flashReadout.textContent = `Flash Compact: ${flashEventsPerSec.toFixed(1)} max events/s, linger ${flashDurationMs}ms.`;

                    const sweepStats = calcSweepStats(
                        frame.dataset.mapGlowActiveLines,
                        frame.dataset.mapGlowSpeedMs,
                        frame.dataset.mapGlowLoadMs,
                        {
                            activeLines: mapColumnGlowDefaults.activeLines,
                            speedMs: mapColumnGlowDefaults.speedMs,
                            loadMs: mapColumnGlowDefaults.loadMs
                        }
                    );
                    const tailLoadSync = frame.dataset.mapGlowTailLoadSync === 'true';
                    const leadFull = frame.dataset.mapGlowLeadFull === 'true';
                    const leadEdgeLine = frame.dataset.mapGlowLeadEdgeLine === 'true';
                    const sweepEnabled = frame.dataset.mapGlowEnabled !== 'false';
                    applyEffectTier(sweepReadout, sweepStats.tier);
                    sweepReadout.textContent = sweepEnabled
                        ? `Sweep: ${sweepStats.lineUpdatesPerSec.toFixed(1)} line updates/s, ${sweepStats.domWritesPerSec.toFixed(1)} DOM writes/s (${sweepStats.relativeLoad.toFixed(2)}x default), effective step ${sweepStats.effectiveStepMs}ms, tail-load-sync ${tailLoadSync ? 'on' : 'off'}, lead-full ${leadFull ? 'on' : 'off'}, edge-line ${leadEdgeLine ? 'on' : 'off'}.`
                        : `Sweep: disabled in test mode (settings retained), tail-load-sync ${tailLoadSync ? 'on' : 'off'}, lead-full ${leadFull ? 'on' : 'off'}, edge-line ${leadEdgeLine ? 'on' : 'off'}.`;

                    const grid = mapDotGrid.get(map);
                    const startupColumns = grid && Number.isFinite(grid.width) && grid.width > 0 ? grid.width : 0;
                    const startupDone = frame.dataset.mapGlowInitialRevealDone === 'true';
                    const startupMode = frame.dataset.mapGlowStartupMode === 'sprinkle' ? 'sprinkle' : 'sweep';
                    if (startupMode === 'sprinkle') {
                        const sprinkleMs = Math.round(clampNumber(
                            frame.dataset.mapGlowSprinkleMs,
                            200,
                            12000,
                            mapStartupSprinkleDefaults.durationMs
                        ));
                        const sprinkleStepMs = Math.round(clampNumber(
                            frame.dataset.mapGlowSprinkleStepMs,
                            8,
                            250,
                            mapStartupSprinkleDefaults.stepMs
                        ));
                        const sprinkleSeed = Math.round(clampNumber(
                            frame.dataset.mapGlowSprinkleSeed,
                            1,
                            999999,
                            mapStartupSprinkleDefaults.seed
                        ));
                        const totalDots = grid && Array.isArray(grid.dots) ? grid.dots.length : 0;
                        const sprinkleTicks = Math.max(1, Math.ceil(sprinkleMs / sprinkleStepMs));
                        const sprinkleBatch = Math.max(1, Math.ceil(Math.max(1, totalDots) / sprinkleTicks));
                        const sprinkleDotsPerSec = sprinkleBatch * (1000 / Math.max(1, sprinkleStepMs));
                        const sprinkleTier = sprinkleDotsPerSec >= 12000 ? 'high' : (sprinkleDotsPerSec >= 5000 ? 'medium' : 'low');
                        applyEffectTier(startupReadout, sprinkleTier);
                        startupReadout.textContent = `Startup Sprinkle (${startupDone ? 'completed' : 'pending'}): ${sprinkleStepMs}ms step, ~${sprinkleBatch} dots/step, seed ${sprinkleSeed}, ~${(sprinkleMs / 1000).toFixed(1)}s target.`;
                    } else {
                        const startupStats = calcSweepStats(
                            frame.dataset.mapGlowStartupActiveLines,
                            frame.dataset.mapGlowStartupSpeedMs,
                            frame.dataset.mapGlowStartupLoadMs,
                            {
                                activeLines: mapColumnGlowDefaults.startupActiveLines,
                                speedMs: mapColumnGlowDefaults.startupSpeedMs,
                                loadMs: mapColumnGlowDefaults.startupLoadMs
                            }
                        );
                        const startupDurationMs = startupColumns * startupStats.effectiveStepMs;
                        applyEffectTier(startupReadout, startupStats.tier);
                        startupReadout.textContent = `Startup Sweep (${startupDone ? 'completed' : 'pending'}): ${startupStats.activeLines} lines, speed ${startupStats.speedMs}ms / load ${startupStats.loadMs}ms (effective ${startupStats.effectiveStepMs}ms), ${startupStats.lineUpdatesPerSec.toFixed(1)} updates/s, ~${(startupDurationMs / 1000).toFixed(1)}s first pass.`;
                    }
                };
                const flashVisualLabel = document.createElement('span');
                flashVisualLabel.className = 'map-tuning-label map-tuning-label--group';
                flashVisualLabel.textContent = 'Flash Tail Tests';
                flashTuningGroup.appendChild(flashVisualLabel);
                const addFlashVisualToggle = (mode, label, onToggle) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'map-control map-control--flash-visual';
                    btn.setAttribute('aria-pressed', 'false');
                    btn.textContent = label;
                    btn.addEventListener('click', () => {
                        onToggle();
                        syncFlashVisualButtons();
                        syncEffectReadouts();
                    });
                    flashVisualRow.appendChild(btn);
                    flashVisualButtons.push({ mode, button: btn });
                };
                addFlashVisualToggle('compactGlow', 'Glow Tail', () => {
                    const isActive = frame.dataset.mapFlashCompactGlow !== 'false';
                    frame.dataset.mapFlashCompactGlow = isActive ? 'false' : 'true';
                });
                flashTuningGroup.appendChild(flashVisualRow);

                const lingerLabel = document.createElement('span');
                lingerLabel.className = 'map-tuning-label map-tuning-label--group';
                lingerLabel.textContent = 'Linger Tests';
                flashTuningGroup.appendChild(lingerLabel);
                mapFlashDurationTestValues.forEach((durationMs) => {
                    const durationBtn = document.createElement('button');
                    durationBtn.type = 'button';
                    durationBtn.className = 'map-control map-control--flash-duration';
                    durationBtn.setAttribute('aria-pressed', 'false');
                    durationBtn.textContent = `Linger ${durationMs}`;
                    durationBtn.addEventListener('click', () => {
                        setFlashDurationMs(durationMs);
                        syncFlashDurationControls();
                    });
                    flashDurationRow.appendChild(durationBtn);
                    flashDurationButtons.push({ value: durationMs, button: durationBtn });
                });
                flashTuningGroup.appendChild(flashDurationRow);
                createTuningField(
                    'mapTuneFlashLinger',
                    'Lingering Ms',
                    frame.dataset.mapFlashDurationMs || String(mapFlashTuningDefaults.durationMs),
                    (rawValue, input) => {
                        setFlashDurationMs(rawValue, input);
                        syncFlashDurationControls();
                    },
                    flashTuningGroup,
                    '1'
                );

                const sweepActionsLabel = document.createElement('span');
                sweepActionsLabel.className = 'map-tuning-label map-tuning-label--group';
                sweepActionsLabel.textContent = 'Sweep Actions';
                flashTuningGroup.appendChild(sweepActionsLabel);
                const sweepActionsRow = document.createElement('div');
                sweepActionsRow.className = 'map-flash-presets map-flash-presets--visual';
                const resetSweepBtn = document.createElement('button');
                resetSweepBtn.type = 'button';
                resetSweepBtn.className = 'map-control map-control--flash-visual';
                resetSweepBtn.textContent = 'Reset Sweep';
                resetSweepBtn.addEventListener('click', () => {
                    frame.dataset.mapGlowInitialRevealDone = 'false';
                    syncColumnGlowForMap(map);
                    syncEffectReadouts();
                });
                sweepActionsRow.appendChild(resetSweepBtn);
                const sweepEnabledBtn = document.createElement('button');
                sweepEnabledBtn.type = 'button';
                sweepEnabledBtn.className = 'map-control map-control--flash-visual';
                sweepEnabledBtn.setAttribute('aria-pressed', 'false');
                sweepEnabledBtn.textContent = 'Sweep On';
                sweepEnabledBtn.addEventListener('click', () => {
                    const isActive = frame.dataset.mapGlowEnabled !== 'false';
                    frame.dataset.mapGlowEnabled = isActive ? 'false' : 'true';
                    syncColumnGlowForMap(map);
                    syncSweepActionButtons();
                });
                sweepActionsRow.appendChild(sweepEnabledBtn);
                sweepActionButtons.push({ mode: 'sweepEnabled', button: sweepEnabledBtn });
                const syncTailLoadBtn = document.createElement('button');
                syncTailLoadBtn.type = 'button';
                syncTailLoadBtn.className = 'map-control map-control--flash-visual';
                syncTailLoadBtn.setAttribute('aria-pressed', 'false');
                syncTailLoadBtn.textContent = 'Tail = Load';
                syncTailLoadBtn.addEventListener('click', () => {
                    const isActive = frame.dataset.mapGlowTailLoadSync === 'true';
                    frame.dataset.mapGlowTailLoadSync = isActive ? 'false' : 'true';
                    syncColumnGlowForMap(map);
                    syncSweepActionButtons();
                });
                sweepActionsRow.appendChild(syncTailLoadBtn);
                sweepActionButtons.push({ mode: 'tailLoadSync', button: syncTailLoadBtn });
                const leadFullBtn = document.createElement('button');
                leadFullBtn.type = 'button';
                leadFullBtn.className = 'map-control map-control--flash-visual';
                leadFullBtn.setAttribute('aria-pressed', 'false');
                leadFullBtn.textContent = 'Lead Full';
                leadFullBtn.addEventListener('click', () => {
                    const isActive = frame.dataset.mapGlowLeadFull === 'true';
                    frame.dataset.mapGlowLeadFull = isActive ? 'false' : 'true';
                    syncColumnGlowForMap(map);
                    syncSweepActionButtons();
                });
                sweepActionsRow.appendChild(leadFullBtn);
                sweepActionButtons.push({ mode: 'leadFull', button: leadFullBtn });
                const leadEdgeLineBtn = document.createElement('button');
                leadEdgeLineBtn.type = 'button';
                leadEdgeLineBtn.className = 'map-control map-control--flash-visual';
                leadEdgeLineBtn.setAttribute('aria-pressed', 'false');
                leadEdgeLineBtn.textContent = 'Edge Line';
                leadEdgeLineBtn.addEventListener('click', () => {
                    const isActive = frame.dataset.mapGlowLeadEdgeLine === 'true';
                    frame.dataset.mapGlowLeadEdgeLine = isActive ? 'false' : 'true';
                    syncColumnGlowForMap(map);
                    syncSweepActionButtons();
                });
                sweepActionsRow.appendChild(leadEdgeLineBtn);
                sweepActionButtons.push({ mode: 'leadEdgeLine', button: leadEdgeLineBtn });
                flashTuningGroup.appendChild(sweepActionsRow);

                const startupSweepLabel = document.createElement('span');
                startupSweepLabel.className = 'map-tuning-label map-tuning-label--group';
                startupSweepLabel.textContent = 'Startup Mode';
                flashTuningGroup.appendChild(startupSweepLabel);
                const addStartupModeToggle = (mode, label) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'map-control map-control--flash-visual';
                    btn.setAttribute('aria-pressed', 'false');
                    btn.textContent = label;
                    btn.addEventListener('click', () => {
                        frame.dataset.mapGlowStartupMode = mode;
                        frame.dataset.mapGlowInitialRevealDone = 'false';
                        syncColumnGlowForMap(map);
                        syncStartupModeButtons();
                    });
                    startupModeRow.appendChild(btn);
                    startupModeButtons.push({ mode, button: btn });
                };
                addStartupModeToggle('sweep', 'Startup Sweep');
                addStartupModeToggle('sprinkle', 'Startup Sprinkle');
                flashTuningGroup.appendChild(startupModeRow);

                const startupSprinkleLabel = document.createElement('span');
                startupSprinkleLabel.className = 'map-tuning-label map-tuning-label--group';
                startupSprinkleLabel.textContent = 'Startup Sprinkle Tests';
                flashTuningGroup.appendChild(startupSprinkleLabel);
                createTuningField(
                    'mapTuneGlowSprinkleMs',
                    'Sprinkle Ms',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowSprinkleMs,
                        200,
                        12000,
                        mapStartupSprinkleDefaults.durationMs
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 200, 12000, mapStartupSprinkleDefaults.durationMs));
                        frame.dataset.mapGlowSprinkleMs = String(nextValue);
                        input.value = String(nextValue);
                        if (frame.dataset.mapGlowStartupMode === 'sprinkle') {
                            frame.dataset.mapGlowInitialRevealDone = 'false';
                        }
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupSprinkleControlsRow,
                    '1'
                );
                createTuningField(
                    'mapTuneGlowSprinkleStep',
                    'Step Ms',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowSprinkleStepMs,
                        8,
                        250,
                        mapStartupSprinkleDefaults.stepMs
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 8, 250, mapStartupSprinkleDefaults.stepMs));
                        frame.dataset.mapGlowSprinkleStepMs = String(nextValue);
                        input.value = String(nextValue);
                        if (frame.dataset.mapGlowStartupMode === 'sprinkle') {
                            frame.dataset.mapGlowInitialRevealDone = 'false';
                        }
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupSprinkleControlsRow,
                    '1'
                );
                createTuningField(
                    'mapTuneGlowSprinkleSeed',
                    'Seed',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowSprinkleSeed,
                        1,
                        999999,
                        mapStartupSprinkleDefaults.seed
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 1, 999999, mapStartupSprinkleDefaults.seed));
                        frame.dataset.mapGlowSprinkleSeed = String(nextValue);
                        input.value = String(nextValue);
                        if (frame.dataset.mapGlowStartupMode === 'sprinkle') {
                            frame.dataset.mapGlowInitialRevealDone = 'false';
                        }
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupSprinkleControlsRow,
                    '1'
                );
                flashTuningGroup.appendChild(startupSprinkleControlsRow);

                const startupSweepFieldsLabel = document.createElement('span');
                startupSweepFieldsLabel.className = 'map-tuning-label map-tuning-label--group';
                startupSweepFieldsLabel.textContent = 'Startup Sweep Tests';
                flashTuningGroup.appendChild(startupSweepFieldsLabel);
                createTuningField(
                    'mapTuneGlowStartupOpacity',
                    'Max Opacity',
                    String(clampNumber(
                        frame.dataset.mapGlowStartupMaxOpacity,
                        0.1,
                        1,
                        mapColumnGlowDefaults.startupMaxOpacity
                    )),
                    (rawValue, input) => {
                        const nextValue = clampNumber(rawValue, 0.1, 1, mapColumnGlowDefaults.startupMaxOpacity);
                        frame.dataset.mapGlowStartupMaxOpacity = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupGlowControlsRow
                );
                createTuningField(
                    'mapTuneGlowStartupLines',
                    'Active Lines',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowStartupActiveLines,
                        1,
                        24,
                        mapColumnGlowDefaults.startupActiveLines
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 1, 24, mapColumnGlowDefaults.startupActiveLines));
                        frame.dataset.mapGlowStartupActiveLines = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupGlowControlsRow,
                    '1'
                );
                createTuningField(
                    'mapTuneGlowStartupSpeed',
                    'Speed Ms',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowStartupSpeedMs,
                        8,
                        1200,
                        mapColumnGlowDefaults.startupSpeedMs
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 8, 1200, mapColumnGlowDefaults.startupSpeedMs));
                        frame.dataset.mapGlowStartupSpeedMs = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupGlowControlsRow,
                    '1'
                );
                createTuningField(
                    'mapTuneGlowStartupLoad',
                    'Load Ms',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowStartupLoadMs,
                        20,
                        600,
                        mapColumnGlowDefaults.startupLoadMs
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 20, 600, mapColumnGlowDefaults.startupLoadMs));
                        frame.dataset.mapGlowStartupLoadMs = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    startupGlowControlsRow,
                    '1'
                );
                flashTuningGroup.appendChild(startupGlowControlsRow);

                const sweepLabel = document.createElement('span');
                sweepLabel.className = 'map-tuning-label map-tuning-label--group';
                sweepLabel.textContent = 'Sweep Tests';
                flashTuningGroup.appendChild(sweepLabel);
                createTuningField(
                    'mapTuneGlowOpacity',
                    'Max Opacity',
                    String(clampNumber(
                        frame.dataset.mapGlowMaxOpacity,
                        0.1,
                        1,
                        mapColumnGlowDefaults.maxOpacity
                    )),
                    (rawValue, input) => {
                        const nextValue = clampNumber(rawValue, 0.1, 1, mapColumnGlowDefaults.maxOpacity);
                        frame.dataset.mapGlowMaxOpacity = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    runtimeGlowControlsRow
                );
                createTuningField(
                    'mapTuneGlowLines',
                    'Active Lines',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowActiveLines,
                        1,
                        24,
                        mapColumnGlowDefaults.activeLines
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 1, 24, mapColumnGlowDefaults.activeLines));
                        frame.dataset.mapGlowActiveLines = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    runtimeGlowControlsRow,
                    '1'
                );
                createTuningField(
                    'mapTuneGlowSpeed',
                    'Speed Ms',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowSpeedMs,
                        8,
                        1200,
                        mapColumnGlowDefaults.speedMs
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 8, 1200, mapColumnGlowDefaults.speedMs));
                        frame.dataset.mapGlowSpeedMs = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    runtimeGlowControlsRow,
                    '1'
                );
                createTuningField(
                    'mapTuneGlowLoad',
                    'Load Ms',
                    String(Math.round(clampNumber(
                        frame.dataset.mapGlowLoadMs,
                        20,
                        600,
                        mapColumnGlowDefaults.loadMs
                    ))),
                    (rawValue, input) => {
                        const nextValue = Math.round(clampNumber(rawValue, 20, 600, mapColumnGlowDefaults.loadMs));
                        frame.dataset.mapGlowLoadMs = String(nextValue);
                        input.value = String(nextValue);
                        syncColumnGlowForMap(map);
                        syncEffectReadouts();
                    },
                    runtimeGlowControlsRow,
                    '1'
                );
                flashTuningGroup.appendChild(runtimeGlowControlsRow);
                const readoutLabel = document.createElement('span');
                readoutLabel.className = 'map-tuning-label map-tuning-label--group';
                readoutLabel.textContent = 'Effect Readout';
                flashTuningGroup.appendChild(readoutLabel);
                flashTuningGroup.appendChild(effectsReadout);
                syncFlashDurationControls();
                syncFlashVisualButtons();
                syncSweepActionButtons();
                syncStartupModeButtons();
                syncEffectReadouts();
                const flashHelp = document.createElement('p');
                flashHelp.className = 'map-tuning-help map-tuning-help--flash';
                flashHelp.textContent = 'Startup Mode selects first-pass behavior (Sweep or Sprinkle). Startup Sweep/Sprinkle tests affect first-pass only. Sweep Tests affect ongoing behavior after startup. Reset Sweep replays first-load map draw.';
                tuningStrip.appendChild(flashHelp);
                const resetField = document.createElement('div');
                resetField.className = 'map-tuning-field map-tuning-field--reset';
                const resetBtn = document.createElement('button');
                resetBtn.type = 'button';
                resetBtn.className = 'map-control map-control--tuning-reset';
                const applyFlashDefaults = () => {
                    applyFlashPresetToFrame(frame, mapFlashPresetDefaults.presetId);
                    frame.dataset.mapFlashCompactGlow = mapFlashVisualDefaults.compactGlow ? 'true' : 'false';
                    frame.dataset.mapGlowForceOn = 'false';
                    frame.dataset.mapGlowEnabled = 'false';
                    frame.dataset.mapGlowMaxOpacity = String(mapColumnGlowDefaults.maxOpacity);
                    frame.dataset.mapGlowActiveLines = String(mapColumnGlowDefaults.activeLines);
                    frame.dataset.mapGlowSpeedMs = String(mapColumnGlowDefaults.speedMs);
                    frame.dataset.mapGlowLoadMs = String(mapColumnGlowDefaults.loadMs);
                    frame.dataset.mapGlowTailLoadSync = 'false';
                    frame.dataset.mapGlowLeadFull = 'false';
                    frame.dataset.mapGlowLeadEdgeLine = 'false';
                    frame.dataset.mapGlowStartupMode = 'sprinkle';
                    frame.dataset.mapGlowSprinkleMs = String(mapStartupSprinkleDefaults.durationMs);
                    frame.dataset.mapGlowSprinkleStepMs = String(mapStartupSprinkleDefaults.stepMs);
                    frame.dataset.mapGlowSprinkleSeed = String(mapStartupSprinkleDefaults.seed);
                    frame.dataset.mapGlowStartupSpeedMs = String(mapColumnGlowDefaults.startupSpeedMs);
                    frame.dataset.mapGlowStartupMaxOpacity = String(mapColumnGlowDefaults.startupMaxOpacity);
                    frame.dataset.mapGlowStartupActiveLines = String(mapColumnGlowDefaults.startupActiveLines);
                    frame.dataset.mapGlowStartupLoadMs = String(mapColumnGlowDefaults.startupLoadMs);
                    frame.dataset.mapGlowInitialRevealDone = 'false';
                    syncFlashDurationControls();
                    syncFlashVisualButtons();
                    syncSweepActionButtons();
                    syncStartupModeButtons();
                    if (tuningInputs.mapTuneGlowOpacity) tuningInputs.mapTuneGlowOpacity.value = String(mapColumnGlowDefaults.maxOpacity);
                    if (tuningInputs.mapTuneGlowLines) tuningInputs.mapTuneGlowLines.value = String(mapColumnGlowDefaults.activeLines);
                    if (tuningInputs.mapTuneGlowSpeed) tuningInputs.mapTuneGlowSpeed.value = String(mapColumnGlowDefaults.speedMs);
                    if (tuningInputs.mapTuneGlowLoad) tuningInputs.mapTuneGlowLoad.value = String(mapColumnGlowDefaults.loadMs);
                    if (tuningInputs.mapTuneGlowSprinkleMs) tuningInputs.mapTuneGlowSprinkleMs.value = String(mapStartupSprinkleDefaults.durationMs);
                    if (tuningInputs.mapTuneGlowSprinkleStep) tuningInputs.mapTuneGlowSprinkleStep.value = String(mapStartupSprinkleDefaults.stepMs);
                    if (tuningInputs.mapTuneGlowSprinkleSeed) tuningInputs.mapTuneGlowSprinkleSeed.value = String(mapStartupSprinkleDefaults.seed);
                    if (tuningInputs.mapTuneGlowStartupSpeed) tuningInputs.mapTuneGlowStartupSpeed.value = String(mapColumnGlowDefaults.startupSpeedMs);
                    if (tuningInputs.mapTuneGlowStartupOpacity) tuningInputs.mapTuneGlowStartupOpacity.value = String(mapColumnGlowDefaults.startupMaxOpacity);
                    if (tuningInputs.mapTuneGlowStartupLines) tuningInputs.mapTuneGlowStartupLines.value = String(mapColumnGlowDefaults.startupActiveLines);
                    if (tuningInputs.mapTuneGlowStartupLoad) tuningInputs.mapTuneGlowStartupLoad.value = String(mapColumnGlowDefaults.startupLoadMs);
                    syncColumnGlowForMap(map);
                    syncEffectReadouts();
                };
                resetBtn.addEventListener('click', () => {
                    applyFlashDefaults();
                });
                resetField.appendChild(resetBtn);
                tuningStrip.appendChild(resetField);
                resetBtn.textContent = 'Reset Test Defaults';
                if (testsDock) {
                    testsDock.appendChild(tuningStrip);
                } else {
                    controls.appendChild(tuningStrip);
                }
            }

            const mapControls = controls.querySelectorAll('.map-control[data-map-target]');
            const overlays = map.querySelectorAll('.map-overlay');
            const categoryDescriptions = controls.querySelectorAll('.map-category-description[data-map-description-target]');
            let frameFlashTimerId = 0;
            const triggerFrameCategoryFlash = (targetClass) => {
                if (!frame) return;
                const sourceControl = Array.from(mapControls).find(control => control.getAttribute('data-map-target') === targetClass);
                const flashColor = sourceControl
                    ? sourceControl.style.getPropertyValue('--map-control-color').trim()
                    : '';
                frame.style.setProperty('--map-frame-category-flash-color', flashColor || 'var(--accent)');
                frame.classList.remove('map-frame-category-flash-active');
                void frame.offsetWidth;
                frame.classList.add('map-frame-category-flash-active');
                if (frameFlashTimerId) {
                    window.clearTimeout(frameFlashTimerId);
                }
                frameFlashTimerId = window.setTimeout(() => {
                    frame.classList.remove('map-frame-category-flash-active');
                    frameFlashTimerId = 0;
                }, 1200);
            };
            const setCategoryState = (targetClass, nextState, options = {}) => {
                overlays.forEach(overlay => {
                    if (overlay.classList.contains(targetClass)) {
                        overlay.classList.toggle('is-active', nextState);
                    }
                });
                mapControls.forEach(control => {
                    if (control.getAttribute('data-map-target') === targetClass) {
                        control.classList.toggle('is-active', nextState);
                        control.setAttribute('aria-pressed', nextState ? 'true' : 'false');
                    }
                });
                categoryDescriptions.forEach(description => {
                    if (description.getAttribute('data-map-description-target') === targetClass) {
                        description.classList.toggle('is-active', nextState);
                    }
                });
                if (nextState && options.flashFrame !== false) {
                    triggerFrameCategoryFlash(targetClass);
                }
            };
            toggleGroups.forEach(toggleGroup => setCategoryState(toggleGroup.targetClass, false, { flashFrame: false }));
            mapControls.forEach(control => {
                control.addEventListener('click', () => {
                    const target = control.getAttribute('data-map-target');
                    const overlay = Array.from(overlays).find(node => node.classList.contains(target));
                    if (!overlay) return;
                    const nextState = !overlay.classList.contains('is-active');
                    setCategoryState(target, nextState, { flashFrame: nextState });
                });
            });
            const firstToggleGroup = toggleGroups[0];
            if (firstToggleGroup) {
                const activateFirstToggleWhenReady = () => {
                    const hasAnyActive = Array.from(overlays).some(overlay => overlay.classList.contains('is-active'));
                    if (hasAnyActive) return;
                    const startupMode = frame && frame.dataset.mapGlowStartupMode === 'sprinkle' ? 'sprinkle' : 'sweep';
                    const sweepEnabled = frame && frame.dataset.mapGlowEnabled !== 'false';
                    const startupStillPopulating = Boolean(
                        frame
                        && frame.dataset.mapGlowInitialRevealDone !== 'true'
                        && (startupMode === 'sprinkle' || sweepEnabled)
                    );
                    if (!startupStillPopulating) {
                        setCategoryState(firstToggleGroup.targetClass, true, { flashFrame: false });
                        return;
                    }
                    let pollCount = 0;
                    const maxPolls = 500;
                    const pollReadyState = () => {
                        const alreadyActive = Array.from(overlays).some(overlay => overlay.classList.contains('is-active'));
                        if (alreadyActive) return;
                        const isReady = !frame || frame.dataset.mapGlowInitialRevealDone === 'true';
                        if (isReady || pollCount >= maxPolls) {
                            setCategoryState(firstToggleGroup.targetClass, true, { flashFrame: false });
                            return;
                        }
                        pollCount += 1;
                        window.setTimeout(pollReadyState, 40);
                    };
                    pollReadyState();
                };
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        activateFirstToggleWhenReady();
                    });
                });
            }
        };

        const renderFromText = (map, text, label) => {
            const t0 = performance.now();
            const lines = text.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            if (!lines.length) return false;

            let width = null;
            let height = null;
            const rows = [];
            const overrides = [];
            const overrideCoordinateSets = new Map();
            const toggleLines = [];
            let mode = 'rows';
            const isBinaryRow = (value) => /^[01]+$/.test(value);
            const isToggleRow = (value) => value.includes('|');
            const resolveOverrideColor = (rawColor) => {
                const trimmed = (rawColor || '').trim();
                const colorToken = trimmed.toLowerCase();
                if (!colorToken) return '';
                if (colorToken === 'accent') return 'var(--map-accent)';
                // Accept bare hex tokens (e.g. "6b7385") in addition to "#6b7385".
                if (/^[0-9a-f]{3}$/i.test(trimmed) || /^[0-9a-f]{4}$/i.test(trimmed) || /^[0-9a-f]{6}$/i.test(trimmed) || /^[0-9a-f]{8}$/i.test(trimmed)) {
                    return `#${trimmed}`;
                }
                return trimmed;
            };
            const resolveOverrideBlink = (rawBlink) => {
                const blinkToken = rawBlink.toLowerCase();
                return ['rapid', 'slow', 'fade', 'glow', 'blend', 'random'].includes(blinkToken) ? blinkToken : '';
            };
            const resolveOverridePhase = (rawPhase) => {
                const phaseToken = rawPhase.toLowerCase();
                if (!phaseToken) return 'sync';
                return ['sync', 'async'].includes(phaseToken) ? phaseToken : '';
            };
            const parseOverridePayload = (payload, line) => {
                const supportedBlink = ['rapid', 'slow', 'fade', 'glow', 'blend', 'random'];
                const supportedPhase = ['sync', 'async'];
                let hasValue = false;
                let value = '';
                let rawColor = '';
                let rawColor2 = '';
                let rawBlink = '';
                let rawPhase = '';
                const workingPayload = payload.map(part => part || '');
                if (workingPayload.length >= 1 && /^[01]$/.test(workingPayload[0])) {
                    hasValue = true;
                    value = workingPayload[0];
                    workingPayload.shift();
                }

                if (workingPayload.length >= 1) {
                    const lastToken = workingPayload[workingPayload.length - 1] || '';
                    if (supportedPhase.includes(lastToken.toLowerCase())) {
                        rawPhase = lastToken;
                        workingPayload.pop();
                    }
                }
                if (workingPayload.length >= 1) {
                    const lastToken = workingPayload[workingPayload.length - 1] || '';
                    if (supportedBlink.includes(lastToken.toLowerCase())) {
                        rawBlink = lastToken;
                        workingPayload.pop();
                    }
                }
                if (workingPayload.length > 2) {
                    return null;
                }
                rawColor = workingPayload[0] || '';
                rawColor2 = workingPayload[1] || '';
                const color = resolveOverrideColor(rawColor);
                const color2 = resolveOverrideColor(rawColor2);
                const blink = resolveOverrideBlink(rawBlink);
                const phase = resolveOverridePhase(rawPhase);
                const hasStyleOverride = Boolean(color || color2 || blink);
                if (!(hasValue || hasStyleOverride)) {
                    return null;
                }
                if (rawBlink && !blink) {
                    console.warn(`[map] invalid override blink in ${label}: "${line}"`);
                }
                if (rawPhase && !phase) {
                    console.warn(`[map] invalid override phase in ${label}: "${line}"`);
                }
                return {
                    hasValue,
                    value,
                    color,
                    color2,
                    blink,
                    phase: phase || 'sync'
                };
            };
            const parseCoordinateToken = (token) => {
                if (!token) return null;
                const trimmed = token.trim();
                if (!trimmed) return null;

                const commaMatch = trimmed.match(/^(-?\d+)\s*,\s*(-?\d+)$/);
                if (commaMatch) {
                    const x = Number(commaMatch[1]);
                    const y = Number(commaMatch[2]);
                    if (Number.isFinite(x) && Number.isFinite(y)) {
                        return { x, y };
                    }
                    return null;
                }

                if (!trimmed.includes('|')) return null;
                const parts = trimmed.split('|').map(part => part.trim());
                if (parts.length < 2) return null;
                if (!/^-?\d+$/.test(parts[0]) || !/^-?\d+$/.test(parts[1])) return null;
                if (parts.slice(2).some(part => part !== '')) return null;
                return {
                    x: Number(parts[0]),
                    y: Number(parts[1])
                };
            };
            const setCoordinateSet = (setName, coordinates, line) => {
                if (!coordinates.length) {
                    console.warn(`[map] empty override coordinate set in ${label}: "${line}"`);
                    return;
                }
                const dedupedCoordinates = [];
                const seen = new Set();
                coordinates.forEach(({ x, y }) => {
                    const key = `${x}|${y}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        dedupedCoordinates.push({ x, y });
                    }
                });
                overrideCoordinateSets.set(setName, dedupedCoordinates);
            };
            const parseCoordinateSetDefinition = (line, lineIndex) => {
                const setMatch = line.match(/^\$([a-zA-Z][\w-]*)\s*=\s*(.+)$/);
                if (!setMatch) {
                    console.warn(`[map] invalid override coordinate set in ${label}: "${line}"`);
                    return 0;
                }
                const setName = setMatch[1].toLowerCase();
                const setValue = setMatch[2].trim();
                if (setValue === '{') {
                    const coordinates = [];
                    let blockEndIndex = -1;
                    for (let idx = lineIndex + 1; idx < lines.length; idx += 1) {
                        const blockLine = lines[idx];
                        if (blockLine === '}') {
                            blockEndIndex = idx;
                            break;
                        }
                        if (blockLine.startsWith('#')) continue;
                        const coordinate = parseCoordinateToken(blockLine);
                        if (!coordinate) {
                            console.warn(`[map] invalid coordinate token in ${label}: "${blockLine}"`);
                            return Math.max(idx - lineIndex, 0);
                        }
                        coordinates.push(coordinate);
                    }
                    if (blockEndIndex < 0) {
                        console.warn(`[map] unterminated override coordinate set in ${label}: "${line}"`);
                        return Math.max(lines.length - 1 - lineIndex, 0);
                    }
                    setCoordinateSet(setName, coordinates, line);
                    return blockEndIndex - lineIndex;
                }

                const coordTokens = setValue.split(';').map(token => token.trim()).filter(Boolean);
                if (!coordTokens.length) {
                    console.warn(`[map] empty override coordinate set in ${label}: "${line}"`);
                    return 0;
                }
                const coordinates = [];
                let hasInvalidToken = false;
                coordTokens.forEach(token => {
                    const coordinate = parseCoordinateToken(token);
                    if (!coordinate) {
                        hasInvalidToken = true;
                        return;
                    }
                    coordinates.push(coordinate);
                });
                if (hasInvalidToken || !coordinates.length) {
                    console.warn(`[map] invalid coordinate token in ${label}: "${line}"`);
                    return 0;
                }
                setCoordinateSet(setName, coordinates, line);
                return 0;
            };
            const parseCoordinateSetUsage = (line) => {
                const eqMatch = line.match(/^@([a-zA-Z][\w-]*)\s*=(.*)$/);
                let setName = '';
                let payload = [];
                if (eqMatch) {
                    setName = eqMatch[1].toLowerCase();
                    let payloadText = (eqMatch[2] || '').trim();
                    if (payloadText.startsWith('|')) {
                        payloadText = payloadText.slice(1);
                    }
                    payload = payloadText ? payloadText.split('|').map(part => part.trim()) : [];
                } else {
                    const parts = line.split('|').map(part => part.trim());
                    const setRef = parts[0];
                    const refMatch = setRef.match(/^@([a-zA-Z][\w-]*)$/);
                    if (!refMatch) {
                        console.warn(`[map] invalid override coordinate set usage in ${label}: "${line}"`);
                        return;
                    }
                    setName = refMatch[1].toLowerCase();
                    payload = parts.slice(1);
                }
                if (!setName) {
                    console.warn(`[map] invalid override coordinate set usage in ${label}: "${line}"`);
                    return;
                }
                const coordinates = overrideCoordinateSets.get(setName);
                if (!coordinates || !coordinates.length) {
                    console.warn(`[map] unknown override coordinate set in ${label}: "${line}"`);
                    return;
                }
                const parsedPayload = parseOverridePayload(payload, line);
                if (!parsedPayload) {
                    console.warn(`[map] invalid override payload in ${label}: "${line}"`);
                    return;
                }
                coordinates.forEach(({ x, y }) => {
                    overrides.push({
                        x,
                        y,
                        ...parsedPayload
                    });
                });
            };

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
                const line = lines[lineIndex];
                if (line.startsWith('#')) {
                    if (/^#\s*overrides\s*$/i.test(line)) {
                        mode = 'overrides';
                        continue;
                    }
                    if (/^#\s*toggles\s*$/i.test(line)) {
                        mode = 'toggles';
                        continue;
                    }
                    const metaMatch = line.match(/width\s*=\s*(\d+)\s+height\s*=\s*(\d+)/i);
                    if (metaMatch) {
                        width = Number(metaMatch[1]);
                        height = Number(metaMatch[2]);
                    }
                    continue;
                }
                if (mode === 'rows' && isBinaryRow(line)) {
                    rows.push(line);
                    continue;
                }
                if (mode === 'overrides' && line.startsWith('$')) {
                    const consumedLines = parseCoordinateSetDefinition(line, lineIndex);
                    lineIndex += consumedLines;
                    continue;
                }
                if (mode === 'overrides' && line.startsWith('@')) {
                    parseCoordinateSetUsage(line);
                    continue;
                }
                if (isToggleRow(line)) {
                    if (mode === 'overrides') {
                        const parts = line.split('|').map(part => part.trim());
                        const x = Number(parts[0]);
                        const y = Number(parts[1]);
                        const payload = parts.slice(2);
                        const parsedPayload = parseOverridePayload(payload, line);
                        if (Number.isFinite(x) && Number.isFinite(y) && parsedPayload) {
                            overrides.push({ x, y, ...parsedPayload });
                            continue;
                        }
                        console.warn(`[map] invalid override in ${label}: "${line}"`);
                        continue;
                    }
                    mode = 'toggles';
                    toggleLines.push(line);
                    continue;
                }
                console.warn(`[map] skipped unrecognized line in ${label}: "${line}"`);
            }
            if (!rows.length) return false;
            const inferredWidth = rows[0].length;
            const inferredHeight = rows.length;
            width = width ?? inferredWidth;
            height = height ?? inferredHeight;

            if (rows.some(row => row.length !== width)) return false;
            if (inferredHeight !== height) return false;

            const resolvedRows = rows.map(row => row.split(''));
            const overrideStyleByCell = new Map();
            overrides.forEach(({ x, y, hasValue, value, color, color2, blink, phase }) => {
                if (!Number.isInteger(x) || !Number.isInteger(y)) return;
                if (x < 0 || y < 0 || x >= width || y >= height) {
                    const valueLabel = hasValue ? value : '-';
                    console.warn(`[map] override out of bounds in ${label}: ${x}|${y}|${valueLabel}`);
                    return;
                }
                const key = `${x}|${y}`;
                if (hasValue) {
                    resolvedRows[y][x] = value;
                }
                if (color || color2 || blink) {
                    overrideStyleByCell.set(key, { color, color2, blink, phase: phase || 'sync' });
                } else {
                    overrideStyleByCell.delete(key);
                }
            });

            renderDots(map, width, height, (x, y) => {
                const overrideStyle = overrideStyleByCell.get(`${x}|${y}`) || null;
                return {
                    isLand: resolvedRows[y] && resolvedRows[y][x] === '0',
                    overrideStyle
                };
            });
            if (toggleLines.length) {
                // Toggle markers authored with integer grid coordinates should center on cells.
                const resolveToggleCoordinate = (value) => (Number.isInteger(value) ? value + 0.5 : value);
                const toggleMarkers = toggleLines.map(line => {
                    const parts = line.split('|').map(part => part.trim());
                    const hasCategoryDescriptionAndTitle = parts.length >= 8
                        && Number.isFinite(Number(parts[3]))
                        && Number.isFinite(Number(parts[4]));
                    const hasCategoryAndTitle = parts.length >= 7
                        && Number.isFinite(Number(parts[2]))
                        && Number.isFinite(Number(parts[3]))
                        && !hasCategoryDescriptionAndTitle;
                    const buttonLabel = parts[0] || 'Toggle';
                    const description = hasCategoryDescriptionAndTitle ? (parts[1] || '') : '';
                    const label = hasCategoryDescriptionAndTitle
                        ? (parts[2] || buttonLabel)
                        : (hasCategoryAndTitle ? (parts[1] || buttonLabel) : buttonLabel);
                    const rawX = Number(hasCategoryDescriptionAndTitle ? parts[3] : (hasCategoryAndTitle ? parts[2] : parts[1]));
                    const rawY = Number(hasCategoryDescriptionAndTitle ? parts[4] : (hasCategoryAndTitle ? parts[3] : parts[2]));
                    const x = resolveToggleCoordinate(rawX);
                    const y = resolveToggleCoordinate(rawY);
                    const shapeRaw = hasCategoryDescriptionAndTitle
                        ? parts[5]
                        : (hasCategoryAndTitle ? parts[4] : parts[3]);
                    const colorRaw = hasCategoryDescriptionAndTitle
                        ? parts[6]
                        : (hasCategoryAndTitle ? parts[5] : parts[4]);
                    const shape = (shapeRaw || 'circle').toLowerCase();
                    const colorToken = (colorRaw || 'accent').toLowerCase();
                    const size = Number(hasCategoryDescriptionAndTitle
                        ? parts[7]
                        : (hasCategoryAndTitle ? parts[6] : parts[5])) || 4;
                    const categoryColorToken = `--map-toggle-${slugify(buttonLabel)}`;
                    const color = colorToken === 'accent'
                        ? `var(${categoryColorToken}, var(--map-accent))`
                        : colorToken;
                    return {
                        buttonLabel,
                        description,
                        label,
                        x,
                        y,
                        shape: shape === 'square' ? 'square' : 'circle',
                        size,
                        color,
                        targetClass: `overlay-${slugify(buttonLabel)}`
                    };
                }).filter(item => Number.isFinite(item.x) && Number.isFinite(item.y));

                const toggleGroupsMap = new Map();
                const toggleGroups = [];
                toggleMarkers.forEach(marker => {
                    let group = toggleGroupsMap.get(marker.targetClass);
                    if (!group) {
                        group = {
                            targetClass: marker.targetClass,
                            buttonLabel: marker.buttonLabel,
                            description: marker.description || '',
                            markers: []
                        };
                        toggleGroupsMap.set(marker.targetClass, group);
                        toggleGroups.push(group);
                    } else if (!group.description && marker.description) {
                        group.description = marker.description;
                    }
                    group.markers.push(marker);
                });

                const controls = resolveMdControls(map);
                if (toggleGroups.length) {
                    applyMdToggleData(toggleGroups, map, controls);
                } else if (controls) {
                    controls.innerHTML = '<span class="map-controls-empty">No MD toggles loaded</span>';
                    map.querySelectorAll('.map-overlay').forEach(node => node.remove());
                    console.warn('[map] no valid MD toggles found.');
                }
            }
            const t1 = performance.now();
            console.info(`[map] ${label} md render: ${(t1 - t0).toFixed(2)}ms`);
            return true;
        };

        const renderFromImage = (map, src, label) => {
            const img = new Image();
            img.onload = () => {
                const t0 = performance.now();
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                renderDots(map, canvas.width, canvas.height, (x, y) => {
                    const idx = (y * canvas.width + x) * 4;
                    const r = imageData[idx];
                    const g = imageData[idx + 1];
                    const b = imageData[idx + 2];
                    const a = imageData[idx + 3];
                    if (a < 10) return false;
                    return (r + g + b) < 384;
                });
                const t1 = performance.now();
                console.info(`[map] ${label} png render: ${(t1 - t0).toFixed(2)}ms`);
            };
            img.src = src;
        };

        maps.forEach(map => {
            const mapMdPath = map.getAttribute('data-map-md');
            const mapSrc = map.getAttribute('data-map-src');
            const mapFallback = map.getAttribute('data-map-fallback');
            if (mapMdPath) {
                fetch(mapMdPath, { cache: 'no-store' })
                    .then(response => response.text())
                    .then(text => {
                        const ok = renderFromText(map, text, mapMdPath);
                        if (!ok && mapFallback) {
                            renderFromImage(map, mapFallback, mapFallback);
                        }
                    })
                    .catch(() => {
                        if (mapFallback) {
                            renderFromImage(map, mapFallback, mapFallback);
                        }
                    });
                return;
            }
            if (mapSrc) {
                renderFromImage(map, mapSrc, mapSrc);
            }
        });
        syncMapTestsVisibility();
        const isPortalModalOpen = () => {
            const modal = document.getElementById('portalModal');
            if (!modal) return false;
            if (modal.style.display === 'flex' || modal.style.display === 'block') return true;
            return window.getComputedStyle(modal).display !== 'none';
        };
        const isTextInputLike = (node) => {
            if (!node || !(node instanceof HTMLElement)) return false;
            const tag = node.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
        };
        if (!window.__tsiMapTestsHotkeyBound) {
            window.addEventListener('keydown', (event) => {
                if (event.defaultPrevented) return;
                if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return;
                if (String(event.key || '').toLowerCase() !== 'm') return;
                if (isTextInputLike(event.target)) return;
                if (!isPortalModalOpen()) return;
                event.preventDefault();
                const nextVisible = !mapTestsVisible;
                setMapTestsVisible(nextVisible);
                showMapTestsToggleNotice(nextVisible);
            });
            window.__tsiMapTestsHotkeyBound = true;
        }
        if (!window.__tsiMapTestsObserverBound && typeof MutationObserver === 'function') {
            const testSettingsObserver = new MutationObserver((mutations) => {
                let shouldSync = false;
                for (let i = 0; i < mutations.length; i += 1) {
                    const added = mutations[i].addedNodes;
                    for (let j = 0; j < added.length; j += 1) {
                        const node = added[j];
                        if (!(node instanceof HTMLElement)) continue;
                        if (
                            node.matches('[data-map-tests], [data-test-settings]')
                            || node.querySelector('[data-map-tests], [data-test-settings]')
                        ) {
                            shouldSync = true;
                            break;
                        }
                    }
                    if (shouldSync) break;
                }
                if (shouldSync) syncMapTestsVisibility();
            });
            testSettingsObserver.observe(document.body, { childList: true, subtree: true });
            window.__tsiMapTestsObserverBound = true;
        }
    }

    function initHoldToClear() {
        const clearBtn = document.getElementById('formClearBtn');
        if (!clearBtn) return;

        const helper = document.querySelector('.form-clear-helper');
        const holdSeconds = (HOLD_CLEAR_MS / 1000).toFixed(1).replace(/\.0$/, '');
        clearBtn.style.setProperty('--hold-duration', `${HOLD_CLEAR_MS}ms`);
        if (helper) {
            helper.textContent = `Hold ${holdSeconds}s to clear`;
        }

        let holdTimer = null;
        let isHolding = false;

        const cancelHold = () => {
            if (!isHolding) return;
            isHolding = false;
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            clearBtn.classList.remove('is-holding');
        };

        const startHold = () => {
            if (clearBtn.disabled || window._isSubmitting) return;
            if (isHolding) return;
            isHolding = true;
            clearBtn.classList.remove('is-holding');
            void clearBtn.offsetWidth;
            clearBtn.classList.add('is-holding');
            holdTimer = window.setTimeout(() => {
                holdTimer = null;
                isHolding = false;
                clearBtn.classList.remove('is-holding');
                resetFormDataOnly();
            }, HOLD_CLEAR_MS);
        };

        clearBtn.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            clearBtn.setPointerCapture(event.pointerId);
            startHold();
        });
        clearBtn.addEventListener('pointerup', (event) => {
            if (clearBtn.hasPointerCapture(event.pointerId)) {
                clearBtn.releasePointerCapture(event.pointerId);
            }
            cancelHold();
        });
        clearBtn.addEventListener('pointerleave', cancelHold);
        clearBtn.addEventListener('pointercancel', (event) => {
            if (clearBtn.hasPointerCapture(event.pointerId)) {
                clearBtn.releasePointerCapture(event.pointerId);
            }
            cancelHold();
        });

        clearBtn.addEventListener('keydown', (event) => {
            if (event.repeat) return;
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                startHold();
            }
        });
        clearBtn.addEventListener('keyup', (event) => {
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                cancelHold();
            }
        });
        clearBtn.addEventListener('blur', cancelHold);
    }
