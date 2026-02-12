    const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzDrmbMTExgcsq7-LfzYv7VLu9X5w93lDZMkXRfi0EnhPzlKL6KASMvukCGD5LvxHKD/exec';
    const SUBMIT_MIN_MS = 3000;
    const SUCCESS_GRACE_MS = 2000;
    const SUBMIT_MAX_MS = 30000;
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
        });
    }

    function _021026_resetConcierge(form) {
        const buttons = form.querySelectorAll('[data-concierge-track]');
        const error = form.querySelector('#conciergeError');
        const handlerTierInput = form.querySelector('#handlerTier');
        const trackInput = form.querySelector('#conciergeTrack');

        buttons.forEach(button => {
            button.classList.remove('is-active');
            button.setAttribute('aria-pressed', 'false');
        });

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
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('is-active');
                button.setAttribute('aria-pressed', 'true');
                if (handlerTierInput) handlerTierInput.value = tier;
                if (trackInput) trackInput.value = label;
                if (error) {
                    error.textContent = '';
                    error.classList.remove('visible');
                }
                _021026_setConciergeVisibility(form, tier);
            });
        });

        _021026_setConciergeVisibility(form, handlerTierInput ? handlerTierInput.value : '');
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

        if (status) status.hidden = true;
        if (failure) failure.hidden = true;

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!submitBtn) return;

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
                if (failure) failure.hidden = false;
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
            }, delay);
        });
    }

    initModalTriggers();
    _021026_initConciergeForm();
    initPortalOptions();

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
    }

    window.addEventListener('hashchange', setActiveTabFromHash);
    setActiveTabFromHash();
