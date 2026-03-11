const PORTAL_V2_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyXeBfOxrud6Auh-UrHMGKbE_ud9dE8ppsjjK792q2CF_UlRnnpkaC2_g22Dju6oUWH/exec';
const PORTAL_V2_MAX_BYTES = 8 * 1024 * 1024;
const PORTAL_V2_ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg']);
const PORTAL_V2_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PORTAL_V2_ROUTE_TO_ROUT = {
    investment: 'PINV',
    press: 'PPRS',
    employment: 'PEMP',
    internship: 'PINT'
};

function portalV2NormalizeRoute(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'investment' || raw === 'press' || raw === 'employment' || raw === 'internship') return raw;
    return '';
}

function portalV2RoutForRoute(route) {
    const clean = portalV2NormalizeRoute(route);
    return clean ? String(PORTAL_V2_ROUTE_TO_ROUT[clean] || '') : '';
}

function portalV2ClientTimeContext() {
    const now = new Date();
    let clientTz = '';
    try {
        clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (error) {
        clientTz = '';
    }
    return {
        client_tz: clientTz,
        client_utc_offset_minutes: String(-now.getTimezoneOffset())
    };
}

function portalV2CanonicalizePayload(route, payload) {
    const next = { ...payload };
    next.rout = portalV2RoutForRoute(route);
    Object.assign(next, portalV2ClientTimeContext());

    if (route === 'investment') {
        next.pinv_stage = next.investment_stage || '';
        next.pinv_check_range = next.investment_check_range || '';
        next.pinv_geography = next.investment_geography || '';
        next.pinv_focus = next.investment_focus || '';
        next.pinv_timeline = next.investment_timeline || '';
        next.pinv_investor_type = next.investment_investor_type || '';
        next.pinv_investor_type_other = next.investment_investor_type_other || '';
    }
    if (route === 'press') {
        const noDeadline = String(next.press_deadline_mode || '').trim().toLowerCase() === 'no_deadline';
        next.pprs_outlet = next.press_outlet || '';
        next.pprs_role = next.press_role || '';
        next.pprs_deadline = next.press_deadline || (noDeadline ? 'No deadline' : '');
        next.pprs_topic = next.press_topic || '';
        next.pprs_format = next.press_format || '';
    }
    if (route === 'employment') {
        next.pemp_role_interest = next.employment_role_interest || '';
        next.pemp_timeline = next.employment_timeline || '';
        next.pemp_location_pref = next.employment_location_pref || '';
    }
    if (route === 'internship') {
        next.pint_school = next.intern_school || '';
        next.pint_program = next.intern_program || '';
        next.pint_grad_date = next.intern_grad_date || '';
        next.pint_track = next.intern_track || '';
        next.pint_mode = next.intern_mode || '';
        next.pint_hours_per_week = next.intern_hours_per_week || '';
        next.pint_start_date = next.intern_start_date || '';
        next.pint_portfolio_url = next.intern_portfolio_url || '';
    }

    delete next.handler_tier;
    delete next.submission_type;
    delete next.concierge_track;
    delete next.timestamp_local;
    return next;
}

function portalV2ExtractFileExtension(filename) {
    const raw = String(filename || '').trim();
    const idx = raw.lastIndexOf('.');
    if (idx < 0) return '';
    return raw.slice(idx + 1).toLowerCase();
}

function portalV2FriendlyErrorMessage(code) {
    switch (String(code || '').trim()) {
        case 'already_received':
            return 'This submission was already received. No additional action is needed unless you intended to send different information.';
        case 'retry_later':
            return 'Please wait a short moment and try again. Your last attempt was not accepted yet.';
        case 'temporarily_unavailable':
            return 'The intake is temporarily busy. Please try again shortly.';
        case 'invalid_input':
            return 'Some required information is missing or invalid. Please review the form and try again.';
        default:
            return 'Unable to submit right now. Please try again shortly.';
    }
}

function portalV2ReadFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('file_read_error'));
        reader.onload = () => {
            const result = String(reader.result || '');
            const commaIdx = result.indexOf(',');
            if (commaIdx < 0) return reject(new Error('file_parse_error'));
            resolve(result.slice(commaIdx + 1));
        };
        reader.readAsDataURL(file);
    });
}

function portalV2SubmissionId(route) {
    const clean = portalV2NormalizeRoute(route) || 'unknown';
    return `portalv2-${clean}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function portalV2FormatAcceptLabel(fileInput) {
    const accept = String((fileInput && fileInput.getAttribute('accept')) || '').trim();
    if (!accept) return '(any file type)';
    const labels = accept
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => token.replace(/^\./, '').toLowerCase());
    if (!labels.length) return '(any file type)';
    return `(${labels.join(',')})`;
}

function portalV2WireDropInput(fileInput) {
    if (!(fileInput instanceof HTMLInputElement)) return;
    if (fileInput.type !== 'file') return;
    if (fileInput.dataset.uploadEnhanced === 'true') return;

    fileInput.dataset.uploadEnhanced = 'true';

    const shell = document.createElement('div');
    shell.className = 'portalx-upload';

    const head = document.createElement('div');
    head.className = 'portalx-upload-head';

    const icon = document.createElement('span');
    icon.className = 'portalx-upload-icon';
    icon.setAttribute('aria-hidden', 'true');

    const textWrap = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'portalx-upload-title';
    title.textContent = 'Drag & drop file';
    const meta = document.createElement('p');
    meta.className = 'portalx-upload-meta';
    meta.textContent = portalV2FormatAcceptLabel(fileInput);
    textWrap.appendChild(title);
    textWrap.appendChild(meta);

    head.appendChild(icon);
    head.appendChild(textWrap);

    const button = document.createElement('span');
    button.className = 'portalx-upload-btn';
    button.textContent = 'Select File';

    const fileBar = document.createElement('div');
    fileBar.className = 'portalx-upload-filebar';

    const name = document.createElement('p');
    name.className = 'portalx-upload-name';
    name.textContent = 'No file selected';

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'portalx-upload-clear';
    clearButton.setAttribute('aria-label', 'Remove selected file');
    clearButton.textContent = 'X';
    clearButton.hidden = true;

    fileBar.appendChild(clearButton);
    fileBar.appendChild(name);

    const parent = fileInput.parentNode;
    if (!parent) return;
    parent.insertBefore(shell, fileInput);
    shell.appendChild(head);
    shell.appendChild(button);
    shell.appendChild(fileBar);
    shell.appendChild(fileInput);

    const updateFileName = () => {
        const selected = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
        name.textContent = selected ? selected.name : 'No file selected';
        clearButton.hidden = !selected;
    };

    const assignDroppedFile = (file) => {
        if (!file) return;
        if (typeof DataTransfer !== 'function') return;
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    };

    fileInput.addEventListener('change', updateFileName);
    clearButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.value = '';
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    shell.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest('.portalx-upload-clear')) return;
        fileInput.click();
    });
    shell.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        fileInput.click();
    });
    shell.addEventListener('dragover', (event) => {
        event.preventDefault();
        shell.classList.add('is-dragover');
    });
    shell.addEventListener('dragleave', () => {
        shell.classList.remove('is-dragover');
    });
    shell.addEventListener('drop', (event) => {
        event.preventDefault();
        shell.classList.remove('is-dragover');
        const files = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : null;
        if (!files || !files.length) return;
        assignDroppedFile(files[0]);
    });

    shell.tabIndex = 0;
    updateFileName();
}

function portalV2SetRequiredMarker(form, field, enabled) {
    if (!form || !field || !field.id) return;
    const label = form.querySelector(`label[for="${field.id}"]`);
    if (!label) return;
    let marker = label.querySelector('.portalx-required');
    if (!enabled) {
        if (marker) marker.remove();
        return;
    }
    if (marker) return;
    marker = document.createElement('span');
    marker.className = 'portalx-required';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = ' *';
    label.appendChild(marker);
}

function portalV2MarkRequiredLabels(form) {
    if (!form) return;
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
        if (!(field instanceof HTMLElement)) return;
        const required = Boolean(field.hasAttribute('required') && !('disabled' in field && field.disabled));
        portalV2SetRequiredMarker(form, field, required);
    });
}

function portalV2WireEmploymentOpenPaths(form) {
    const toggle = form.querySelector('#employmentOpenPaths');
    const roleInput = form.querySelector('#roleInterest');
    if (!(toggle instanceof HTMLInputElement) || !(roleInput instanceof HTMLInputElement)) return () => {};

    const sync = () => {
        if (toggle.checked) {
            roleInput.value = 'Open to multiple paths';
            roleInput.readOnly = true;
        } else {
            if (roleInput.value === 'Open to multiple paths') roleInput.value = '';
            roleInput.readOnly = false;
        }
        portalV2SetRequiredMarker(form, roleInput, roleInput.required);
    };

    toggle.addEventListener('change', sync);
    return sync;
}

function portalV2WireInvestmentTypeOther(form) {
    const typeSelect = form.querySelector('#investorType');
    const otherRow = form.querySelector('#investorTypeOtherRow');
    const otherInput = form.querySelector('#investorTypeOther');
    if (!(typeSelect instanceof HTMLSelectElement) || !(otherRow instanceof HTMLElement) || !(otherInput instanceof HTMLInputElement)) return () => {};

    const sync = () => {
        const needsOther = typeSelect.value === 'other';
        otherRow.hidden = !needsOther;
        otherInput.disabled = !needsOther;
        otherInput.required = needsOther;
        if (!needsOther) otherInput.value = '';
        portalV2SetRequiredMarker(form, otherInput, needsOther);
    };

    typeSelect.addEventListener('change', sync);
    return sync;
}

function portalV2WirePressDeadlineMode(form) {
    const noDeadline = form.querySelector('#pressNoDeadline');
    const deadlineInput = form.querySelector('#deadline');
    const modeInput = form.querySelector('#pressDeadlineMode');
    if (!(noDeadline instanceof HTMLInputElement) || !(deadlineInput instanceof HTMLInputElement) || !(modeInput instanceof HTMLInputElement)) return () => {};

    const sync = () => {
        const disabled = noDeadline.checked;
        deadlineInput.disabled = disabled;
        if (disabled) deadlineInput.value = '';
        modeInput.value = disabled ? 'no_deadline' : '';
    };

    noDeadline.addEventListener('change', sync);
    return sync;
}

function portalV2WireRouteFieldLogic(form, route) {
    const syncers = [];
    if (route === 'employment') syncers.push(portalV2WireEmploymentOpenPaths(form));
    if (route === 'investment') syncers.push(portalV2WireInvestmentTypeOther(form));
    if (route === 'press') syncers.push(portalV2WirePressDeadlineMode(form));
    return () => {
        syncers.forEach((sync) => {
            if (typeof sync === 'function') sync();
        });
        portalV2MarkRequiredLabels(form);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('portalIntakeForm');
    if (!form) return;

    const route = portalV2NormalizeRoute(form.getAttribute('data-portal-route'));
    if (!route) return;

    const endpoint = String(form.getAttribute('data-endpoint') || PORTAL_V2_ENDPOINT).trim();
    const requiresFile = String(form.getAttribute('data-requires-file') || '').toLowerCase() === 'true';

    const fileInput = document.getElementById('portalFile');
    const fileError = document.getElementById('portalFileError');
    const statusNode = document.getElementById('portalFormStatus');
    const submitButtons = Array.from(form.querySelectorAll('button[type="submit"]'));
    submitButtons.forEach((btn) => {
        if (!(btn instanceof HTMLButtonElement)) return;
        if (!btn.dataset.defaultLabel) btn.dataset.defaultLabel = btn.textContent || 'Submit';
    });
    const emailInput = form.querySelector('input[type="email"][name="email"]');

    if (fileInput) portalV2WireDropInput(fileInput);
    const syncRouteFieldLogic = portalV2WireRouteFieldLogic(form, route);
    syncRouteFieldLogic();

    const setStatus = (text, tone) => {
        if (!statusNode) return;
        statusNode.textContent = text;
        statusNode.classList.remove('is-success', 'is-error');
        if (tone === 'success' || tone === 'error') statusNode.classList.add(`is-${tone}`);
    };

    const clearFileError = () => {
        if (!fileError) return;
        fileError.textContent = '';
        fileError.classList.remove('visible');
    };

    if (fileInput) fileInput.addEventListener('change', clearFileError);

    let inFlight = false;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (inFlight) return;
        inFlight = true;
        const submitter = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
        const postSubmitUrl = submitter ? String(submitter.dataset.nextUrl || '').trim() : '';

        clearFileError();
        submitButtons.forEach((btn) => {
            if (!(btn instanceof HTMLButtonElement)) return;
            btn.disabled = true;
            btn.textContent = 'Submitting...';
        });

        if (emailInput && !PORTAL_V2_EMAIL_REGEX.test(String(emailInput.value || '').trim())) {
            setStatus('Please enter a valid email address.', 'error');
            emailInput.focus();
            inFlight = false;
            submitButtons.forEach((btn) => {
                if (!(btn instanceof HTMLButtonElement)) return;
                btn.disabled = false;
                btn.textContent = btn.dataset.defaultLabel || 'Submit';
            });
            return;
        }

        if (route === 'press') {
            const deadlineInput = form.querySelector('#deadline');
            const noDeadlineInput = form.querySelector('#pressNoDeadline');
            const hasDeadline = Boolean(
                deadlineInput instanceof HTMLInputElement
                && String(deadlineInput.value || '').trim()
            );
            const hasNoDeadline = Boolean(
                noDeadlineInput instanceof HTMLInputElement
                && noDeadlineInput.checked
            );
            if (!hasDeadline && !hasNoDeadline) {
                setStatus('Provide a publication deadline or select No deadline.', 'error');
                if (deadlineInput instanceof HTMLInputElement) deadlineInput.focus();
                inFlight = false;
                submitButtons.forEach((btn) => {
                    if (!(btn instanceof HTMLButtonElement)) return;
                    btn.disabled = false;
                    btn.textContent = btn.dataset.defaultLabel || 'Submit';
                });
                return;
            }
        }

        try {
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            delete payload.application_file;

            payload.page_path = window.location.pathname || '/';
            payload.referrer = document.referrer || 'direct';
            payload.submission_id = portalV2SubmissionId(route);
            const canonicalPayload = portalV2CanonicalizePayload(route, payload);

            const selectedFile = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
            if (requiresFile && !selectedFile) {
                if (fileError) {
                    fileError.textContent = 'A file is required for this intake route.';
                    fileError.classList.add('visible');
                }
                throw new Error('attachment_required');
            }

            if (selectedFile) {
                const extension = portalV2ExtractFileExtension(selectedFile.name);
                if (!PORTAL_V2_ALLOWED_EXTENSIONS.has(extension)) {
                    if (fileError) {
                        fileError.textContent = 'Unsupported file type. Use PDF, DOC/DOCX, PPT/PPTX, TXT, PNG, or JPG.';
                        fileError.classList.add('visible');
                    }
                    throw new Error('attachment_validation');
                }
                if (selectedFile.size > PORTAL_V2_MAX_BYTES) {
                    if (fileError) {
                        fileError.textContent = 'Attachment exceeds 8MB limit.';
                        fileError.classList.add('visible');
                    }
                    throw new Error('attachment_validation');
                }

                setStatus('Preparing attachment upload...');
                const fileBase64 = await portalV2ReadFileAsBase64(selectedFile);
                canonicalPayload.attachment_name = selectedFile.name;
                canonicalPayload.attachment_type = selectedFile.type || '';
                canonicalPayload.attachment_size = String(selectedFile.size);
                canonicalPayload.attachment_data = fileBase64;
            } else {
                canonicalPayload.attachment_name = '';
                canonicalPayload.attachment_type = '';
                canonicalPayload.attachment_size = '';
                canonicalPayload.attachment_data = '';
            }

            setStatus('Submitting your intake...');
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(canonicalPayload)
            });
            const body = await response.json().catch(() => null);
            const ok = response.ok && body && body.ok === true;
            if (!ok) throw new Error((body && body.error) ? body.error : 'server_error');

            setStatus('Submitted successfully. Your intake has been routed for review.', 'success');
            form.reset();
            if (fileInput) fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            syncRouteFieldLogic();
            if (postSubmitUrl) {
                window.setTimeout(() => {
                    window.location.href = postSubmitUrl;
                }, 250);
            }
        } catch (err) {
            const code = String((err && err.message) || '');
            const isAttachmentIssue = code.includes('attachment') || code.includes('file_') || code.includes('invalid_attachment');
            if (isAttachmentIssue && fileError) {
                if (!fileError.textContent) fileError.textContent = 'Attachment upload failed. Please review type and size.';
                fileError.classList.add('visible');
            }
            setStatus(portalV2FriendlyErrorMessage(code), 'error');
        } finally {
            inFlight = false;
            submitButtons.forEach((btn) => {
                if (!(btn instanceof HTMLButtonElement)) return;
                btn.disabled = false;
                btn.textContent = btn.dataset.defaultLabel || 'Submit';
            });
        }
    });
});
