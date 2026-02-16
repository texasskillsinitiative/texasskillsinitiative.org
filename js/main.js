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

    function setActiveTabFromHash() {
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
    }

    window.addEventListener('hashchange', setActiveTabFromHash);
    setActiveTabFromHash();

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
        const bindLegacyToggleControls = () => {
            const legacyMap = document.querySelector('.pipeline-map svg[data-map-src]');
            const legacyFrame = legacyMap ? legacyMap.closest('.pipeline-map-frame') : null;
            const siblingControls = legacyFrame ? legacyFrame.previousElementSibling : null;
            const legacyControls = (siblingControls && siblingControls.classList.contains('pipeline-map-controls'))
                ? siblingControls
                : document.querySelector('[data-map-controls="legacy"]');
            const legacyOverlays = legacyMap ? legacyMap.querySelectorAll('.map-overlay') : [];
            if (!legacyControls || !legacyMap) return;

            const legacyButtons = legacyControls.querySelectorAll('.map-control');
            legacyButtons.forEach(control => {
                const target = control.getAttribute('data-map-target');
                const overlay = Array.from(legacyOverlays).find(node => node.classList.contains(target));
                const isActive = overlay ? overlay.classList.contains('is-active') : control.classList.contains('is-active');
                control.classList.toggle('is-active', isActive);
                control.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            legacyButtons.forEach(control => {
                control.addEventListener('click', () => {
                    const target = control.getAttribute('data-map-target');
                    const overlay = Array.from(legacyOverlays).find(node => node.classList.contains(target));
                    if (!overlay) return;
                    const nextState = !overlay.classList.contains('is-active');
                    overlay.classList.toggle('is-active', nextState);
                    control.classList.toggle('is-active', nextState);
                    control.setAttribute('aria-pressed', nextState ? 'true' : 'false');
                });
            });
        };
        bindLegacyToggleControls();

        const maps = Array.from(document.querySelectorAll('.pipeline-map svg'));
        if (!maps.length) return;

        const applyMapSizeClass = (map) => {
            const width = map.getBoundingClientRect().width;
            map.classList.toggle('map--compact', width < 900);
            map.classList.toggle('map--tiny', width < 600);
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

        const createDot = (x, y, isLand, radius, overrideStyle) => {
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x);
            dot.setAttribute('cy', y);
            dot.setAttribute('r', radius);
            const classes = ['map-dot'];
            if (isLand) classes.push('is-land');
            if (overrideStyle) {
                classes.push('map-dot--override');
                if (overrideStyle.blink) {
                    classes.push(`map-dot--blink-${overrideStyle.blink}`);
                }
                if (overrideStyle.color) {
                    dot.setAttribute('fill', overrideStyle.color);
                }
            }
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
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    const dotState = resolveDotState(x, y);
                    const isLand = typeof dotState === 'object' ? !!dotState.isLand : !!dotState;
                    const overrideStyle = typeof dotState === 'object' ? (dotState.overrideStyle || null) : null;
                    dotGroup.appendChild(createDot(x + 0.5, y + 0.5, isLand, radius, overrideStyle));
                }
            }
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
            toggleGroups.forEach((toggleGroup, index) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `map-control${index === 0 ? ' is-active' : ''}`;
                btn.setAttribute('data-map-target', toggleGroup.targetClass);
                btn.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
                btn.textContent = toggleGroup.buttonLabel;
                controls.appendChild(btn);
            });

            map.querySelectorAll('.map-overlay').forEach(node => node.remove());
            toggleGroups.forEach((toggleGroup, index) => {
                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.setAttribute('class', `map-overlay ${toggleGroup.targetClass}${index === 0 ? ' is-active' : ''}`);

                toggleGroup.markers.forEach(marker => {
                    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    markerGroup.setAttribute('class', 'map-marker');
                    const blinkClass = marker.blink ? `map-marker--blink-${marker.blink}` : '';
                    if (marker.shape === 'square') {
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', marker.x - marker.size);
                        rect.setAttribute('y', marker.y - marker.size);
                        rect.setAttribute('width', marker.size * 2);
                        rect.setAttribute('height', marker.size * 2);
                        rect.setAttribute('rx', Math.max(1, marker.size * 0.35));
                        rect.setAttribute('fill', marker.color);
                        if (blinkClass) rect.setAttribute('class', blinkClass);
                        markerGroup.appendChild(rect);
                    } else {
                        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('cx', marker.x);
                        circle.setAttribute('cy', marker.y);
                        circle.setAttribute('r', marker.size);
                        circle.setAttribute('fill', marker.color);
                        if (blinkClass) circle.setAttribute('class', blinkClass);
                        markerGroup.appendChild(circle);
                    }

                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', marker.x + (marker.size * 2));
                    label.setAttribute('y', marker.y + (marker.size * 1.8));
                    label.textContent = marker.label;
                    markerGroup.appendChild(label);
                    group.appendChild(markerGroup);
                });
                map.appendChild(group);
            });

            const mapControls = controls.querySelectorAll('.map-control');
            const overlays = map.querySelectorAll('.map-overlay');
            mapControls.forEach(control => {
                control.addEventListener('click', () => {
                    const target = control.getAttribute('data-map-target');
                    const overlay = Array.from(overlays).find(node => node.classList.contains(target));
                    if (!overlay) return;
                    const nextState = !overlay.classList.contains('is-active');
                    overlay.classList.toggle('is-active', nextState);
                    control.classList.toggle('is-active', nextState);
                    control.setAttribute('aria-pressed', nextState ? 'true' : 'false');
                });
            });
        };

        const renderFromText = (map, text, label) => {
            const t0 = performance.now();
            const lines = text.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            if (!lines.length) return false;

            let width = null;
            let height = null;
            const rows = [];
            const overrides = [];
            const toggleLines = [];
            let mode = 'rows';
            const isBinaryRow = (value) => /^[01]+$/.test(value);
            const isToggleRow = (value) => value.includes('|');
            const resolveOverrideColor = (rawColor) => {
                const colorToken = rawColor.toLowerCase();
                if (!colorToken) return '';
                return colorToken === 'accent' ? 'var(--accent)' : rawColor;
            };
            const resolveOverrideBlink = (rawBlink) => {
                const blinkToken = rawBlink.toLowerCase();
                return ['rapid', 'slow', 'fade'].includes(blinkToken) ? blinkToken : '';
            };

            lines.forEach(line => {
                if (line.startsWith('#')) {
                    if (/^#\s*overrides\s*$/i.test(line)) {
                        mode = 'overrides';
                        return;
                    }
                    if (/^#\s*toggles\s*$/i.test(line)) {
                        mode = 'toggles';
                        return;
                    }
                    const metaMatch = line.match(/width\s*=\s*(\d+)\s+height\s*=\s*(\d+)/i);
                    if (metaMatch) {
                        width = Number(metaMatch[1]);
                        height = Number(metaMatch[2]);
                    }
                    return;
                }
                if (mode === 'rows' && isBinaryRow(line)) {
                    rows.push(line);
                    return;
                }
                if (isToggleRow(line)) {
                    if (mode === 'overrides') {
                        const parts = line.split('|').map(part => part.trim());
                        const x = Number(parts[0]);
                        const y = Number(parts[1]);
                        const value = parts[2];
                        let rawColor = parts[3] || '';
                        let rawBlink = parts[4] || '';
                        const shorthandBlink = ['rapid', 'slow', 'fade'];
                        if (parts.length === 4 && shorthandBlink.includes(rawColor.toLowerCase())) {
                            rawBlink = rawColor;
                            rawColor = '';
                        }
                        const color = resolveOverrideColor(rawColor);
                        const blink = resolveOverrideBlink(rawBlink);
                        const hasSupportedLength = parts.length >= 3 && parts.length <= 5;
                        if (hasSupportedLength && Number.isFinite(x) && Number.isFinite(y) && /^[01]$/.test(value)) {
                            if (rawBlink && !blink) {
                                console.warn(`[map] invalid override blink in ${label}: "${line}"`);
                            }
                            overrides.push({ x, y, value, color, blink });
                            return;
                        }
                        console.warn(`[map] invalid override in ${label}: "${line}"`);
                        return;
                    }
                    mode = 'toggles';
                    toggleLines.push(line);
                    return;
                }
                console.warn(`[map] skipped unrecognized line in ${label}: "${line}"`);
            });
            if (!rows.length) return false;
            const inferredWidth = rows[0].length;
            const inferredHeight = rows.length;
            width = width ?? inferredWidth;
            height = height ?? inferredHeight;

            if (rows.some(row => row.length !== width)) return false;
            if (inferredHeight !== height) return false;

            const resolvedRows = rows.map(row => row.split(''));
            const overrideStyleByCell = new Map();
            overrides.forEach(({ x, y, value, color, blink }) => {
                if (!Number.isInteger(x) || !Number.isInteger(y)) return;
                if (x < 0 || y < 0 || x >= width || y >= height) {
                    console.warn(`[map] override out of bounds in ${label}: ${x}|${y}|${value}`);
                    return;
                }
                resolvedRows[y][x] = value;
                overrideStyleByCell.set(`${x}|${y}`, {
                    color,
                    blink
                });
            });

            renderDots(map, width, height, (x, y) => {
                const overrideStyle = overrideStyleByCell.get(`${x}|${y}`) || null;
                return {
                    isLand: resolvedRows[y] && resolvedRows[y][x] === '0',
                    overrideStyle
                };
            });
            if (toggleLines.length) {
                const toggleMarkers = toggleLines.map(line => {
                    const parts = line.split('|').map(part => part.trim());
                    const hasCategoryAndTitle = parts.length >= 8;
                    const buttonLabel = parts[0] || 'Toggle';
                    const label = hasCategoryAndTitle ? (parts[1] || buttonLabel) : buttonLabel;
                    const x = Number(hasCategoryAndTitle ? parts[2] : parts[1]);
                    const y = Number(hasCategoryAndTitle ? parts[3] : parts[2]);
                    const shape = (hasCategoryAndTitle ? parts[4] : parts[3] || 'circle').toLowerCase();
                    const colorToken = (hasCategoryAndTitle ? parts[5] : parts[4] || 'accent').toLowerCase();
                    const size = Number(hasCategoryAndTitle ? parts[6] : parts[5]) || 4;
                    const blink = (hasCategoryAndTitle ? parts[7] : parts[6] || '').toLowerCase();
                    const color = colorToken === 'accent' ? 'var(--accent)' : colorToken;
                    return {
                        buttonLabel,
                        label,
                        x,
                        y,
                        shape: shape === 'square' ? 'square' : 'circle',
                        size,
                        color,
                        blink,
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
                            markers: []
                        };
                        toggleGroupsMap.set(marker.targetClass, group);
                        toggleGroups.push(group);
                    }
                    group.markers.push(marker);
                });

                const controls = resolveMdControls(map);
                if (toggleGroups.length) {
                    applyMdToggleData(toggleGroups, map, controls);
                } else if (controls) {
                    controls.innerHTML = '<span class="map-controls-empty">No MD toggles loaded</span>';
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
