    const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzDrmbMTExgcsq7-LfzYv7VLu9X5w93lDZMkXRfi0EnhPzlKL6KASMvukCGD5LvxHKD/exec';
    const SUBMIT_MIN_MS = 3000;
    const SUCCESS_GRACE_MS = 2000;
    const SUBMIT_MAX_MS = 30000;
    const HOLD_CLEAR_MS = 2000;
    const MOBILE_NAV_BREAKPOINT = 1024;
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
    const _021026_SUBMISSION_MESSAGES = {
        stakeholder: _021026_TIER_MESSAGES['2'],
        investor: 'Thank you for your investor interest. Your request has been logged for the investment information workflow, and our team will follow up if there is strategic alignment.',
        employment: 'Thank you for your employment application. Your submission has been logged for internal review, and we will contact you if there is a role fit.'
    };
    const FORM_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;
    const FORM_ATTACHMENT_ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg']);
    const MODAL_FOCUS_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const _modalFocusRestore = new Map();

    function normalizeSubmissionType(value) {
        const raw = String(value || '').trim().toLowerCase();
        if (raw === 'investor' || raw.includes('investor')) return 'investor';
        if (raw === 'employment' || raw.includes('employment')) return 'employment';
        return 'stakeholder';
    }

    function extractFileExtension(filename) {
        const raw = String(filename || '').trim();
        const idx = raw.lastIndexOf('.');
        if (idx < 0) return '';
        return raw.slice(idx + 1).toLowerCase();
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('file_read_error'));
            reader.onload = () => {
                const result = String(reader.result || '');
                const commaIdx = result.indexOf(',');
                if (commaIdx < 0) {
                    reject(new Error('file_parse_error'));
                    return;
                }
                resolve(result.slice(commaIdx + 1));
            };
            reader.readAsDataURL(file);
        });
    }

    function getOpenModals() {
        return Array.from(document.querySelectorAll('[data-modal-overlay]')).filter((overlay) => {
            const style = window.getComputedStyle(overlay);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
    }

    function getTopOpenModal() {
        const open = getOpenModals();
        return open.length ? open[open.length - 1] : null;
    }

    function isPortalModalOpen() {
        const modal = document.getElementById('portalModal');
        if (!modal) return false;
        if (modal.style.display === 'flex' || modal.style.display === 'block') return true;
        return window.getComputedStyle(modal).display !== 'none';
    }

    function getFocusableInModal(modal) {
        if (!modal) return [];
        return Array.from(modal.querySelectorAll(MODAL_FOCUS_SELECTOR)).filter((node) => {
            if (!(node instanceof HTMLElement)) return false;
            if (node.hidden) return false;
            if (node.getAttribute('aria-hidden') === 'true') return false;
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            return node.offsetParent !== null || style.position === 'fixed';
        });
    }

    function focusFirstModalElement(modal) {
        const focusables = getFocusableInModal(modal);
        if (focusables.length) {
            focusables[0].focus();
            return;
        }
        if (modal) {
            modal.setAttribute('tabindex', '-1');
            modal.focus();
        }
    }

    function trapModalFocus(modal, event) {
        if (!modal || event.key !== 'Tab') return;
        const focusables = getFocusableInModal(modal);
        if (!focusables.length) {
            event.preventDefault();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        const activeInsideModal = Boolean(active && modal.contains(active));
        if (event.shiftKey) {
            if (!activeInsideModal || active === first || active === modal) {
                event.preventDefault();
                last.focus();
            }
            return;
        }
        if (!activeInsideModal || active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function _021026_setConciergeVisibility(form, tier, submissionType) {
        const nextType = normalizeSubmissionType(submissionType);
        const groups = form.querySelectorAll('[data-concierge-group]');
        groups.forEach(group => {
            const groupName = group.getAttribute('data-concierge-group');
            const shouldShow = Boolean(
                tier && (
                    groupName === 'common'
                    || groupName === 'shared'
                    || groupName === (tier === '1' ? 'tier-1' : 'tier-2')
                    || groupName === nextType
                    || (groupName === 'attachment' && (nextType === 'investor' || nextType === 'employment'))
                )
            );
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
        const fileError = form.querySelector('#fileError');
        const handlerTierInput = form.querySelector('#handlerTier');
        const trackInput = form.querySelector('#conciergeTrack');
        const submissionTypeInput = form.querySelector('#submissionType');
        const fileInput = form.querySelector('#applicationFile');

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
        if (submissionTypeInput) submissionTypeInput.value = '';
        if (error) {
            error.textContent = '';
            error.classList.remove('visible');
        }
        if (fileError) {
            fileError.textContent = '';
            fileError.classList.remove('visible');
        }
        if (fileInput) {
            fileInput.value = '';
        }

        _021026_setConciergeVisibility(form, '', '');
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
        if (document.activeElement instanceof HTMLElement) {
            _modalFocusRestore.set(modalId, document.activeElement);
        }
        modal.style.display = 'flex'; // or 'block' depending on your CSS
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevents background scrolling
        if (modalId === 'accessModal' && !window._formOpenTime) {
            window._formOpenTime = Date.now();
        }
        window.requestAnimationFrame(() => focusFirstModalElement(modal));
    } else {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        if (!getOpenModals().length) {
            document.body.style.overflow = '';
        }
        const restoreTarget = _modalFocusRestore.get(modalId);
        if (restoreTarget && typeof restoreTarget.focus === 'function') {
            restoreTarget.focus();
        }
        _modalFocusRestore.delete(modalId);
    }
    modal.dispatchEvent(new CustomEvent('tsi:modal-visibility', {
        detail: { modalId, open: Boolean(show) }
    }));
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
    document.getElementById('stakeholderForm').addEventListener('submit', async function(e) {
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
        const fileError = document.getElementById('fileError');
        const handlerTierInput = document.getElementById('handlerTier');
        const submissionTypeInput = document.getElementById('submissionType');
        const fileInput = document.getElementById('applicationFile');
        const successSub = document.getElementById('formSuccessSub');
        const modalBody = document.getElementById('accessModalBody');
        const formSuccess = document.getElementById('formSuccess');
        const successCloseBtn = document.getElementById('successCloseBtn');
        const successAnotherBtn = document.getElementById('successAnotherBtn');

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
        if (fileError) {
            fileError.textContent = '';
            fileError.classList.remove('visible');
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

        const timeElapsed = Date.now() - (window._formOpenTime || 0);
        if (timeElapsed < SUBMIT_MIN_MS) {
            if (timeError) timeError.hidden = false;
            return;
        }

        const email = document.getElementById('email').value;
        if (!email.includes('@')) {
            if (emailError) {
                emailError.textContent = "Please enter a valid email address.";
                emailError.classList.add('visible');
            }
            return;
        }

        window._isSubmitting = true;
        window._submitStartedAt = Date.now();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        startSubmissionTimers();

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            delete data.application_file;
            const submissionType = normalizeSubmissionType(
                (submissionTypeInput && submissionTypeInput.value) || data.submission_type || 'stakeholder'
            );
            data.submission_type = submissionType;
            data.page_path = window.location.pathname || '/';
            data.referrer = document.referrer || 'direct';
            data.submission_id = generateSubmissionId();
            data.timestamp_local = formatLocalTimestamp(new Date());

            const selectedFile = (fileInput && !fileInput.disabled && fileInput.files && fileInput.files[0])
                ? fileInput.files[0]
                : null;
            if (selectedFile) {
                const extension = extractFileExtension(selectedFile.name);
                if (!FORM_ATTACHMENT_ALLOWED_EXTENSIONS.has(extension)) {
                    if (fileError) {
                        fileError.textContent = 'Unsupported file type. Use PDF, DOC/DOCX, PPT/PPTX, TXT, PNG, or JPG.';
                        fileError.classList.add('visible');
                    }
                    throw new Error('attachment_validation');
                }
                if (selectedFile.size > FORM_ATTACHMENT_MAX_BYTES) {
                    if (fileError) {
                        fileError.textContent = 'Attachment exceeds 8MB limit.';
                        fileError.classList.add('visible');
                    }
                    throw new Error('attachment_validation');
                }
                setFormStatus('Preparing attachment upload...');
                const fileBase64 = await readFileAsBase64(selectedFile);
                data.attachment_name = selectedFile.name;
                data.attachment_type = selectedFile.type || '';
                data.attachment_size = String(selectedFile.size);
                data.attachment_data = fileBase64;
            } else {
                data.attachment_name = '';
                data.attachment_type = '';
                data.attachment_size = '';
                data.attachment_data = '';
            }

            setFormStatus('Submitting your form...');
            const res = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const body = await res.json().catch(() => null);
            const isOk = res.ok && body && body.ok === true;
            if (!isOk) {
                throw new Error((body && body.error) ? body.error : 'server_error');
            }

            window._successShownAt = Date.now();
            window._formLastState = 'success';
            window._isSubmitting = false;
            stopSubmissionTimers();
            clearFormStatus();

            if (successSub) {
                successSub.textContent = _021026_SUBMISSION_MESSAGES[submissionType]
                    || _021026_TIER_MESSAGES[handlerTierInput.value]
                    || _021026_TIER_MESSAGES['2'];
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
        } catch (err) {
            if (!window._isSubmitting) {
                return;
            }
            const errCode = String((err && err.message) || '');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
            const isAttachmentError = (
                errCode === 'attachment_validation'
                || errCode === 'file_too_large'
                || errCode === 'invalid_attachment_type'
                || errCode === 'invalid_attachment'
                || errCode === 'file_upload_error'
            );
            if (isAttachmentError && fileError) {
                if (!fileError.textContent) {
                    fileError.textContent = 'Attachment upload failed. Please review file type and size.';
                }
                fileError.classList.add('visible');
            } else if (networkError) {
                if (errCode.startsWith('file_')) {
                    networkError.querySelector('p').textContent = 'Attachment upload failed. Please try again.';
                }
                networkError.hidden = false;
            }
            window._isSubmitting = false;
            window._successShownAt = null;
            stopSubmissionTimers();
            clearFormStatus();
        }
    });

    function _021026_initConciergeForm() {
        const form = document.getElementById('stakeholderForm');
        if (!form) return;

        const buttons = form.querySelectorAll('[data-concierge-track]');
        const grid = form.querySelector('.concierge-grid');
        const backBtn = form.querySelector('#conciergeBackBtn');
        const handlerTierInput = form.querySelector('#handlerTier');
        const trackInput = form.querySelector('#conciergeTrack');
        const submissionTypeInput = form.querySelector('#submissionType');
        const error = form.querySelector('#conciergeError');

        buttons.forEach(button => {
            button.setAttribute('aria-pressed', 'false');
            button.addEventListener('click', () => {
                const tier = button.getAttribute('data-concierge-tier') || '';
                const trackKey = button.getAttribute('data-concierge-track') || button.textContent.trim();
                const submissionType = normalizeSubmissionType(button.getAttribute('data-concierge-type') || 'stakeholder');
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
                if (trackInput) trackInput.value = trackKey;
                if (submissionTypeInput) submissionTypeInput.value = submissionType;
                if (error) {
                    error.textContent = '';
                    error.classList.remove('visible');
                }
                _021026_setConciergeVisibility(form, tier, submissionType);
            });
        });

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                _021026_resetConcierge(form);
            });
        }

        const initialTier = handlerTierInput ? handlerTierInput.value : '';
        const initialSubmissionType = submissionTypeInput ? submissionTypeInput.value : '';
        if (initialTier) {
            form.classList.add('has-concierge');
        }
        _021026_setConciergeVisibility(form, initialTier, initialSubmissionType);
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

        if (!window.__tsiModalKeyboardBound) {
            document.addEventListener('keydown', (event) => {
                const openModal = getTopOpenModal();
                if (!openModal) return;
                if (event.key === 'Escape') {
                    event.preventDefault();
                    const modalId = openModal.id;
                    if (modalId === 'accessModal') {
                        requestCloseAccessModal();
                    } else {
                        toggleModal(modalId, false);
                    }
                    return;
                }
                trapModalFocus(openModal, event);
            });
            document.addEventListener('focusin', (event) => {
                const openModal = getTopOpenModal();
                if (!openModal) return;
                const target = event.target;
                if (!(target instanceof HTMLElement)) return;
                if (openModal.contains(target)) return;
                const focusables = getFocusableInModal(openModal);
                if (focusables.length) {
                    focusables[0].focus();
                } else {
                    openModal.focus();
                }
            });
            window.__tsiModalKeyboardBound = true;
        }
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

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!submitBtn) return;

            const rawUsername = usernameInput ? usernameInput.value.trim() : '';
            if (rawUsername.toLowerCase() === 'debugme') {
                const debugApi = window.__tsiPortalDebugApi;
                if (debugApi && typeof debugApi.toggleFromPortalInput === 'function') {
                    const toggled = await debugApi.toggleFromPortalInput();
                    if (toggled) {
                        if (status) status.hidden = true;
                        if (failure) failure.hidden = true;
                        if (usernameInput) usernameInput.value = '';
                        return;
                    }
                }
                if (failure) {
                    failure.textContent = 'Authentication unavailable.\nPlease contact system administration for access updates.';
                    failure.hidden = false;
                }
                if (status) status.hidden = true;
                return;
            }
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

    function initGlobalDebugMenu() {
        const portalModal = document.getElementById('portalModal');
        const defaultContent = document.getElementById('portalModalDefaultContent');
        const debugMenu = document.getElementById('portalDebugMenu');
        const exitDebugBtn = document.getElementById('globalDebugExit');
        const colorPresetSelect = document.getElementById('globalDebugColorPreset');
        const textScaleSelect = document.getElementById('globalDebugTextScale');
        const toggleLayoutBtn = document.getElementById('globalDebugToggleLayoutCompact');
        const toggleMotionBtn = document.getElementById('globalDebugToggleMotionReduce');
        const resetColorBtn = document.getElementById('globalDebugResetColor');
        const resetTextScaleBtn = document.getElementById('globalDebugResetTextScale');
        const resetLayoutBtn = document.getElementById('globalDebugResetLayoutCompact');
        const resetMotionBtn = document.getElementById('globalDebugResetMotionReduce');
        const toggleHighlightBtn = document.getElementById('globalDebugToggleHighlight');
        const resetHighlightBtn = document.getElementById('globalDebugResetHighlight');
        const sectionTargetSelect = document.getElementById('globalDebugSectionTarget');
        const sectionGoBtn = document.getElementById('globalDebugSectionGo');
        const refreshAreasBtn = document.getElementById('globalDebugRefreshAreas');
        const overviewTitleScaleSelect = document.getElementById('globalDebugOverviewTitleScale');
        const overviewCopyScaleSelect = document.getElementById('globalDebugOverviewCopyScale');
        const overviewAccentInput = document.getElementById('globalDebugOverviewAccent');
        const overviewFadeStyleSelect = document.getElementById('globalDebugOverviewFadeStyle');
        const overviewFadeMsInput = document.getElementById('globalDebugOverviewFadeMs');
        const overviewSequenceScaleSelect = document.getElementById('globalDebugOverviewSequenceScale');
        const resetOverviewTitleScaleBtn = document.getElementById('globalDebugResetOverviewTitleScale');
        const resetOverviewCopyScaleBtn = document.getElementById('globalDebugResetOverviewCopyScale');
        const resetOverviewAccentBtn = document.getElementById('globalDebugResetOverviewAccent');
        const resetOverviewFadeStyleBtn = document.getElementById('globalDebugResetOverviewFadeStyle');
        const resetOverviewFadeMsBtn = document.getElementById('globalDebugResetOverviewFadeMs');
        const resetOverviewSequenceScaleBtn = document.getElementById('globalDebugResetOverviewSequenceScale');
        const overviewInspectTargetNode = document.getElementById('globalDebugOverviewInspectTarget');
        const overviewInspectClearBtn = document.getElementById('globalDebugOverviewInspectClear');
        const overviewInspectColorInput = document.getElementById('globalDebugOverviewInspectColor');
        const resetOverviewInspectColorBtn = document.getElementById('globalDebugOverviewInspectResetColor');
        const overviewInspectFadeStyleSelect = document.getElementById('globalDebugOverviewInspectFadeStyle');
        const resetOverviewInspectFadeStyleBtn = document.getElementById('globalDebugOverviewInspectResetFadeStyle');
        const overviewInspectFadeMsInput = document.getElementById('globalDebugOverviewInspectFadeMs');
        const resetOverviewInspectFadeMsBtn = document.getElementById('globalDebugOverviewInspectResetFadeMs');
        const overviewReplayBtn = document.getElementById('globalDebugOverviewReplay');
        const sequenceScopeSelect = document.getElementById('globalDebugSequenceScope');
        const resetSequenceScopeBtn = document.getElementById('globalDebugSequenceResetScope');
        const sequenceTargetNode = document.getElementById('globalDebugSequenceTarget');
        const clearSequenceTargetBtn = document.getElementById('globalDebugSequenceClearTarget');
        const sequenceOrderSelect = document.getElementById('globalDebugSequenceOrder');
        const resetSequenceOrderBtn = document.getElementById('globalDebugSequenceResetOrder');
        const sequenceStartMsInput = document.getElementById('globalDebugSequenceStartMs');
        const resetSequenceStartMsBtn = document.getElementById('globalDebugSequenceResetStartMs');
        const sequenceStepMsInput = document.getElementById('globalDebugSequenceStepMs');
        const resetSequenceStepMsBtn = document.getElementById('globalDebugSequenceResetStepMs');
        const sequenceDurationMsInput = document.getElementById('globalDebugSequenceDurationMs');
        const resetSequenceDurationMsBtn = document.getElementById('globalDebugSequenceResetDurationMs');
        const sequenceReplayBtn = document.getElementById('globalDebugSequenceReplay');
        const overviewSection = document.getElementById('overview');
        const areaCountNode = document.getElementById('globalDebugAreaCount');
        const areaListNode = document.getElementById('globalDebugAreaList');
        const debugStatus = document.getElementById('globalDebugStatus');
        const portalStatus = document.getElementById('portalStatus');
        const portalFailure = document.getElementById('portalFailure');
        if (
            !portalModal || !defaultContent || !debugMenu
            || !exitDebugBtn || !colorPresetSelect || !textScaleSelect
            || !toggleLayoutBtn || !toggleMotionBtn
            || !resetColorBtn || !resetTextScaleBtn || !resetLayoutBtn || !resetMotionBtn
            || !toggleHighlightBtn || !resetHighlightBtn
            || !sectionTargetSelect || !sectionGoBtn || !refreshAreasBtn
            || !overviewTitleScaleSelect || !overviewCopyScaleSelect || !overviewAccentInput
            || !overviewFadeStyleSelect || !overviewFadeMsInput || !overviewSequenceScaleSelect
            || !resetOverviewTitleScaleBtn || !resetOverviewCopyScaleBtn || !resetOverviewAccentBtn
            || !resetOverviewFadeStyleBtn || !resetOverviewFadeMsBtn || !resetOverviewSequenceScaleBtn
            || !overviewInspectTargetNode || !overviewInspectClearBtn || !overviewInspectColorInput
            || !resetOverviewInspectColorBtn || !overviewInspectFadeStyleSelect || !resetOverviewInspectFadeStyleBtn
            || !overviewInspectFadeMsInput || !resetOverviewInspectFadeMsBtn || !overviewReplayBtn
            || !sequenceScopeSelect || !resetSequenceScopeBtn || !sequenceTargetNode || !clearSequenceTargetBtn
            || !sequenceOrderSelect || !resetSequenceOrderBtn
            || !sequenceStartMsInput || !resetSequenceStartMsBtn
            || !sequenceStepMsInput || !resetSequenceStepMsBtn
            || !sequenceDurationMsInput || !resetSequenceDurationMsBtn || !sequenceReplayBtn
            || !overviewSection
            || !areaCountNode || !areaListNode
        ) {
            return;
        }

        const root = document.documentElement;
        const sectionDebugPanels = Array.from(document.querySelectorAll('[data-debug-panel]'));
        let debugEnabled = false;
        let debugChecked = false;
        let debugCheckPromise = null;
        let debugModeActive = false;
        let selectedOverviewNode = null;
        let lastSequenceTargetSectionId = 'overview';
        const highlightedAreas = new Set();
        let statusTimer = 0;
        const debugDefaults = {
            colorPreset: 'default',
            textScale: 1,
            compactLayout: false,
            reducedMotion: false,
            highlightAreas: false,
            sequenceScope: 'auto',
            sequenceOrder: 'normal',
            sequenceStartMs: 120,
            sequenceStepMs: 140,
            sequenceDurationMs: 1100,
            overviewTitleScale: 1,
            overviewCopyScale: 1,
            overviewAccentColor: '#c3a46b',
            overviewAccentEnabled: false,
            overviewFadeStyle: 'soft',
            overviewFadeMs: 1100,
            overviewSequenceScale: 1
        };
        const debugState = {
            ...debugDefaults
        };

        const notifyDebugStatus = (message) => {
            if (!debugStatus) return;
            debugStatus.textContent = message;
            debugStatus.hidden = false;
            if (statusTimer) {
                window.clearTimeout(statusTimer);
                statusTimer = 0;
            }
            statusTimer = window.setTimeout(() => {
                debugStatus.hidden = true;
                statusTimer = 0;
            }, 1600);
        };

        const getDebugBridge = () => window.__tsiDebugBridge || null;

        const applyGlobalDebugVisuals = () => {
            if (debugState.colorPreset === 'default') {
                root.removeAttribute('data-debug-color-preset');
            } else {
                root.setAttribute('data-debug-color-preset', debugState.colorPreset);
            }
            root.style.setProperty('--debug-text-scale', String(debugState.textScale));
            root.style.setProperty('--debug-sequence-duration', `${debugState.sequenceDurationMs}ms`);
            root.classList.toggle('debug-layout-compact', debugState.compactLayout);
            root.classList.toggle('debug-motion-reduced', debugState.reducedMotion);
        };
        const clampDebugNumber = (rawValue, min, max, fallback) => {
            const next = Number(rawValue);
            if (!Number.isFinite(next)) return fallback;
            return Math.min(max, Math.max(min, Math.round(next)));
        };
        const resolveOverviewFadeEase = (style) => {
            if (style === 'linear') return 'linear';
            if (style === 'sharp') return 'cubic-bezier(0.15, 0.75, 0.2, 1)';
            return 'ease';
        };
        const refreshOverviewDebugPreview = (runSequence = false) => {
            const currentHash = window.location.hash || '#overview';
            if (currentHash !== '#overview' && document.querySelector('.section-wrap:target')) return;
            if (runSequence && typeof window._runOverviewSequence === 'function') {
                window._runOverviewSequence();
                return;
            }
            if (typeof window._fitOverviewToViewport === 'function') {
                window._fitOverviewToViewport();
            }
        };
        const applyOverviewDebugVisuals = (runSequence = false) => {
            root.style.setProperty('--debug-overview-title-scale', String(debugState.overviewTitleScale));
            root.style.setProperty('--debug-overview-copy-scale', String(debugState.overviewCopyScale));
            root.style.setProperty('--debug-overview-fade-ms', `${debugState.overviewFadeMs}ms`);
            root.style.setProperty('--debug-overview-fade-ease', resolveOverviewFadeEase(debugState.overviewFadeStyle));
            root.style.setProperty('--debug-overview-sequence-scale', String(debugState.overviewSequenceScale));
            if (debugState.overviewAccentEnabled) {
                root.style.setProperty('--debug-overview-accent', debugState.overviewAccentColor);
                root.classList.add('debug-overview-accent-active');
            } else {
                root.classList.remove('debug-overview-accent-active');
                root.style.removeProperty('--debug-overview-accent');
            }
            window.__tsiOverviewDebugSequenceScale = debugState.overviewSequenceScale;
            window.__tsiOverviewDebugOrder = debugState.sequenceOrder;
            window.__tsiOverviewDebugStartMs = debugState.sequenceStartMs;
            window.__tsiOverviewDebugStepMs = debugState.sequenceStepMs;
            refreshOverviewDebugPreview(runSequence);
        };
        const parseOverviewFadeMs = (rawValue, fallback = debugDefaults.overviewFadeMs) => {
            const raw = String(rawValue ?? '').trim();
            if (!raw) return fallback;
            const next = Number(raw);
            if (!Number.isFinite(next)) return fallback;
            return Math.min(2600, Math.max(200, Math.round(next)));
        };
        const applyOverviewFadeMsFromInput = (runSequence = true) => {
            debugState.overviewFadeMs = parseOverviewFadeMs(overviewFadeMsInput.value, debugState.overviewFadeMs);
            applyOverviewDebugVisuals(runSequence);
            syncDebugControlLabels();
        };
        const parseColorToHex = (rawValue, fallback = '#c3a46b') => {
            const raw = String(rawValue || '').trim();
            if (!raw) return fallback;
            if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
            if (/^#[0-9a-f]{3}$/i.test(raw)) {
                const normalized = raw.slice(1).toLowerCase();
                return `#${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`;
            }
            const rgba = raw.match(/^rgba?\(([^)]+)\)$/i);
            if (!rgba) return fallback;
            const parts = rgba[1].split(',').map((part) => Number(part.trim()));
            if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) return fallback;
            const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
            return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
        };
        const overviewInspectableSelector = '.reveal-word, .overview-phrase';
        const getOverviewInspectableNodes = () => Array.from(overviewSection.querySelectorAll(overviewInspectableSelector));
        const isOverviewInspectable = (node) => node instanceof HTMLElement && node.matches(overviewInspectableSelector);
        const getOverviewTokenLabel = (node) => {
            if (!(node instanceof HTMLElement)) return 'None';
            const preferred = node.getAttribute('data-debug-label');
            const text = preferred || node.textContent || '';
            const normalized = text.replace(/\s+/g, ' ').trim();
            return normalized || 'Unnamed token';
        };
        const clearOverviewSelectionMarker = () => {
            if (!(selectedOverviewNode instanceof HTMLElement)) return;
            selectedOverviewNode.classList.remove('debug-overview-selected');
        };
        const setOverviewInspectorEnabled = (enabled) => {
            const disabled = !enabled;
            overviewInspectColorInput.disabled = disabled;
            overviewInspectFadeStyleSelect.disabled = disabled;
            overviewInspectFadeMsInput.disabled = disabled;
            resetOverviewInspectColorBtn.disabled = disabled;
            resetOverviewInspectFadeStyleBtn.disabled = disabled;
            resetOverviewInspectFadeMsBtn.disabled = disabled;
        };
        const clearOverviewInspectColor = (node) => {
            if (!(node instanceof HTMLElement)) return;
            delete node.dataset.debugInspectColor;
            node.classList.remove('debug-overview-color-active');
            node.style.removeProperty('--tsi-debug-color');
        };
        const clearOverviewInspectFadeStyle = (node) => {
            if (!(node instanceof HTMLElement)) return;
            delete node.dataset.debugInspectFadeStyle;
            node.style.removeProperty('--tsi-debug-fade-ease');
        };
        const clearOverviewInspectFadeMs = (node) => {
            if (!(node instanceof HTMLElement)) return;
            delete node.dataset.debugInspectFadeMs;
            node.style.removeProperty('--tsi-debug-fade-ms');
        };
        const resetOverviewInspectableNode = (node) => {
            if (!(node instanceof HTMLElement)) return;
            clearOverviewInspectColor(node);
            clearOverviewInspectFadeStyle(node);
            clearOverviewInspectFadeMs(node);
        };
        const clearOverviewInspectSelection = () => {
            clearOverviewSelectionMarker();
            selectedOverviewNode = null;
        };
        const clearAllOverviewInspectableOverrides = () => {
            getOverviewInspectableNodes().forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                node.classList.remove('debug-overview-selected');
                resetOverviewInspectableNode(node);
            });
            selectedOverviewNode = null;
        };
        const syncOverviewInspectorControls = () => {
            const activeNode = selectedOverviewNode;
            if (!isOverviewInspectable(activeNode)) {
                overviewInspectTargetNode.textContent = 'None';
                overviewInspectColorInput.value = parseColorToHex(debugState.overviewAccentColor, '#c3a46b');
                overviewInspectFadeStyleSelect.value = debugState.overviewFadeStyle;
                overviewInspectFadeMsInput.value = String(debugState.overviewFadeMs);
                setOverviewInspectorEnabled(false);
                return;
            }
            overviewInspectTargetNode.textContent = getOverviewTokenLabel(activeNode);
            const activeColor = activeNode.dataset.debugInspectColor
                ? parseColorToHex(activeNode.dataset.debugInspectColor, '#c3a46b')
                : parseColorToHex(window.getComputedStyle(activeNode).color, '#c3a46b');
            overviewInspectColorInput.value = activeColor;
            const fadeStyle = activeNode.dataset.debugInspectFadeStyle || debugState.overviewFadeStyle;
            overviewInspectFadeStyleSelect.value = fadeStyle;
            const fadeMs = parseOverviewFadeMs(activeNode.dataset.debugInspectFadeMs, debugState.overviewFadeMs);
            overviewInspectFadeMsInput.value = String(fadeMs);
            setOverviewInspectorEnabled(true);
        };
        const setSelectedOverviewInspectable = (node) => {
            if (!isOverviewInspectable(node)) return;
            clearOverviewSelectionMarker();
            selectedOverviewNode = node;
            selectedOverviewNode.classList.add('debug-overview-selected');
            syncOverviewInspectorControls();
        };
        const allSequenceSectionIds = ['overview', 'mandate', 'rubric', 'pipeline', 'engagement', 'team'];
        const getActiveTabId = () => {
            const hash = window.location.hash || '#overview';
            const id = hash.startsWith('#') ? hash.slice(1) : 'overview';
            return allSequenceSectionIds.includes(id) ? id : 'overview';
        };
        const updateSequenceTargetLabel = () => {
            if (debugState.sequenceScope === 'all') {
                sequenceTargetNode.textContent = 'all';
                return;
            }
            if (debugState.sequenceScope !== 'auto') {
                sequenceTargetNode.textContent = debugState.sequenceScope;
                return;
            }
            sequenceTargetNode.textContent = lastSequenceTargetSectionId || getActiveTabId();
        };
        const resolveSequenceTargetSections = () => {
            const scope = String(debugState.sequenceScope || 'auto');
            if (scope === 'all') return allSequenceSectionIds.slice();
            if (scope === 'auto') {
                const autoId = lastSequenceTargetSectionId || getActiveTabId();
                return allSequenceSectionIds.includes(autoId) ? [autoId] : ['overview'];
            }
            return allSequenceSectionIds.includes(scope) ? [scope] : ['overview'];
        };
        const replaySectionRevealSequence = (sectionId) => {
            const sectionNode = document.getElementById(sectionId);
            if (!(sectionNode instanceof HTMLElement)) return;
            if (sectionId === 'overview') {
                window.__tsiOverviewDebugOrder = debugState.sequenceOrder;
                window.__tsiOverviewDebugStartMs = debugState.sequenceStartMs;
                window.__tsiOverviewDebugStepMs = debugState.sequenceStepMs;
                if (typeof window._runOverviewSequence === 'function') {
                    window._runOverviewSequence();
                }
                return;
            }
            const targets = Array.from(sectionNode.querySelectorAll('.reveal-text, .asset-image')).filter((node) => {
                if (!(node instanceof HTMLElement)) return false;
                if (node.closest('[data-debug-panel]')) return false;
                return true;
            });
            if (!targets.length) return;
            const ordered = debugState.sequenceOrder === 'reverse' ? targets.slice().reverse() : targets.slice();
            const startDelaySeconds = debugState.sequenceStartMs / 1000;
            const stepDelaySeconds = debugState.sequenceStepMs / 1000;
            ordered.forEach((node, index) => {
                const delay = startDelaySeconds + (stepDelaySeconds * index);
                node.style.setProperty('--reveal-delay', `${Math.max(0, delay).toFixed(3)}s`);
                node.classList.remove('reveal-active');
                if (node.classList.contains('asset-image')) {
                    node.classList.remove('revealed');
                }
            });
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    ordered.forEach((node) => {
                        node.classList.add('reveal-active');
                        if (node.classList.contains('asset-image')) {
                            node.classList.add('revealed');
                        }
                    });
                });
            });
        };

        const loadLocalDebugConfig = async () => {
            if (debugChecked) return debugEnabled;
            if (debugCheckPromise) return debugCheckPromise;
            debugCheckPromise = (async () => {
                try {
                    const module = await import('./debug.local.js');
                    const config = module && (module.default || module.TSI_LOCAL_DEBUG || {});
                    const host = String(window.location.hostname || '').toLowerCase();
                    const allowedHosts = Array.isArray(config.allowedHosts)
                        ? config.allowedHosts.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
                        : [];
                    const allowAnyHost = !allowedHosts.length || allowedHosts.includes('*');
                    const hostAllowed = allowAnyHost || allowedHosts.some((allowedHost) => {
                        if (allowedHost.endsWith('*')) {
                            return host.startsWith(allowedHost.slice(0, -1));
                        }
                        return allowedHost === host;
                    });
                    debugEnabled = Boolean(config && config.enabled === true && hostAllowed);
                } catch (_) {
                    debugEnabled = false;
                }
                debugChecked = true;
                debugCheckPromise = null;
                return debugEnabled;
            })();
            return debugCheckPromise;
        };

        const clearAreaHighlight = () => {
            highlightedAreas.forEach((node) => {
                if (node instanceof HTMLElement) {
                    node.classList.remove('debug-area-highlight');
                }
            });
            highlightedAreas.clear();
        };

        const collectLocalAreas = () => {
            const bridge = getDebugBridge();
            if (!bridge || typeof bridge.scanLocalAreas !== 'function') return [];
            return bridge.scanLocalAreas();
        };

        const applyAreaHighlight = (areas) => {
            clearAreaHighlight();
            if (!debugState.highlightAreas) return;
            areas.forEach((area) => {
                if (!(area && area.element instanceof HTMLElement)) return;
                area.element.classList.add('debug-area-highlight');
                highlightedAreas.add(area.element);
            });
        };

        const renderAreaList = () => {
            const areas = collectLocalAreas();
            areaListNode.innerHTML = '';
            areaCountNode.textContent = String(areas.length);
            if (!areas.length) {
                const li = document.createElement('li');
                li.className = 'portal-debug-area-hidden';
                li.textContent = 'No local test areas detected.';
                areaListNode.appendChild(li);
                applyAreaHighlight([]);
                return;
            }

            areas.forEach((area) => {
                const li = document.createElement('li');
                if (area.hidden) {
                    li.classList.add('portal-debug-area-hidden');
                }
                const sectionLabel = area.sectionId ? ` (#${area.sectionId})` : '';
                const hiddenLabel = area.hidden ? ' [hidden]' : '';
                li.textContent = `${area.label}${sectionLabel}${hiddenLabel}`;
                areaListNode.appendChild(li);
            });
            applyAreaHighlight(areas);
        };

        const syncDebugControlLabels = () => {
            if (colorPresetSelect.value !== debugState.colorPreset) {
                colorPresetSelect.value = debugState.colorPreset;
            }
            const nextTextScaleValue = String(debugState.textScale);
            if (textScaleSelect.value !== nextTextScaleValue) {
                textScaleSelect.value = nextTextScaleValue;
            }
            const overviewTitleScaleValue = String(debugState.overviewTitleScale);
            if (overviewTitleScaleSelect.value !== overviewTitleScaleValue) {
                overviewTitleScaleSelect.value = overviewTitleScaleValue;
            }
            const overviewCopyScaleValue = String(debugState.overviewCopyScale);
            if (overviewCopyScaleSelect.value !== overviewCopyScaleValue) {
                overviewCopyScaleSelect.value = overviewCopyScaleValue;
            }
            if (overviewAccentInput.value.toLowerCase() !== String(debugState.overviewAccentColor).toLowerCase()) {
                overviewAccentInput.value = debugState.overviewAccentColor;
            }
            if (overviewFadeStyleSelect.value !== debugState.overviewFadeStyle) {
                overviewFadeStyleSelect.value = debugState.overviewFadeStyle;
            }
            if (Number(overviewFadeMsInput.value) !== debugState.overviewFadeMs) {
                overviewFadeMsInput.value = String(debugState.overviewFadeMs);
            }
            const overviewSequenceScaleValue = String(debugState.overviewSequenceScale);
            if (overviewSequenceScaleSelect.value !== overviewSequenceScaleValue) {
                overviewSequenceScaleSelect.value = overviewSequenceScaleValue;
            }
            if (sequenceScopeSelect.value !== debugState.sequenceScope) {
                sequenceScopeSelect.value = debugState.sequenceScope;
            }
            if (sequenceOrderSelect.value !== debugState.sequenceOrder) {
                sequenceOrderSelect.value = debugState.sequenceOrder;
            }
            if (Number(sequenceStartMsInput.value) !== debugState.sequenceStartMs) {
                sequenceStartMsInput.value = String(debugState.sequenceStartMs);
            }
            if (Number(sequenceStepMsInput.value) !== debugState.sequenceStepMs) {
                sequenceStepMsInput.value = String(debugState.sequenceStepMs);
            }
            if (Number(sequenceDurationMsInput.value) !== debugState.sequenceDurationMs) {
                sequenceDurationMsInput.value = String(debugState.sequenceDurationMs);
            }
            toggleLayoutBtn.textContent = `Compact: ${debugState.compactLayout ? 'On' : 'Off'}`;
            toggleMotionBtn.textContent = `Reduced: ${debugState.reducedMotion ? 'On' : 'Off'}`;
            toggleHighlightBtn.textContent = debugState.highlightAreas ? 'On' : 'Off';
            updateSequenceTargetLabel();
            syncOverviewInspectorControls();
        };

        const resetPortalAuthMessages = () => {
            if (portalStatus) {
                portalStatus.hidden = true;
                portalStatus.textContent = 'Verifying identity...';
            }
            if (portalFailure) {
                portalFailure.hidden = true;
            }
        };

        const applyModeVisibility = () => {
            defaultContent.hidden = debugModeActive;
            defaultContent.setAttribute('aria-hidden', debugModeActive ? 'true' : 'false');
            debugMenu.hidden = !debugModeActive;
            debugMenu.setAttribute('aria-hidden', debugModeActive ? 'false' : 'true');
            root.classList.toggle('debug-mode-active', debugModeActive);
            sectionDebugPanels.forEach((panel) => {
                if (!(panel instanceof HTMLElement)) return;
                panel.hidden = !debugModeActive;
                panel.setAttribute('aria-hidden', debugModeActive ? 'false' : 'true');
            });
        };

        const resetDebugSettingsToDefaults = () => {
            debugState.colorPreset = debugDefaults.colorPreset;
            debugState.textScale = debugDefaults.textScale;
            debugState.compactLayout = debugDefaults.compactLayout;
            debugState.reducedMotion = debugDefaults.reducedMotion;
            debugState.highlightAreas = debugDefaults.highlightAreas;
            debugState.sequenceScope = debugDefaults.sequenceScope;
            debugState.sequenceOrder = debugDefaults.sequenceOrder;
            debugState.sequenceStartMs = debugDefaults.sequenceStartMs;
            debugState.sequenceStepMs = debugDefaults.sequenceStepMs;
            debugState.sequenceDurationMs = debugDefaults.sequenceDurationMs;
            debugState.overviewTitleScale = debugDefaults.overviewTitleScale;
            debugState.overviewCopyScale = debugDefaults.overviewCopyScale;
            debugState.overviewAccentColor = debugDefaults.overviewAccentColor;
            debugState.overviewAccentEnabled = debugDefaults.overviewAccentEnabled;
            debugState.overviewFadeStyle = debugDefaults.overviewFadeStyle;
            debugState.overviewFadeMs = debugDefaults.overviewFadeMs;
            debugState.overviewSequenceScale = debugDefaults.overviewSequenceScale;
            lastSequenceTargetSectionId = 'overview';
            applyGlobalDebugVisuals();
            applyOverviewDebugVisuals(false);
            clearAllOverviewInspectableOverrides();
            clearAreaHighlight();
        };

        const setDebugMode = (nextActive, options = {}) => {
            const opts = options && typeof options === 'object' ? options : {};
            debugModeActive = Boolean(nextActive);
            if (!debugModeActive && opts.resetSettings !== false) {
                resetDebugSettingsToDefaults();
            }
            if (debugModeActive) {
                // Keep debug inert on initial load; apply debug visuals only after explicit activation.
                applyGlobalDebugVisuals();
                applyOverviewDebugVisuals(false);
            }
            applyModeVisibility();
            syncDebugControlLabels();
            resetPortalAuthMessages();
            if (!debugModeActive) {
                if (debugStatus) debugStatus.hidden = true;
                return;
            }
            renderAreaList();
            if (opts.announce !== false) {
                notifyDebugStatus('Debug mode active.');
            }
        };

        colorPresetSelect.addEventListener('change', () => {
            debugState.colorPreset = colorPresetSelect.value || debugDefaults.colorPreset;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Color preset updated.');
        });
        textScaleSelect.addEventListener('change', () => {
            const next = Number(textScaleSelect.value);
            debugState.textScale = Number.isFinite(next) ? next : debugDefaults.textScale;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Text size updated.');
        });
        toggleLayoutBtn.addEventListener('click', () => {
            debugState.compactLayout = !debugState.compactLayout;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus(debugState.compactLayout ? 'Compact layout on.' : 'Compact layout off.');
        });
        toggleMotionBtn.addEventListener('click', () => {
            debugState.reducedMotion = !debugState.reducedMotion;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus(debugState.reducedMotion ? 'Reduced motion on.' : 'Reduced motion off.');
        });
        resetColorBtn.addEventListener('click', () => {
            debugState.colorPreset = debugDefaults.colorPreset;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Color preset reset.');
        });
        resetTextScaleBtn.addEventListener('click', () => {
            debugState.textScale = debugDefaults.textScale;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Text size reset.');
        });
        resetLayoutBtn.addEventListener('click', () => {
            debugState.compactLayout = debugDefaults.compactLayout;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Layout format reset.');
        });
        resetMotionBtn.addEventListener('click', () => {
            debugState.reducedMotion = debugDefaults.reducedMotion;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Motion mode reset.');
        });
        overviewTitleScaleSelect.addEventListener('change', () => {
            const next = Number(overviewTitleScaleSelect.value);
            debugState.overviewTitleScale = Number.isFinite(next) ? next : debugDefaults.overviewTitleScale;
            applyOverviewDebugVisuals(false);
            syncDebugControlLabels();
            notifyDebugStatus('Overview title size updated.');
        });
        overviewCopyScaleSelect.addEventListener('change', () => {
            const next = Number(overviewCopyScaleSelect.value);
            debugState.overviewCopyScale = Number.isFinite(next) ? next : debugDefaults.overviewCopyScale;
            applyOverviewDebugVisuals(false);
            syncDebugControlLabels();
            notifyDebugStatus('Overview copy size updated.');
        });
        overviewAccentInput.addEventListener('input', () => {
            debugState.overviewAccentColor = overviewAccentInput.value || debugDefaults.overviewAccentColor;
            debugState.overviewAccentEnabled = true;
            applyOverviewDebugVisuals(false);
            syncDebugControlLabels();
            notifyDebugStatus('Overview accent updated.');
        });
        overviewFadeStyleSelect.addEventListener('change', () => {
            debugState.overviewFadeStyle = overviewFadeStyleSelect.value || debugDefaults.overviewFadeStyle;
            applyOverviewDebugVisuals(true);
            syncDebugControlLabels();
            notifyDebugStatus('Overview fade style updated.');
        });
        overviewFadeMsInput.addEventListener('input', () => {
            applyOverviewFadeMsFromInput(true);
        });
        overviewFadeMsInput.addEventListener('change', () => {
            applyOverviewFadeMsFromInput(true);
            notifyDebugStatus('Overview fade timing updated.');
        });
        overviewSequenceScaleSelect.addEventListener('change', () => {
            const next = Number(overviewSequenceScaleSelect.value);
            debugState.overviewSequenceScale = Number.isFinite(next)
                ? Math.min(2, Math.max(0.5, next))
                : debugDefaults.overviewSequenceScale;
            applyOverviewDebugVisuals(true);
            syncDebugControlLabels();
            notifyDebugStatus('Overview load pace updated.');
        });
        resetOverviewTitleScaleBtn.addEventListener('click', () => {
            debugState.overviewTitleScale = debugDefaults.overviewTitleScale;
            applyOverviewDebugVisuals(false);
            syncDebugControlLabels();
            notifyDebugStatus('Overview title size reset.');
        });
        resetOverviewCopyScaleBtn.addEventListener('click', () => {
            debugState.overviewCopyScale = debugDefaults.overviewCopyScale;
            applyOverviewDebugVisuals(false);
            syncDebugControlLabels();
            notifyDebugStatus('Overview copy size reset.');
        });
        resetOverviewAccentBtn.addEventListener('click', () => {
            debugState.overviewAccentColor = debugDefaults.overviewAccentColor;
            debugState.overviewAccentEnabled = debugDefaults.overviewAccentEnabled;
            applyOverviewDebugVisuals(false);
            syncDebugControlLabels();
            notifyDebugStatus('Overview accent reset.');
        });
        resetOverviewFadeStyleBtn.addEventListener('click', () => {
            debugState.overviewFadeStyle = debugDefaults.overviewFadeStyle;
            applyOverviewDebugVisuals(true);
            syncDebugControlLabels();
            notifyDebugStatus('Overview fade style reset.');
        });
        resetOverviewFadeMsBtn.addEventListener('click', () => {
            debugState.overviewFadeMs = debugDefaults.overviewFadeMs;
            applyOverviewDebugVisuals(true);
            syncDebugControlLabels();
            notifyDebugStatus('Overview fade timing reset.');
        });
        resetOverviewSequenceScaleBtn.addEventListener('click', () => {
            debugState.overviewSequenceScale = debugDefaults.overviewSequenceScale;
            applyOverviewDebugVisuals(true);
            syncDebugControlLabels();
            notifyDebugStatus('Overview load pace reset.');
        });
        const applySelectedOverviewInspectColor = () => {
            if (!isOverviewInspectable(selectedOverviewNode)) return;
            const nextColor = parseColorToHex(overviewInspectColorInput.value, '#c3a46b');
            selectedOverviewNode.dataset.debugInspectColor = nextColor;
            selectedOverviewNode.style.setProperty('--tsi-debug-color', nextColor);
            selectedOverviewNode.classList.add('debug-overview-color-active');
            syncOverviewInspectorControls();
        };
        const applySelectedOverviewInspectFadeStyle = () => {
            if (!isOverviewInspectable(selectedOverviewNode)) return;
            const nextStyle = String(overviewInspectFadeStyleSelect.value || debugState.overviewFadeStyle);
            selectedOverviewNode.dataset.debugInspectFadeStyle = nextStyle;
            selectedOverviewNode.style.setProperty('--tsi-debug-fade-ease', resolveOverviewFadeEase(nextStyle));
            syncOverviewInspectorControls();
        };
        const applySelectedOverviewInspectFadeMs = () => {
            if (!isOverviewInspectable(selectedOverviewNode)) return;
            const nextMs = parseOverviewFadeMs(overviewInspectFadeMsInput.value, debugState.overviewFadeMs);
            selectedOverviewNode.dataset.debugInspectFadeMs = String(nextMs);
            selectedOverviewNode.style.setProperty('--tsi-debug-fade-ms', `${nextMs}ms`);
            syncOverviewInspectorControls();
        };
        overviewSection.addEventListener('click', (event) => {
            if (!debugModeActive) return;
            if (!(event.target instanceof Element)) return;
            const inspectTarget = event.target.closest(overviewInspectableSelector);
            if (!isOverviewInspectable(inspectTarget)) return;
            setSelectedOverviewInspectable(inspectTarget);
            notifyDebugStatus(`Selected: ${getOverviewTokenLabel(inspectTarget)}.`);
        });
        overviewInspectClearBtn.addEventListener('click', () => {
            clearOverviewInspectSelection();
            syncOverviewInspectorControls();
            notifyDebugStatus('Overview selection cleared.');
        });
        overviewInspectColorInput.addEventListener('input', () => {
            applySelectedOverviewInspectColor();
        });
        overviewInspectColorInput.addEventListener('change', () => {
            applySelectedOverviewInspectColor();
            notifyDebugStatus('Element color updated.');
        });
        overviewInspectFadeStyleSelect.addEventListener('change', () => {
            applySelectedOverviewInspectFadeStyle();
            notifyDebugStatus('Element fade style updated.');
        });
        overviewInspectFadeMsInput.addEventListener('input', () => {
            applySelectedOverviewInspectFadeMs();
        });
        overviewInspectFadeMsInput.addEventListener('change', () => {
            applySelectedOverviewInspectFadeMs();
            notifyDebugStatus('Element fade timing updated.');
        });
        resetOverviewInspectColorBtn.addEventListener('click', () => {
            if (!isOverviewInspectable(selectedOverviewNode)) return;
            clearOverviewInspectColor(selectedOverviewNode);
            syncOverviewInspectorControls();
            notifyDebugStatus('Element color reset.');
        });
        resetOverviewInspectFadeStyleBtn.addEventListener('click', () => {
            if (!isOverviewInspectable(selectedOverviewNode)) return;
            clearOverviewInspectFadeStyle(selectedOverviewNode);
            syncOverviewInspectorControls();
            notifyDebugStatus('Element fade style reset.');
        });
        resetOverviewInspectFadeMsBtn.addEventListener('click', () => {
            if (!isOverviewInspectable(selectedOverviewNode)) return;
            clearOverviewInspectFadeMs(selectedOverviewNode);
            syncOverviewInspectorControls();
            notifyDebugStatus('Element fade timing reset.');
        });
        overviewReplayBtn.addEventListener('click', () => {
            refreshOverviewDebugPreview(true);
            notifyDebugStatus('Overview sequence replayed.');
        });
        sequenceScopeSelect.addEventListener('change', () => {
            const nextScope = String(sequenceScopeSelect.value || debugDefaults.sequenceScope);
            debugState.sequenceScope = nextScope;
            syncDebugControlLabels();
            notifyDebugStatus('Sequence scope updated.');
        });
        sequenceOrderSelect.addEventListener('change', () => {
            debugState.sequenceOrder = sequenceOrderSelect.value === 'reverse' ? 'reverse' : 'normal';
            syncDebugControlLabels();
            notifyDebugStatus('Sequence order updated.');
        });
        sequenceStartMsInput.addEventListener('input', () => {
            debugState.sequenceStartMs = clampDebugNumber(sequenceStartMsInput.value, 0, 4000, debugDefaults.sequenceStartMs);
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
        });
        sequenceStartMsInput.addEventListener('change', () => {
            debugState.sequenceStartMs = clampDebugNumber(sequenceStartMsInput.value, 0, 4000, debugDefaults.sequenceStartMs);
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Sequence start delay updated.');
        });
        sequenceStepMsInput.addEventListener('input', () => {
            debugState.sequenceStepMs = clampDebugNumber(sequenceStepMsInput.value, 20, 2000, debugDefaults.sequenceStepMs);
            syncDebugControlLabels();
        });
        sequenceStepMsInput.addEventListener('change', () => {
            debugState.sequenceStepMs = clampDebugNumber(sequenceStepMsInput.value, 20, 2000, debugDefaults.sequenceStepMs);
            syncDebugControlLabels();
            notifyDebugStatus('Sequence step delay updated.');
        });
        sequenceDurationMsInput.addEventListener('input', () => {
            debugState.sequenceDurationMs = clampDebugNumber(sequenceDurationMsInput.value, 120, 4000, debugDefaults.sequenceDurationMs);
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
        });
        sequenceDurationMsInput.addEventListener('change', () => {
            debugState.sequenceDurationMs = clampDebugNumber(sequenceDurationMsInput.value, 120, 4000, debugDefaults.sequenceDurationMs);
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Sequence fade timing updated.');
        });
        resetSequenceScopeBtn.addEventListener('click', () => {
            debugState.sequenceScope = debugDefaults.sequenceScope;
            syncDebugControlLabels();
            notifyDebugStatus('Sequence scope reset.');
        });
        clearSequenceTargetBtn.addEventListener('click', () => {
            lastSequenceTargetSectionId = getActiveTabId();
            syncDebugControlLabels();
            notifyDebugStatus('Click target reset.');
        });
        resetSequenceOrderBtn.addEventListener('click', () => {
            debugState.sequenceOrder = debugDefaults.sequenceOrder;
            syncDebugControlLabels();
            notifyDebugStatus('Sequence order reset.');
        });
        resetSequenceStartMsBtn.addEventListener('click', () => {
            debugState.sequenceStartMs = debugDefaults.sequenceStartMs;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Sequence start delay reset.');
        });
        resetSequenceStepMsBtn.addEventListener('click', () => {
            debugState.sequenceStepMs = debugDefaults.sequenceStepMs;
            syncDebugControlLabels();
            notifyDebugStatus('Sequence step delay reset.');
        });
        resetSequenceDurationMsBtn.addEventListener('click', () => {
            debugState.sequenceDurationMs = debugDefaults.sequenceDurationMs;
            applyGlobalDebugVisuals();
            syncDebugControlLabels();
            notifyDebugStatus('Sequence fade timing reset.');
        });
        sequenceReplayBtn.addEventListener('click', () => {
            const sections = resolveSequenceTargetSections();
            sections.forEach((sectionId) => replaySectionRevealSequence(sectionId));
            notifyDebugStatus(`Replayed sequence: ${sections.join(', ')}.`);
        });
        document.addEventListener('click', (event) => {
            if (!debugModeActive) return;
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('#portalModal, #accessModal, [data-debug-panel]')) return;
            const sectionNode = event.target.closest('.section-wrap');
            if (!(sectionNode instanceof HTMLElement)) return;
            const sectionId = String(sectionNode.id || '').trim();
            if (!allSequenceSectionIds.includes(sectionId)) return;
            lastSequenceTargetSectionId = sectionId;
            syncDebugControlLabels();
        });

        toggleHighlightBtn.addEventListener('click', () => {
            debugState.highlightAreas = !debugState.highlightAreas;
            syncDebugControlLabels();
            renderAreaList();
            notifyDebugStatus(debugState.highlightAreas ? 'Area highlight on.' : 'Area highlight off.');
        });
        resetHighlightBtn.addEventListener('click', () => {
            debugState.highlightAreas = debugDefaults.highlightAreas;
            syncDebugControlLabels();
            renderAreaList();
            notifyDebugStatus('Area highlight reset.');
        });

        sectionGoBtn.addEventListener('click', () => {
            const target = String(sectionTargetSelect.value || '').trim();
            if (!target) return;
            window.location.hash = `#${target}`;
            toggleModal('portalModal', false);
        });
        refreshAreasBtn.addEventListener('click', () => {
            renderAreaList();
            notifyDebugStatus('Area scan refreshed.');
        });
        exitDebugBtn.addEventListener('click', () => {
            setDebugMode(false, { resetSettings: true, announce: false });
            notifyDebugStatus('Debug menu closed.');
        });

        portalModal.addEventListener('tsi:modal-visibility', (event) => {
            const open = Boolean(event && event.detail && event.detail.open);
            if (open) {
                applyModeVisibility();
                syncDebugControlLabels();
                if (debugModeActive) {
                    renderAreaList();
                }
            }
            if (debugStatus) {
                debugStatus.hidden = true;
            }
        });
        window.addEventListener('tsi:local-test-areas-changed', () => {
            if (debugModeActive) {
                renderAreaList();
            }
        });

        // Do not apply debug visuals during initial load.
        syncDebugControlLabels();
        applyModeVisibility();

        window.__tsiPortalDebugApi = {
            toggleFromPortalInput: async () => {
                if (!isPortalModalOpen()) return false;
                const enabled = await loadLocalDebugConfig();
                if (!enabled) return false;
                setDebugMode(true, { resetSettings: false });
                return true;
            }
        };
    }

    initModalTriggers();
    initMobileNav();
    _021026_initConciergeForm();
    initPortalOptions();
    initHoldToClear();
    initRubricActions();
    initTeamTabs();
    initGlobalDebugMenu();
    let pipelineMapInitialized = false;
    const ensurePipelineMapInitialized = () => {
        if (pipelineMapInitialized) return;
        initPipelineMap();
        pipelineMapInitialized = true;
        window.dispatchEvent(new CustomEvent('tsi:local-test-areas-changed'));
    };

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
        const overviewContent = overview.querySelector('.overview-content') || overview;
        const tagline = overview.querySelector('.overview-tagline');
        const lines = overview.querySelectorAll('.overview-line');
        const overviewCopy = overview.querySelector('.overview-copy');
        const overviewPhrases = overview.querySelectorAll('.overview-phrase');
        const overviewContinue = overview.querySelector('.overview-continue');
        const baseLineGap = 1.5;
        const baseWordGap = 0.7;
        const basePhraseGap = 1.6;
        const overviewTimers = [];
        let lastFitViewportWidth = window.innerWidth || 0;
        let lastFitViewportHeight = window.innerHeight || 0;
        let didInitialOverviewAutoAdvance = false;

        const clearOverviewTimers = () => {
            overviewTimers.forEach(timer => window.clearTimeout(timer));
            overviewTimers.length = 0;
        };

        const fitOverviewToViewport = () => {
            const nav = document.querySelector('nav');
            const navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
            if (navHeight > 0) {
                document.documentElement.style.setProperty('--nav-current-height', `${navHeight}px`);
            }
            overview.style.setProperty('--overview-fit-scale', '1');
            const currentHash = window.location.hash || '#overview';
            const overviewActive = currentHash === '#overview' || !document.querySelector('.section-wrap:target');
            if (!overviewActive) return;

            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            if (!viewportHeight) return;
            const computed = window.getComputedStyle(overview);
            const padTop = parseFloat(computed.paddingTop) || 0;
            const padBottom = parseFloat(computed.paddingBottom) || 0;
            const reserved = padTop + padBottom + 8;
            const available = viewportHeight - navHeight - reserved;
            const contentHeight = overviewContent ? overviewContent.scrollHeight : 0;
            let heightRatio = 1;
            if (available > 0 && contentHeight > 0) {
                heightRatio = available / contentHeight;
            }

            let widthRatio = 1;
            if (overviewCopy) {
                const copyLines = overviewCopy.querySelectorAll('.overview-copy-line');
                copyLines.forEach((line) => {
                    const lineClientWidth = line.clientWidth || 0;
                    const lineScrollWidth = line.scrollWidth || 0;
                    if (lineClientWidth > 0 && lineScrollWidth > lineClientWidth) {
                        widthRatio = Math.min(widthRatio, lineClientWidth / lineScrollWidth);
                    }
                });
            }

            const ratio = Math.min(heightRatio, widthRatio);
            if (ratio >= 1) return;
            const nextScale = Math.min(1, Math.max(0.5, ratio));
            overview.style.setProperty('--overview-fit-scale', nextScale.toFixed(3));
        };

        let overviewFitRaf = 0;
        const scheduleOverviewFit = () => {
            if (overviewFitRaf) {
                window.cancelAnimationFrame(overviewFitRaf);
            }
            overviewFitRaf = window.requestAnimationFrame(() => {
                overviewFitRaf = 0;
                fitOverviewToViewport();
            });
        };

        const schedule = (fn, delaySeconds) => {
            const timer = window.setTimeout(fn, Math.max(delaySeconds, 0) * 1000);
            overviewTimers.push(timer);
        };

        let overviewHasPlayedOnce = false;
        const runOverviewSequence = (options = {}) => {
            const opts = options && typeof options === 'object' ? options : {};
            const forceFull = Boolean(opts.forceFull);
            scheduleOverviewFit();
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
            overview.classList.remove('is-auto-transition-out');

            void overview.offsetWidth;
            const showSyncedRevisit = overviewHasPlayedOnce && !forceFull;
            if (showSyncedRevisit) {
                // Revisit behavior: synchronized, gentle 1s fade for overview content.
                overview.style.setProperty('--tsi-debug-fade-ms', '1000ms');
                overview.style.setProperty('--tsi-debug-fade-ease', 'ease');
                revealItems.forEach(item => item.style.setProperty('--reveal-delay', '0s'));
                requestAnimationFrame(() => {
                    revealItems.forEach(item => item.classList.add('reveal-active'));
                    if (overviewCopy) overviewCopy.classList.add('is-body-visible');
                    overviewPhrases.forEach(phrase => phrase.classList.add('is-phrase-visible'));
                    if (overviewContinue) overviewContinue.classList.add('is-visible');
                });
                return;
            }
            overview.style.removeProperty('--tsi-debug-fade-ms');
            overview.style.removeProperty('--tsi-debug-fade-ease');

            const rawStartMs = Number(window.__tsiOverviewDebugStartMs);
            const startDelaySeconds = Number.isFinite(rawStartMs)
                ? Math.min(4, Math.max(0, rawStartMs / 1000))
                : 0.2;
            const rawStepMs = Number(window.__tsiOverviewDebugStepMs);
            const stepMs = Number.isFinite(rawStepMs)
                ? Math.min(2000, Math.max(40, rawStepMs))
                : 700;
            const orderMode = window.__tsiOverviewDebugOrder === 'reverse' ? 'reverse' : 'normal';
            let delay = startDelaySeconds;
            let maxWordDelay = 0;
            const rawSequenceScale = Number(window.__tsiOverviewDebugSequenceScale);
            const sequenceScale = Number.isFinite(rawSequenceScale)
                ? Math.min(2, Math.max(0.5, rawSequenceScale))
                : 1;
            const lineGap = ((stepMs / 1000) * (baseLineGap / baseWordGap)) * sequenceScale;
            const wordGap = (stepMs / 1000) * sequenceScale;
            const phraseGap = ((stepMs / 1000) * (basePhraseGap / baseWordGap)) * sequenceScale;
            const lineNodes = Array.from(lines);
            const phraseNodes = Array.from(overviewPhrases);
            if (orderMode === 'reverse') {
                lineNodes.reverse();
                phraseNodes.reverse();
            }

            if (tagline) {
                tagline.style.setProperty('--reveal-delay', `${delay}s`);
                delay += lineGap;
            }

            lineNodes.forEach(line => {
                const words = Array.from(line.querySelectorAll('.reveal-word'));
                if (orderMode === 'reverse') words.reverse();
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
                phraseNodes.forEach((phrase, idx) => {
                    const phraseDelay = phraseStartDelay + idx * phraseGap;
                    schedule(() => {
                        phrase.classList.add('is-phrase-visible');
                    }, phraseDelay);
                });

                const bodyDelay = phraseStartDelay + (phraseNodes.length * phraseGap) + 0.3;
                schedule(() => {
                    overviewCopy.classList.add('is-body-visible');
                }, bodyDelay);

                if (overviewContinue) {
                    const continueDelay = bodyDelay + 1.0;
                    schedule(() => {
                        overviewContinue.classList.add('is-visible');
                        // First visual load: hold, then fade out and auto-advance to mandate once.
                        if (!didInitialOverviewAutoAdvance) {
                            didInitialOverviewAutoAdvance = true;
                            const autoAdvanceHoldSeconds = 3;
                            const autoAdvanceFadeSeconds = 0.6;
                            window.setTimeout(() => {
                                const currentHash = window.location.hash || '#overview';
                                if (currentHash === '#overview') {
                                    overview.classList.add('is-auto-transition-out');
                                }
                            }, Math.max(0, autoAdvanceHoldSeconds * 1000));
                            window.setTimeout(() => {
                                const currentHash = window.location.hash || '#overview';
                                if (currentHash === '#overview') {
                                    window.location.hash = '#mandate';
                                }
                                overview.classList.remove('is-auto-transition-out');
                            }, Math.max(0, (autoAdvanceHoldSeconds + autoAdvanceFadeSeconds) * 1000));
                        }
                    }, continueDelay);
                }
            }
            overviewHasPlayedOnce = true;
        };

        window._runOverviewSequence = runOverviewSequence;
        window._fitOverviewToViewport = fitOverviewToViewport;
        window.addEventListener('resize', () => {
            const nextWidth = window.innerWidth || 0;
            const nextHeight = window.innerHeight || 0;
            const widthDelta = Math.abs(nextWidth - lastFitViewportWidth);
            const heightDelta = Math.abs(nextHeight - lastFitViewportHeight);
            lastFitViewportWidth = nextWidth;
            lastFitViewportHeight = nextHeight;

            // Ignore small mobile browser-chrome height jitter while scrolling.
            if (widthDelta < 2 && heightDelta < 120) return;
            scheduleOverviewFit();
        });
        window.addEventListener('orientationchange', scheduleOverviewFit);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) scheduleOverviewFit();
        });
        scheduleOverviewFit();

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
    const stabilizeViewportTop = () => {
        jumpViewportToTop();
        requestAnimationFrame(() => {
            jumpViewportToTop();
        });
        window.setTimeout(() => {
            jumpViewportToTop();
        }, 80);
    };

    function setActiveTabFromHash(options = {}) {
        const shouldResetScroll = options.resetScroll !== false;
        const hash = window.location.hash || '#overview';
        const tabId = hash.startsWith('#') ? hash.slice(1) : 'overview';
        const targetExists = document.getElementById(tabId);
        const resolvedId = targetExists ? tabId : 'overview';
        if (resolvedId === 'pipeline') {
            ensurePipelineMapInitialized();
        }
        const sections = document.querySelectorAll('.section-wrap');
        sections.forEach((section) => {
            if (!(section instanceof HTMLElement)) return;
            section.style.display = section.id === resolvedId ? 'block' : 'none';
        });

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
        document.querySelectorAll('[data-mobile-nav-link]').forEach(link => {
            const isActive = link.getAttribute('href') === `#${resolvedId}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (resolvedId === 'overview' && typeof window._runOverviewSequence === 'function') {
            window._runOverviewSequence();
            if (typeof window._fitOverviewToViewport === 'function') {
                window._fitOverviewToViewport();
            }
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

    window.addEventListener('hashchange', () => {
        if (typeof window._closeMobileNav === 'function') {
            window._closeMobileNav({ restoreFocus: false });
        }
        setActiveTabFromHash({ resetScroll: false });
        stabilizeViewportTop();
    });
    setActiveTabFromHash({ resetScroll: false });
    stabilizeViewportTop();

    function initMobileNav() {
        const toggle = document.getElementById('mobileNavToggle');
        const drawer = document.getElementById('mobileNavDrawer');
        const closeBtn = document.getElementById('mobileNavClose');
        const backdrop = document.getElementById('mobileNavBackdrop');
        if (!toggle || !drawer || !backdrop || !closeBtn) return;

        let restoreFocusTarget = null;
        let scrollLockY = 0;
        const isDesktop = () => window.innerWidth > MOBILE_NAV_BREAKPOINT;
        const lockMobileBodyScroll = () => {
            scrollLockY = window.scrollY || window.pageYOffset || 0;
            document.body.style.position = 'fixed';
            document.body.style.top = `${-scrollLockY}px`;
            document.body.style.width = '100%';
        };
        const unlockMobileBodyScroll = () => {
            const topValue = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            if (topValue) {
                const restoredY = Math.abs(parseInt(topValue, 10)) || scrollLockY || 0;
                window.scrollTo(0, restoredY);
            }
        };

        const getDrawerFocusable = () => Array.from(drawer.querySelectorAll(MODAL_FOCUS_SELECTOR)).filter((node) => {
            if (!(node instanceof HTMLElement)) return false;
            if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            return node.offsetParent !== null || style.position === 'fixed';
        });

        const closeMobileNav = (options = {}) => {
            const shouldRestoreFocus = options.restoreFocus !== false;
            if (!drawer.classList.contains('is-open')) return;
            document.body.classList.remove('mobile-nav-open');
            unlockMobileBodyScroll();
            drawer.classList.remove('is-open');
            drawer.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open site navigation');
            backdrop.classList.remove('is-open');
            window.setTimeout(() => {
                if (!drawer.classList.contains('is-open')) {
                    backdrop.hidden = true;
                }
            }, 240);
            if (shouldRestoreFocus) {
                const target = restoreFocusTarget && typeof restoreFocusTarget.focus === 'function'
                    ? restoreFocusTarget
                    : toggle;
                target.focus();
            }
            restoreFocusTarget = null;
        };

        const openMobileNav = () => {
            if (isDesktop()) return;
            restoreFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
            document.body.classList.add('mobile-nav-open');
            lockMobileBodyScroll();
            backdrop.hidden = false;
            window.requestAnimationFrame(() => {
                backdrop.classList.add('is-open');
            });
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Close site navigation');
            const focusable = getDrawerFocusable();
            if (focusable.length) {
                focusable[0].focus();
            } else {
                drawer.setAttribute('tabindex', '-1');
                drawer.focus();
            }
        };

        toggle.addEventListener('click', () => {
            if (drawer.classList.contains('is-open')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
        closeBtn.addEventListener('click', () => closeMobileNav());
        backdrop.addEventListener('click', () => closeMobileNav());
        document.addEventListener('pointerdown', (event) => {
            if (!drawer.classList.contains('is-open')) return;
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (drawer.contains(target) || toggle.contains(target)) return;
            closeMobileNav({ restoreFocus: false });
        });
        drawer.querySelectorAll('[data-mobile-nav-link]').forEach(link => {
            link.addEventListener('click', () => closeMobileNav({ restoreFocus: false }));
        });
        drawer.querySelectorAll('[data-modal-open]').forEach(button => {
            button.addEventListener('click', () => closeMobileNav({ restoreFocus: false }));
        });

        window.addEventListener('keydown', (event) => {
            if (!drawer.classList.contains('is-open')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMobileNav();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = getDrawerFocusable();
            if (!focusable.length) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey) {
                if (active === first || active === drawer) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }
            if (active === last) {
                event.preventDefault();
                first.focus();
            }
        });

        document.addEventListener('focusin', (event) => {
            if (!drawer.classList.contains('is-open')) return;
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (drawer.contains(target) || target === toggle) return;
            const focusable = getDrawerFocusable();
            if (focusable.length) {
                focusable[0].focus();
            } else {
                drawer.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (isDesktop()) {
                closeMobileNav({ restoreFocus: false });
            }
        });

        window._closeMobileNav = closeMobileNav;
    }

    function initRubricActions() {
        const root = document.querySelector('[data-rubric-protocol]');
        if (!root) return;
        const stage = root.querySelector('[data-rubric-stage]');
        const toggles = Array.from(root.querySelectorAll('[data-protocol-toggle]'));
        const views = Array.from(root.querySelectorAll('[data-protocol-view]'));
        if (!stage || toggles.length < 2 || views.length < 2) return;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const transitionMs = 400;
        let activeKey = 'diagnostic';
        let isAnimating = false;

        const viewByKey = new Map(views.map(view => [view.getAttribute('data-protocol-view'), view]));
        const setStageHeightFor = (view) => {
            if (!(view instanceof HTMLElement) || !(stage instanceof HTMLElement)) return;
            const targetHeight = view.scrollHeight;
            if (targetHeight > 0) {
                stage.style.height = `${targetHeight}px`;
            }
        };
        const syncToggleState = (nextKey) => {
            toggles.forEach((toggle) => {
                const selected = toggle.getAttribute('data-protocol-toggle') === nextKey;
                toggle.classList.toggle('is-active', selected);
                toggle.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        };
        const clearMotionClasses = (view) => {
            view.classList.remove('is-enter-from-right', 'is-enter-from-left', 'is-exit-to-left', 'is-exit-to-right');
        };
        const finalizeView = (nextKey, currentView, nextView) => {
            views.forEach((view) => {
                const isActive = view === nextView;
                view.classList.toggle('is-active', isActive);
                view.hidden = !isActive;
                view.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                clearMotionClasses(view);
            });
            activeKey = nextKey;
            syncToggleState(nextKey);
            setStageHeightFor(nextView);
            isAnimating = false;
        };
        const switchProtocol = (nextKey) => {
            if (isAnimating || !nextKey || nextKey === activeKey) return;
            const currentView = viewByKey.get(activeKey);
            const nextView = viewByKey.get(nextKey);
            if (!currentView || !nextView) return;
            const forward = activeKey === 'diagnostic' && nextKey === 'deployment';
            if (prefersReducedMotion) {
                finalizeView(nextKey, currentView, nextView);
                return;
            }
            isAnimating = true;
            nextView.hidden = false;
            nextView.setAttribute('aria-hidden', 'false');
            clearMotionClasses(currentView);
            clearMotionClasses(nextView);
            nextView.classList.add('is-enter-from-right');
            if (!forward) nextView.classList.replace('is-enter-from-right', 'is-enter-from-left');
            nextView.classList.add('is-active');
            setStageHeightFor(nextView);
            void nextView.offsetWidth;
            currentView.classList.add(forward ? 'is-exit-to-left' : 'is-exit-to-right');
            nextView.classList.remove(forward ? 'is-enter-from-right' : 'is-enter-from-left');
            window.setTimeout(() => {
                finalizeView(nextKey, currentView, nextView);
            }, transitionMs + 24);
        };

        toggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const nextKey = toggle.getAttribute('data-protocol-toggle');
                switchProtocol(nextKey);
            });
        });

        const initialView = viewByKey.get(activeKey) || views[0];
        views.forEach((view) => {
            const isActive = view === initialView;
            view.classList.toggle('is-active', isActive);
            view.hidden = !isActive;
            view.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            clearMotionClasses(view);
        });
        activeKey = initialView.getAttribute('data-protocol-view') || 'diagnostic';
        syncToggleState(activeKey);
        setStageHeightFor(initialView);
        window.addEventListener('resize', () => {
            if (isAnimating) return;
            const activeView = viewByKey.get(activeKey);
            if (activeView) setStageHeightFor(activeView);
        });
    }

    function initTeamTabs() {
        const tabs = Array.from(document.querySelectorAll('.team-tab'));
        if (!tabs.length) return;
        const panels = Array.from(document.querySelectorAll('.team-panel'));
        const panelWrap = document.querySelector('.team-panels');
        if (!panels.length || !panelWrap) return;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const transitionMs = 400;
        let isAnimating = false;
        let activeIdx = Math.max(0, tabs.findIndex(tab => tab.classList.contains('is-active')));
        if (activeIdx >= tabs.length) activeIdx = 0;
        const panelByKey = new Map(panels.map(panel => [panel.getAttribute('data-team-panel'), panel]));
        const clearMotionClasses = (panel) => {
            panel.classList.remove('is-enter-from-right', 'is-enter-from-left', 'is-exit-to-left', 'is-exit-to-right');
        };
        const setWrapHeightFor = (panel) => {
            if (!(panel instanceof HTMLElement)) return;
            const targetHeight = panel.scrollHeight;
            if (targetHeight > 0) {
                panelWrap.style.height = `${targetHeight}px`;
            }
        };
        const setActiveTabVisual = (idx) => {
            tabs.forEach((tab, tabIdx) => {
                const selected = tabIdx === idx;
                tab.classList.toggle('is-active', selected);
                tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        };
        const finalizePanels = (idx, activePanel) => {
            panels.forEach((panel) => {
                const isActive = panel === activePanel;
                panel.classList.toggle('is-active', isActive);
                panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                panel.hidden = !isActive;
                clearMotionClasses(panel);
            });
            activeIdx = idx;
            setActiveTabVisual(idx);
            setWrapHeightFor(activePanel);
            isAnimating = false;
        };
        const switchTo = (nextIdx) => {
            if (isAnimating || nextIdx === activeIdx || nextIdx < 0 || nextIdx >= tabs.length) return;
            const currentTab = tabs[activeIdx];
            const nextTab = tabs[nextIdx];
            const currentKey = currentTab.getAttribute('data-team-target');
            const nextKey = nextTab.getAttribute('data-team-target');
            const currentPanel = currentKey ? panelByKey.get(currentKey) : null;
            const nextPanel = nextKey ? panelByKey.get(nextKey) : null;
            if (!currentPanel || !nextPanel) return;
            const forward = nextIdx > activeIdx;
            if (prefersReducedMotion) {
                finalizePanels(nextIdx, nextPanel);
                return;
            }
            isAnimating = true;
            nextPanel.hidden = false;
            nextPanel.setAttribute('aria-hidden', 'false');
            clearMotionClasses(currentPanel);
            clearMotionClasses(nextPanel);
            nextPanel.classList.add(forward ? 'is-enter-from-right' : 'is-enter-from-left');
            nextPanel.classList.add('is-active');
            setWrapHeightFor(nextPanel);
            void nextPanel.offsetWidth;
            currentPanel.classList.add(forward ? 'is-exit-to-left' : 'is-exit-to-right');
            nextPanel.classList.remove(forward ? 'is-enter-from-right' : 'is-enter-from-left');
            window.setTimeout(() => {
                finalizePanels(nextIdx, nextPanel);
            }, transitionMs + 24);
        };

        tabs.forEach((tab, idx) => {
            tab.addEventListener('click', () => {
                switchTo(idx);
            });
        });

        const initialKey = tabs[activeIdx].getAttribute('data-team-target');
        const initialPanel = initialKey ? panelByKey.get(initialKey) : panels[0];
        finalizePanels(activeIdx, initialPanel || panels[0]);
        window.addEventListener('resize', () => {
            if (isAnimating) return;
            const key = tabs[activeIdx] ? tabs[activeIdx].getAttribute('data-team-target') : null;
            const activePanel = key ? panelByKey.get(key) : null;
            if (activePanel) setWrapHeightFor(activePanel);
        });
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
        let mapTestsVisible = false;
        const syncMapTestsVisibility = () => {
            document.querySelectorAll('[data-map-tests], [data-test-settings]').forEach(node => {
                node.hidden = !mapTestsVisible;
                node.setAttribute('aria-hidden', mapTestsVisible ? 'false' : 'true');
                node.style.display = mapTestsVisible ? '' : 'none';
            });
        };
        const setMapTestsVisible = (nextVisible) => {
            mapTestsVisible = Boolean(nextVisible);
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
            if (!frame.dataset.mapPointerMode) frame.dataset.mapPointerMode = 'flash';
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
                const overrideSet = typeof overrideStyle.sourceSet === 'string' ? overrideStyle.sourceSet.toLowerCase() : '';
                const deferOverrideReveal = overrideSet === 'texas' && overrideStyle.deferLoad === true;
                const hasColor = Boolean(overrideStyle.color);
                const hasColor2 = Boolean(overrideStyle.color2);
                const hasBlink = Boolean(overrideStyle.blink);
                if (deferOverrideReveal) {
                    classes.push('map-dot--deferred-load');
                    dot.dataset.mapDeferredOverride = overrideSet;
                }
                if (hasColor) {
                    if (deferOverrideReveal) {
                        dot.dataset.mapPendingOverrideColor = overrideStyle.color;
                    } else {
                        classes.push('map-dot--override');
                        dot.style.fill = overrideStyle.color;
                    }
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
                        let blinkClass = '';
                        if ((resolvedBlinkMode === 'glow' || resolvedBlinkMode === 'blend') && hasColor) {
                            const glowFrom = hasColor2 ? overrideStyle.color : baseFill;
                            const glowTo = hasColor2 ? overrideStyle.color2 : overrideStyle.color;
                            dot.style.setProperty('--map-dot-glow-from', glowFrom);
                            dot.style.setProperty('--map-dot-glow-to', glowTo);
                            blinkClass = `map-dot--blink-${resolvedBlinkMode}`;
                        } else if (resolvedBlinkMode === 'glow' || resolvedBlinkMode === 'blend') {
                            if (hasColor2) {
                                dot.style.setProperty('--map-dot-glow-from', baseFill);
                                dot.style.setProperty('--map-dot-glow-to', overrideStyle.color2);
                                blinkClass = `map-dot--blink-${resolvedBlinkMode}`;
                            } else {
                                blinkClass = 'map-dot--blink-fade';
                            }
                        } else {
                            blinkClass = `map-dot--blink-${resolvedBlinkMode}`;
                        }
                        const phaseMode = overrideStyle.phase || 'sync';
                        let blinkDelay = '';
                        if (phaseMode === 'async') {
                            const delaySec = resolveAsyncBlinkDelay(resolvedBlinkMode, gridX, gridY);
                            blinkDelay = `-${delaySec.toFixed(3)}s`;
                        }
                        if (deferOverrideReveal) {
                            if (blinkClass) dot.dataset.mapPendingBlinkClass = blinkClass;
                            if (blinkDelay) dot.dataset.mapPendingBlinkDelay = blinkDelay;
                        } else {
                            if (blinkClass) classes.push(blinkClass);
                            if (blinkDelay) dot.style.setProperty('--map-dot-blink-delay', blinkDelay);
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
        const mapLocationSuffixes = [
            'United States (Texas)',
            'El Salvador',
            'Costa Rica',
            'Puerto Rico',
            'Philippines',
            'Guatemala',
            'Colombia',
            'Thailand',
            'Vietnam',
            'Morocco',
            'Bahamas',
            'Jamaica',
            'Panama',
            'Mexico',
            'Poland',
            'India',
            'UAE'
        ].sort((a, b) => b.length - a.length);
        const normalizeLocationLabel = (rawLabel) => {
            const raw = typeof rawLabel === 'string' ? rawLabel.trim() : '';
            if (!raw) return '';
            const compact = raw.replace(/\s+/g, ' ');
            if (/^\d+\s*x\s*\d+$/i.test(compact)) return '';
            for (let idx = 0; idx < mapLocationSuffixes.length; idx += 1) {
                const suffix = mapLocationSuffixes[idx];
                if (!compact.endsWith(suffix) || compact.length <= suffix.length) continue;
                const head = compact.slice(0, compact.length - suffix.length).trim();
                if (!head) continue;
                return `${head}, ${suffix}`;
            }
            return compact;
        };
        const buildLocationSummary = (markers) => {
            const markerList = Array.isArray(markers) ? markers : [];
            const unique = new Set();
            markerList.forEach((marker) => {
                const normalized = normalizeLocationLabel(marker && marker.label);
                if (!normalized) return;
                unique.add(normalized);
            });
            const locations = Array.from(unique);
            if (!locations.length) return 'No mapped locations listed.';
            return locations.join(', ');
        };
        const applyMdToggleData = (toggleGroups, map, controls) => {
            if (!map || !controls) return;
            controls.innerHTML = '';
            const mapShell = controls.closest('.pipeline-map');
            const frame = map.closest('.pipeline-map-frame');
            if (frame) {
                frame.classList.add('map-settings-pending');
                // Main map defaults are applied first to avoid transient debug/test-style flashes.
                ensureFrameTuningDefaults(frame);
                applyFlashPresetToFrame(frame, mapFlashPresetDefaults.presetId);
                frame.dataset.mapFlashCompactGlow = mapFlashVisualDefaults.compactGlow ? 'true' : 'false';
                frame.dataset.mapPointerMode = 'flash';
            }
            let helper = null;
            if (mapShell) {
                helper = mapShell.querySelector('.map-controls-helper');
                if (!helper) {
                    helper = document.createElement('p');
                    helper.className = 'map-controls-helper';
                    if (frame && frame.parentNode === mapShell) {
                        mapShell.insertBefore(helper, frame);
                    } else {
                        mapShell.appendChild(helper);
                    }
                }
                helper.textContent = 'Select a category to display map markers and details.';
            }
            let desktopInlineControls = null;
            if (mapShell) {
                desktopInlineControls = mapShell.querySelector('.pipeline-map-inline-controls-desktop');
                if (!desktopInlineControls) {
                    desktopInlineControls = document.createElement('div');
                    desktopInlineControls.className = 'pipeline-map-inline-controls-desktop';
                    desktopInlineControls.setAttribute('role', 'group');
                    desktopInlineControls.setAttribute('aria-label', 'Desktop map category toggles');
                    if (frame && frame.parentNode === mapShell) {
                        mapShell.insertBefore(desktopInlineControls, frame);
                    } else {
                        mapShell.appendChild(desktopInlineControls);
                    }
                }
                desktopInlineControls.innerHTML = '';
            }
            if (mapShell && frame && frame.parentNode === mapShell) {
                if (desktopInlineControls) mapShell.insertBefore(desktopInlineControls, frame);
                if (helper) mapShell.insertBefore(helper, frame);
            }
            const mapDebugUiEnabled = false;
            let testsDock = null;
            if (mapDebugUiEnabled) {
                testsDock = mapShell ? mapShell.querySelector('[data-map-tests]') : null;
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
            }

            map.querySelectorAll('.map-overlay').forEach(node => node.remove());
            const overlayFragment = document.createDocumentFragment();
            let popupLayer = null;
            if (frame) {
                popupLayer = frame.querySelector('.map-category-popup-layer');
                if (!popupLayer) {
                    popupLayer = document.createElement('div');
                    popupLayer.className = 'map-category-popup-layer';
                    frame.appendChild(popupLayer);
                }
                popupLayer.innerHTML = '';
            }
            const dotGrid = mapDotGrid.get(map) || null;
            const viewBox = map.viewBox && map.viewBox.baseVal ? map.viewBox.baseVal : { width: 181, height: 89 };
            const popupGridWidth = Math.max(1, Math.round(dotGrid && dotGrid.width ? dotGrid.width : (viewBox.width || 181)));
            const popupGridHeight = Math.max(1, Math.round(dotGrid && dotGrid.height ? dotGrid.height : (viewBox.height || 89)));
            const clampCell = (value, max) => Math.min(max - 1, Math.max(0, Math.round(value)));
            const areaUsageCounts = new Map();
            const popupAreasBaseGrid = { width: 181, height: 89 };
            const popupAreasBase = [
                { id: '1', xMin: 111, yMin: 50, xMax: 135, yMax: 85 },
                { id: '2', xMin: 43, yMin: 25, xMax: 66, yMax: 44 },
                { id: '3', xMin: 2, yMin: 45, xMax: 23, yMax: 63 },
                { id: '4', xMin: 59, yMin: 54, xMax: 83, yMax: 86 },
                { id: '5', xMin: 162, yMin: 20, xMax: 178, yMax: 51 },
                { id: '6', xMin: 2, yMin: 66, xMax: 34, yMax: 86 }
            ];
            const popupAreas = popupAreasBase.map(area => {
                const xScale = popupGridWidth / popupAreasBaseGrid.width;
                const yScale = popupGridHeight / popupAreasBaseGrid.height;
                const xMin = clampCell(area.xMin * xScale, popupGridWidth);
                const xMax = clampCell(area.xMax * xScale, popupGridWidth);
                const yMin = clampCell(area.yMin * yScale, popupGridHeight);
                const yMax = clampCell(area.yMax * yScale, popupGridHeight);
                return {
                    id: area.id,
                    xMin: Math.min(xMin, xMax),
                    xMax: Math.max(xMin, xMax),
                    yMin: Math.min(yMin, yMax),
                    yMax: Math.max(yMin, yMax)
                };
            });
            const measurePopupFootprint = (descriptionText, maxWidthPercent = null, fontScale = 1) => {
                const fallbackWidthCells = Math.max(16, Math.min(56, Math.ceil((descriptionText.length || 0) * 0.6)));
                const fallbackHeightCells = Math.max(6, Math.min(18, Math.ceil((descriptionText.length || 0) / 24)));
                if (!popupLayer || !frame) {
                    return { widthCells: fallbackWidthCells, heightCells: fallbackHeightCells };
                }
                const probe = document.createElement('div');
                probe.className = 'map-category-popup';
                probe.textContent = descriptionText || '';
                probe.style.left = '50%';
                probe.style.top = '50%';
                probe.style.opacity = '0';
                probe.style.visibility = 'hidden';
                probe.style.pointerEvents = 'none';
                if (Number.isFinite(Number(maxWidthPercent))) {
                    probe.style.maxWidth = `${Number(maxWidthPercent)}%`;
                }
                if (Number.isFinite(Number(fontScale)) && Number(fontScale) > 0 && Number(fontScale) !== 1) {
                    probe.style.fontSize = `calc(0.8rem * ${Number(fontScale)})`;
                    probe.style.lineHeight = String(1.35 * Number(fontScale));
                }
                popupLayer.appendChild(probe);
                const probeRect = probe.getBoundingClientRect();
                const frameRect = frame.getBoundingClientRect();
                probe.remove();
                if (!frameRect.width || !frameRect.height || !probeRect.width || !probeRect.height) {
                    return { widthCells: fallbackWidthCells, heightCells: fallbackHeightCells };
                }
                const widthCells = (probeRect.width / frameRect.width) * popupGridWidth;
                const heightCells = (probeRect.height / frameRect.height) * popupGridHeight;
                return {
                    widthCells: clampNumber(widthCells, 9, popupGridWidth * 0.5, fallbackWidthCells),
                    heightCells: clampNumber(heightCells, 4, popupGridHeight * 0.45, fallbackHeightCells)
                };
            };
            const getPopupRectForAnchor = (x, y, footprint) => {
                const widthCells = footprint.widthCells;
                const heightCells = footprint.heightCells;
                return {
                    left: (x + 0.5) - (widthCells / 2),
                    right: (x + 0.5) + (widthCells / 2),
                    top: (y + 0.5) - (heightCells * 1.08),
                    bottom: (y + 0.5)
                };
            };
            const assignAreasForPopups = (popupRequests) => {
                if (!popupRequests.length || !popupAreas.length) return [];
                return popupRequests.map((request, requestIdx) => {
                    const areaIdx = requestIdx % popupAreas.length;
                    const area = popupAreas[areaIdx];
                    const usage = areaUsageCounts.get(area.id) || 0;
                    areaUsageCounts.set(area.id, usage + 1);
                    return { requestIdx, area, slotIndex: usage };
                });
            };
            const getAreaSlotOffset = (slotIndex) => {
                const slotOffsets = [
                    { x: 0, y: 0 },
                    { x: -0.16, y: -0.12 },
                    { x: 0.16, y: 0.12 },
                    { x: -0.2, y: 0.14 },
                    { x: 0.2, y: -0.14 },
                    { x: 0, y: 0.2 }
                ];
                return slotOffsets[slotIndex % slotOffsets.length];
            };
            const resolveAreaPopupPlacement = (descriptionText, assignedArea, slotIndex = 0) => {
                const area = assignedArea || popupAreas[0];
                if (!area) return { left: '50.0%', top: '50.0%', maxWidth: null, fontScale: 1 };
                const areaWidth = Math.max(1, area.xMax - area.xMin);
                const areaHeight = Math.max(1, area.yMax - area.yMin);
                const areaWidthPct = (areaWidth / popupGridWidth) * 100;
                const maxAreaWidthPct = Math.min(48, Math.max(18, areaWidthPct * 0.96));
                const minAreaWidthPct = Math.max(7, Math.min(22, areaWidthPct * 0.36));
                const midAreaWidthPct = (maxAreaWidthPct + minAreaWidthPct) / 2;
                const widthCandidates = Array.from(new Set([
                    Number(maxAreaWidthPct.toFixed(1)),
                    Number(midAreaWidthPct.toFixed(1)),
                    Number(minAreaWidthPct.toFixed(1))
                ]));
                if (!widthCandidates.length) widthCandidates.push(maxAreaWidthPct);
                const fontScaleCandidates = [1, 0.9, 0.8];
                let selectedWidthPct = widthCandidates[0];
                let selectedFontScale = 1;
                let selectedFootprint = measurePopupFootprint(descriptionText || '', selectedWidthPct, selectedFontScale);
                let bestOverflowScore = Number.POSITIVE_INFINITY;
                let bestVisualScore = Number.POSITIVE_INFINITY;
                let bestFitCandidate = null;
                let bestFitVisualScore = Number.POSITIVE_INFINITY;
                fontScaleCandidates.forEach(fontScale => {
                    widthCandidates.forEach(candidateWidthPct => {
                        const footprintCandidate = measurePopupFootprint(descriptionText || '', candidateWidthPct, fontScale);
                        const widthOverflow = Math.max(0, footprintCandidate.widthCells - (areaWidth * 0.96));
                        const heightOverflow = Math.max(0, (footprintCandidate.heightCells * 1.08) - (areaHeight * 0.98));
                        const overflowScore = (heightOverflow * 10) + widthOverflow;
                        const visualScore = ((1 - fontScale) * 200) + Math.abs(candidateWidthPct - maxAreaWidthPct);
                        const fitsArea = widthOverflow <= 0.01 && heightOverflow <= 0.01;
                        if (fitsArea && visualScore < bestFitVisualScore) {
                            bestFitVisualScore = visualScore;
                            bestFitCandidate = { candidateWidthPct, fontScale, footprintCandidate };
                        }
                        const isBetter = (
                            overflowScore < bestOverflowScore
                            || (overflowScore === bestOverflowScore && visualScore < bestVisualScore)
                        );
                        if (isBetter) {
                            bestOverflowScore = overflowScore;
                            bestVisualScore = visualScore;
                            selectedWidthPct = candidateWidthPct;
                            selectedFontScale = fontScale;
                            selectedFootprint = footprintCandidate;
                        }
                    });
                });
                if (bestFitCandidate) {
                    selectedWidthPct = bestFitCandidate.candidateWidthPct;
                    selectedFontScale = bestFitCandidate.fontScale;
                    selectedFootprint = bestFitCandidate.footprintCandidate;
                }
                const footprint = selectedFootprint;
                const areaCenterX = area.xMin + (areaWidth / 2);
                const areaCenterY = area.yMin + (areaHeight / 2);
                const offset = getAreaSlotOffset(slotIndex);
                const slotX = areaCenterX + (offset.x * areaWidth);
                const slotY = areaCenterY + (offset.y * areaHeight);
                const halfWidth = footprint.widthCells / 2;
                const popHeight = footprint.heightCells * 1.08;
                const minX = area.xMin + halfWidth;
                const maxX = area.xMax - halfWidth;
                const minY = area.yMin + popHeight;
                const maxY = area.yMax;
                const anchorX = minX > maxX ? areaCenterX : clampNumber(slotX, minX, maxX, areaCenterX);
                const anchorY = minY > maxY ? areaCenterY : clampNumber(slotY, minY, maxY, areaCenterY);
                let rect = getPopupRectForAnchor(anchorX, anchorY, footprint);
                let adjustedX = anchorX;
                let adjustedY = anchorY;
                if (rect.left < area.xMin) adjustedX += (area.xMin - rect.left);
                if (rect.right > area.xMax) adjustedX -= (rect.right - area.xMax);
                if (rect.top < area.yMin) adjustedY += (area.yMin - rect.top);
                if (rect.bottom > area.yMax) adjustedY -= (rect.bottom - area.yMax);
                rect = getPopupRectForAnchor(adjustedX, adjustedY, footprint);
                const mapMin = 1;
                const mapMaxX = popupGridWidth - 1;
                const mapMaxY = popupGridHeight - 1;
                if (rect.left < mapMin) adjustedX += (mapMin - rect.left);
                if (rect.right > mapMaxX) adjustedX -= (rect.right - mapMaxX);
                rect = getPopupRectForAnchor(adjustedX, adjustedY, footprint);
                if (rect.top < mapMin) adjustedY += (mapMin - rect.top);
                if (rect.bottom > mapMaxY) adjustedY -= (rect.bottom - mapMaxY);
                rect = getPopupRectForAnchor(adjustedX, adjustedY, footprint);
                const leftPercent = Math.min(94, Math.max(6, ((adjustedX + 0.5) / popupGridWidth) * 100));
                const topPercent = Math.min(96, Math.max(12, ((adjustedY + 0.5) / popupGridHeight) * 100));
                return {
                    left: `${leftPercent.toFixed(1)}%`,
                    top: `${topPercent.toFixed(1)}%`,
                    maxWidth: `${selectedWidthPct.toFixed(1)}%`,
                    fontScale: selectedFontScale
                };
            };
            const locationSummaryByTarget = new Map(
                toggleGroups.map(group => [group.targetClass, buildLocationSummary(group.markers)])
            );
            const popupRequests = toggleGroups.map(group => ({
                targetClass: group.targetClass,
                markers: group.markers || [],
                description: (typeof group.description === 'string' && group.description.trim())
                    ? group.description.trim()
                    : (locationSummaryByTarget.get(group.targetClass) || '')
            }));
            const areaAssignments = assignAreasForPopups(popupRequests);
            const areaPlacementByTargetClass = new Map(
                areaAssignments.map(entry => [popupRequests[entry.requestIdx].targetClass, { area: entry.area, slotIndex: entry.slotIndex }])
            );
            const appendOverlayMarker = (overlayNode, marker, sizeScale = 1) => {
                const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                markerGroup.setAttribute('class', 'map-marker');
                const scaledSize = marker.size * sizeScale;
                if (marker.shape === 'square') {
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', marker.x - scaledSize);
                    rect.setAttribute('y', marker.y - scaledSize);
                    rect.setAttribute('width', scaledSize * 2);
                    rect.setAttribute('height', scaledSize * 2);
                    rect.setAttribute('rx', Math.max(1, scaledSize * 0.35));
                    rect.style.setProperty('--map-marker-target-fill', marker.color);
                    rect.style.fill = marker.color;
                    markerGroup.appendChild(rect);
                } else {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', marker.x);
                    circle.setAttribute('cy', marker.y);
                    circle.setAttribute('r', scaledSize);
                    circle.style.setProperty('--map-marker-target-fill', marker.color);
                    circle.style.fill = marker.color;
                    markerGroup.appendChild(circle);
                }

                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', marker.x + (scaledSize * 2));
                label.setAttribute('y', marker.y + (scaledSize * 1.8));
                label.textContent = normalizeLocationLabel(marker.label) || marker.label;
                markerGroup.appendChild(label);
                overlayNode.appendChild(markerGroup);
            };
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
                const locationSummary = locationSummaryByTarget.get(toggleGroup.targetClass) || 'No mapped locations listed.';
                const popupText = (typeof toggleGroup.description === 'string' && toggleGroup.description.trim())
                    ? toggleGroup.description.trim()
                    : locationSummary;
                const mobileDescriptionText = popupText
                    ? `${popupText}\nLocations: ${locationSummary}`
                    : `Locations: ${locationSummary}`;
                const categoryDescription = document.createElement('p');
                categoryDescription.className = 'map-category-description';
                categoryDescription.setAttribute('data-map-description-target', toggleGroup.targetClass);
                categoryDescription.style.setProperty('--map-description-color', representativeColor);
                categoryDescription.textContent = '';
                const mobileDescriptionLead = document.createElement('span');
                mobileDescriptionLead.className = 'map-category-description-lead';
                mobileDescriptionLead.textContent = popupText || '';
                const mobileDescriptionLocations = document.createElement('span');
                mobileDescriptionLocations.className = 'map-category-description-locations';
                mobileDescriptionLocations.textContent = `Locations: ${locationSummary}`;
                if (mobileDescriptionLead.textContent) {
                    categoryDescription.appendChild(mobileDescriptionLead);
                }
                categoryDescription.appendChild(mobileDescriptionLocations);
                controls.appendChild(categoryDescription);
                if (desktopInlineControls) {
                    const desktopInlineButton = document.createElement('button');
                    desktopInlineButton.type = 'button';
                    desktopInlineButton.className = 'map-control map-control--desktop';
                    desktopInlineButton.setAttribute('data-map-target', toggleGroup.targetClass);
                    desktopInlineButton.setAttribute('aria-pressed', 'false');
                    desktopInlineButton.style.setProperty('--map-control-color', representativeColor);
                    desktopInlineButton.textContent = toggleGroup.buttonLabel;
                    desktopInlineControls.appendChild(desktopInlineButton);
                }

                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.setAttribute('class', `map-overlay ${toggleGroup.targetClass}`);
                const desktopGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                desktopGroup.setAttribute('class', `map-overlay ${toggleGroup.targetClass}--desktop`);

                toggleGroup.markers.forEach(marker => {
                    appendOverlayMarker(group, marker, 2);
                    appendOverlayMarker(desktopGroup, marker, 1);
                });
                overlayFragment.appendChild(group);
                overlayFragment.appendChild(desktopGroup);

                if (popupLayer) {
                    const areaPlacement = areaPlacementByTargetClass.get(toggleGroup.targetClass) || null;
                    const popupAnchor = resolveAreaPopupPlacement(
                        popupText,
                        areaPlacement ? areaPlacement.area : null,
                        areaPlacement ? areaPlacement.slotIndex : 0
                    );
                    const popup = document.createElement('div');
                    popup.className = 'map-category-popup';
                    popup.setAttribute('data-map-popup-target', `${toggleGroup.targetClass}--desktop`);
                    popup.style.setProperty('--map-popup-color', representativeColor);
                    popup.style.left = popupAnchor.left;
                    popup.style.top = popupAnchor.top;
                    if (popupAnchor.maxWidth) {
                        popup.style.width = popupAnchor.maxWidth;
                        popup.style.maxWidth = popupAnchor.maxWidth;
                    }
                    if (popupAnchor.fontScale && popupAnchor.fontScale !== 1) {
                        popup.style.fontSize = `calc(0.8rem * ${popupAnchor.fontScale})`;
                        popup.style.lineHeight = String(1.35 * popupAnchor.fontScale);
                    }
                    popup.textContent = popupText;
                    popupLayer.appendChild(popup);
                }
            });
            map.appendChild(overlayFragment);

            if (frame) {
                ensureFrameTuningDefaults(frame);
                const setPointerMode = pointerModeSetters.get(frame);
                if (typeof setPointerMode === 'function') setPointerMode('flash');

                if (mapDebugUiEnabled) {
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
            }

            const mapControls = controls.querySelectorAll('.map-control[data-map-target]');
            const desktopMapControls = desktopInlineControls
                ? desktopInlineControls.querySelectorAll('.map-control[data-map-target]')
                : [];
            const overlays = map.querySelectorAll('.map-overlay');
            const categoryDescriptions = controls.querySelectorAll('.map-category-description[data-map-description-target]');
            const categoryPopups = frame
                ? frame.querySelectorAll('.map-category-popup[data-map-popup-target]')
                : [];
            const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;
            const isDesktopOverlay = (overlay) => Array.from(overlay.classList).some(cls => cls.endsWith('--desktop'));
            const hasActiveOverlayForViewport = () => {
                const mobileView = isMobileViewport();
                return Array.from(overlays).some(overlay => {
                    if (!overlay.classList.contains('is-active')) return false;
                    const desktopOverlay = isDesktopOverlay(overlay);
                    return mobileView ? !desktopOverlay : desktopOverlay;
                });
            };
            const updateHelperCopy = () => {
                if (!helper) return;
                const hasActive = hasActiveOverlayForViewport();
                helper.textContent = hasActive
                    ? 'Click categories to toggle markers. You can leave multiple categories on at once.'
                    : 'Select a category to display map markers and details.';
                helper.classList.toggle('is-empty', !hasActive);
            };
            let deferredOverrideRevealDone = false;
            const revealDeferredOverrideSet = () => {
                if (deferredOverrideRevealDone) return;
                const deferredDots = Array.from(map.querySelectorAll('.map-dot--deferred-load[data-map-deferred-override="texas"]'));
                deferredOverrideRevealDone = true;
                if (frame) frame.dataset.mapTexasOverridePrimed = 'true';
                if (!deferredDots.length) return;
                const revealDelayMs = 280;
                const entryFlashMs = 440;
                window.setTimeout(() => {
                    deferredDots.forEach(dot => {
                        const pendingOverrideColor = dot.dataset.mapPendingOverrideColor;
                        if (pendingOverrideColor) {
                            dot.style.setProperty('--map-texas-entry-target', pendingOverrideColor);
                            dot.style.setProperty('--map-texas-entry-flash', `color-mix(in srgb, ${pendingOverrideColor} 46%, #ffffff)`);
                            dot.style.fill = pendingOverrideColor;
                            dot.classList.add('map-dot--override');
                        }
                        dot.classList.add('map-dot--texas-entry');
                        dot.classList.remove('map-dot--deferred-load');
                    });
                    window.setTimeout(() => {
                        deferredDots.forEach(dot => {
                            const pendingBlinkClass = dot.dataset.mapPendingBlinkClass;
                            const pendingBlinkDelay = dot.dataset.mapPendingBlinkDelay;
                            if (pendingBlinkClass) dot.classList.add(pendingBlinkClass);
                            if (pendingBlinkDelay) dot.style.setProperty('--map-dot-blink-delay', pendingBlinkDelay);
                            dot.classList.remove('map-dot--texas-entry');
                            dot.style.removeProperty('--map-texas-entry-target');
                            dot.style.removeProperty('--map-texas-entry-flash');
                            delete dot.dataset.mapPendingOverrideColor;
                            delete dot.dataset.mapPendingBlinkClass;
                            delete dot.dataset.mapPendingBlinkDelay;
                            delete dot.dataset.mapDeferredOverride;
                        });
                    }, entryFlashMs);
                }, revealDelayMs);
            };
            let frameFlashTimerId = 0;
            const triggerFrameCategoryFlash = (targetClass, sourceControls) => {
                if (!frame) return;
                const sourceControl = Array.from(sourceControls || []).find(control => control.getAttribute('data-map-target') === targetClass);
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
                }, 10120);
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
                    triggerFrameCategoryFlash(targetClass, mapControls);
                }
                updateHelperCopy();
            };
            const setDesktopCategoryState = (targetClass, nextState, options = {}) => {
                const desktopTargetClass = `${targetClass}--desktop`;
                overlays.forEach(overlay => {
                    if (overlay.classList.contains(desktopTargetClass)) {
                        overlay.classList.toggle('is-active', nextState);
                    }
                });
                desktopMapControls.forEach(control => {
                    if (control.getAttribute('data-map-target') === targetClass) {
                        control.classList.toggle('is-active', nextState);
                        control.setAttribute('aria-pressed', nextState ? 'true' : 'false');
                    }
                });
                categoryPopups.forEach(popup => {
                    if (popup.getAttribute('data-map-popup-target') === desktopTargetClass) {
                        popup.classList.toggle('is-active', nextState);
                    }
                });
                if (nextState && options.flashFrame !== false) {
                    triggerFrameCategoryFlash(targetClass, desktopMapControls);
                }
                updateHelperCopy();
            };
            toggleGroups.forEach(toggleGroup => {
                setCategoryState(toggleGroup.targetClass, false, { flashFrame: false });
                setDesktopCategoryState(toggleGroup.targetClass, false, { flashFrame: false });
            });
            mapControls.forEach(control => {
                control.addEventListener('click', () => {
                    const target = control.getAttribute('data-map-target');
                    const overlay = Array.from(overlays).find(node => node.classList.contains(target));
                    if (!overlay) return;
                    const nextState = !overlay.classList.contains('is-active');
                    setCategoryState(target, nextState, { flashFrame: nextState });
                });
            });
            desktopMapControls.forEach(control => {
                control.addEventListener('click', () => {
                    const target = control.getAttribute('data-map-target');
                    const overlay = Array.from(overlays).find(node => node.classList.contains(`${target}--desktop`));
                    if (!overlay) return;
                    const nextState = !overlay.classList.contains('is-active');
                    setDesktopCategoryState(target, nextState, { flashFrame: nextState });
                });
            });
            updateHelperCopy();
            window.addEventListener('resize', updateHelperCopy);
            const firstToggleTarget = toggleGroups[0] ? toggleGroups[0].targetClass : '';
            const firstMobileToggle = firstToggleTarget
                ? Array.from(mapControls).find(control => control.getAttribute('data-map-target') === firstToggleTarget)
                : null;
            const firstDesktopToggle = firstToggleTarget
                ? Array.from(desktopMapControls).find(control => control.getAttribute('data-map-target') === firstToggleTarget)
                : null;
            let guidanceCleared = false;
            const clearToggleGuidance = () => {
                if (guidanceCleared) return;
                guidanceCleared = true;
                [firstMobileToggle, firstDesktopToggle].forEach((control) => {
                    if (control) control.classList.remove('map-control--guided');
                });
            };
            [firstMobileToggle, firstDesktopToggle].forEach((control) => {
                if (control) control.classList.add('map-control--guided');
            });
            if (firstMobileToggle) {
                firstMobileToggle.addEventListener('click', clearToggleGuidance, { once: true });
            }
            if (firstDesktopToggle) {
                firstDesktopToggle.addEventListener('click', clearToggleGuidance, { once: true });
            }
            const runMapPostStartupReady = () => {
                revealDeferredOverrideSet();
                if (frame) frame.classList.remove('map-settings-pending');
            };
            const startupMode = frame && frame.dataset.mapGlowStartupMode === 'sprinkle' ? 'sprinkle' : 'sweep';
            const sweepEnabled = frame && frame.dataset.mapGlowEnabled !== 'false';
            const startupStillPopulating = Boolean(
                frame
                && frame.dataset.mapGlowInitialRevealDone !== 'true'
                && (startupMode === 'sprinkle' || sweepEnabled)
            );
            if (!startupStillPopulating) {
                runMapPostStartupReady();
            } else {
                let pollCount = 0;
                const maxPolls = 500;
                const pollReadyState = () => {
                    const isReady = !frame || frame.dataset.mapGlowInitialRevealDone === 'true';
                    if (isReady || pollCount >= maxPolls) {
                        runMapPostStartupReady();
                        return;
                    }
                    pollCount += 1;
                    window.setTimeout(pollReadyState, 40);
                };
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        pollReadyState();
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
            const categoryDescriptionLines = [];
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
            const resolveToggleColor = (rawColor) => {
                const trimmed = (rawColor || '').trim();
                if (!trimmed) return '';
                const colorToken = trimmed.toLowerCase();
                if (colorToken === 'accent') return 'accent';
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
                        sourceSet: setName,
                        ...parsedPayload
                    });
                });
            };
            const isSectionStart = (lineValue, sectionName) => {
                const escapedSection = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`^(?:#{1,}\\s*)?${escapedSection}(?:\\s*#{0,})?$`, 'i').test(lineValue);
            };
            const isSectionEnd = (lineValue, sectionName) => {
                const escapedSection = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`^(?:#{1,}\\s*)?/\\s*${escapedSection}(?:\\s*#{0,})?$`, 'i').test(lineValue);
            };
            const hasMarker = (lineValue, names) => {
                const nameList = Array.isArray(names) ? names : [names];
                return nameList.some(name => isSectionStart(lineValue, name));
            };
            const hasEndMarker = (lineValue, names) => {
                const nameList = Array.isArray(names) ? names : [names];
                return nameList.some(name => isSectionEnd(lineValue, name));
            };

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
                const line = lines[lineIndex];
                if (hasMarker(line, ['map-data', 'map data'])) {
                    mode = 'rows';
                    continue;
                }
                if (hasEndMarker(line, ['map-data', 'map data'])) {
                    mode = '';
                    continue;
                }
                if (hasMarker(line, ['overrides', 'override-section', 'override-data'])) {
                    mode = 'overrides';
                    continue;
                }
                if (hasEndMarker(line, ['overrides', 'override-section', 'override-data'])) {
                    mode = '';
                    continue;
                }
                if (hasMarker(line, ['toggle-section', 'toggle section'])) {
                    mode = 'toggles';
                    continue;
                }
                if (hasEndMarker(line, ['toggle-section', 'toggle section'])) {
                    mode = '';
                    continue;
                }
                if (hasMarker(line, ['category_descriptions', 'category-descriptions', 'category descriptions'])) {
                    mode = 'category_descriptions';
                    continue;
                }
                if (hasMarker(line, ['toggles', 'toggle-data', 'toggle data'])) {
                    mode = 'toggles';
                    continue;
                }
                if (line.startsWith('#')) {
                    if (/^#\s*overrides\s*$/i.test(line)) {
                        mode = 'overrides';
                        continue;
                    }
                    if (/^#\s*category_descriptions\s*$/i.test(line)) {
                        mode = 'category_descriptions';
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
                    if (mode === 'category_descriptions') {
                        categoryDescriptionLines.push(line);
                        continue;
                    }
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
            const frame = map.closest('.pipeline-map-frame');
            const shouldDeferTexasOverride = !(frame && frame.dataset.mapTexasOverridePrimed === 'true');
            const overrideStyleByCell = new Map();
            overrides.forEach(({ x, y, hasValue, value, color, color2, blink, phase, sourceSet }) => {
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
                    const normalizedSourceSet = (sourceSet || '').toLowerCase();
                    const deferLoad = normalizedSourceSet === 'texas' && shouldDeferTexasOverride;
                    overrideStyleByCell.set(key, { color, color2, blink, phase: phase || 'sync', sourceSet: normalizedSourceSet, deferLoad });
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
                const categoryMetaBySlug = new Map();
                categoryDescriptionLines.forEach(line => {
                    const parts = line.split('|').map(part => part.trim());
                    if (parts.length < 2) {
                        console.warn(`[map] invalid category description in ${label}: "${line}"`);
                        return;
                    }
                    const buttonLabel = parts[0] || '';
                    if (!buttonLabel) {
                        console.warn(`[map] empty category label in ${label}: "${line}"`);
                        return;
                    }
                    const description = parts[1] || '';
                    const categoryColor = resolveToggleColor(parts[2] || '');
                    categoryMetaBySlug.set(slugify(buttonLabel), {
                        description,
                        color: categoryColor && categoryColor !== 'accent' ? categoryColor : ''
                    });
                });
                // Toggle markers authored with integer grid coordinates should center on cells.
                const resolveToggleCoordinate = (value) => (Number.isInteger(value) ? value + 0.5 : value);
                const toggleMarkers = toggleLines.map(line => {
                    const parts = line.split('|').map(part => part.trim());
                    if (parts.length < 7) {
                        console.warn(`[map] invalid toggle in ${label}: "${line}"`);
                        return null;
                    }
                    const buttonLabel = parts[0] || 'Toggle';
                    const categoryMeta = categoryMetaBySlug.get(slugify(buttonLabel)) || null;
                    const description = categoryMeta ? categoryMeta.description : '';
                    const label = parts[1] || buttonLabel;
                    const rawX = Number(parts[2]);
                    const rawY = Number(parts[3]);
                    const x = resolveToggleCoordinate(rawX);
                    const y = resolveToggleCoordinate(rawY);
                    const shapeRaw = parts[4];
                    const colorRaw = parts[5];
                    const shape = (shapeRaw || 'circle').toLowerCase();
                    const markerColorToken = resolveToggleColor(colorRaw || 'accent');
                    const size = Number(parts[6]) || 4;
                    const color = markerColorToken === 'accent'
                        ? (categoryMeta && categoryMeta.color ? categoryMeta.color : 'var(--map-accent)')
                        : (markerColorToken || 'var(--map-accent)');
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
                }).filter(item => item && Number.isFinite(item.x) && Number.isFinite(item.y));

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
                    group.markers.push({
                        buttonLabel: marker.buttonLabel,
                        description: marker.description,
                        label: marker.label,
                        x: marker.x,
                        y: marker.y,
                        shape: marker.shape,
                        size: marker.size,
                        color: marker.color,
                        targetClass: marker.targetClass
                    });
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
            if (mapMdPath) {
                fetch(mapMdPath, { cache: 'no-store' })
                    .then(response => response.text())
                    .then(text => {
                        const ok = renderFromText(map, text, mapMdPath);
                        if (!ok) {
                            console.warn(`[map] failed to render md source: ${mapMdPath}`);
                        }
                    })
                    .catch(() => {
                        console.warn(`[map] failed to fetch md source: ${mapMdPath}`);
                    });
                return;
            }
            if (mapSrc) {
                renderFromImage(map, mapSrc, mapSrc);
            }
        });
        syncMapTestsVisibility();
        const scanLocalAreas = () => {
            const candidates = Array.from(document.querySelectorAll('[data-map-tests], [data-test-settings], [data-local-debug-area]'));
            const areas = [];
            const seen = new Set();
            candidates.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                const areaNode = node.closest('[data-local-debug-area], .pipeline-map, .section-wrap') || node;
                if (!(areaNode instanceof HTMLElement)) return;
                if (seen.has(areaNode)) return;
                seen.add(areaNode);
                const areaStyle = window.getComputedStyle(areaNode);
                const section = areaNode.closest('.section-wrap');
                const sectionId = section ? section.id : '';
                let label = areaNode.getAttribute('data-debug-label') || areaNode.getAttribute('aria-label') || '';
                if (!label) {
                    if (areaNode.matches('.pipeline-map')) {
                        label = 'Pipeline map test dock';
                    } else if (areaNode.matches('.section-wrap') && sectionId) {
                        label = `Section ${sectionId}`;
                    } else {
                        label = 'Local test area';
                    }
                }
                areas.push({
                    label,
                    sectionId,
                    hidden: Boolean(
                        areaNode.hidden
                        || areaStyle.display === 'none'
                        || areaStyle.visibility === 'hidden'
                    ),
                    element: areaNode
                });
            });
            return areas;
        };

        const debugBridge = window.__tsiDebugBridge || {};
        debugBridge.getMapTestsVisible = () => mapTestsVisible;
        debugBridge.setMapTestsVisible = (nextVisible, options = {}) => {
            const opts = options && typeof options === 'object' ? options : {};
            setMapTestsVisible(Boolean(nextVisible));
            if (opts.notify) {
                showMapTestsToggleNotice(mapTestsVisible);
            }
            return mapTestsVisible;
        };
        debugBridge.scanLocalAreas = scanLocalAreas;
        debugBridge.syncMapTestsVisibility = syncMapTestsVisibility;
        window.__tsiDebugBridge = debugBridge;

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
                if (shouldSync) {
                    syncMapTestsVisibility();
                    window.dispatchEvent(new CustomEvent('tsi:local-test-areas-changed'));
                }
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
