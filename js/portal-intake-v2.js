const PORTAL_V2_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzDrmbMTExgcsq7-LfzYv7VLu9X5w93lDZMkXRfi0EnhPzlKL6KASMvukCGD5LvxHKD/exec';
const PORTAL_V2_MAX_BYTES = 8 * 1024 * 1024;
const PORTAL_V2_ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg']);

function portalV2NormalizeRoute(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'investment' || raw === 'press' || raw === 'employment' || raw === 'internship') return raw;
    return '';
}

function portalV2ExtractFileExtension(filename) {
    const raw = String(filename || '').trim();
    const idx = raw.lastIndexOf('.');
    if (idx < 0) return '';
    return raw.slice(idx + 1).toLowerCase();
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
    const submitButton = form.querySelector('button[type="submit"]');

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

        clearFileError();
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }

        try {
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            delete payload.application_file;

            payload.submission_type = route;
            payload.concierge_track = payload.concierge_track || `${route}_portal`;
            payload.page_path = window.location.pathname || '/';
            payload.referrer = document.referrer || 'direct';
            payload.submission_id = portalV2SubmissionId(route);
            payload.timestamp_local = new Date().toISOString();

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
                payload.attachment_name = selectedFile.name;
                payload.attachment_type = selectedFile.type || '';
                payload.attachment_size = String(selectedFile.size);
                payload.attachment_data = fileBase64;
            } else {
                payload.attachment_name = '';
                payload.attachment_type = '';
                payload.attachment_size = '';
                payload.attachment_data = '';
            }

            setStatus('Submitting your intake...');
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const body = await response.json().catch(() => null);
            const ok = response.ok && body && body.ok === true;
            if (!ok) throw new Error((body && body.error) ? body.error : 'server_error');

            setStatus('Submitted successfully. Your intake has been routed for review.', 'success');
            form.reset();
        } catch (err) {
            const code = String((err && err.message) || '');
            const isAttachmentIssue = code.includes('attachment') || code.includes('file_') || code.includes('invalid_attachment');
            if (isAttachmentIssue && fileError) {
                if (!fileError.textContent) fileError.textContent = 'Attachment upload failed. Please review type and size.';
                fileError.classList.add('visible');
            }
            setStatus('Unable to submit right now. Please try again shortly.', 'error');
        } finally {
            inFlight = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitButton.dataset.defaultLabel || submitButton.textContent || 'Submit';
            }
        }
    });
});
