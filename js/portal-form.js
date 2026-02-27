const PORTAL_FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzDrmbMTExgcsq7-LfzYv7VLu9X5w93lDZMkXRfi0EnhPzlKL6KASMvukCGD5LvxHKD/exec';

const generateSubmissionId = () => {
    return `portal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeTypeForPortal = (value) => {
    if (!value) return 'investor';
    const normalized = value.trim().toLowerCase();
    return normalized === 'employment' ? 'employment' : 'investor';
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('portalApplicationForm');
    if (!form) return;
    const submissionInput = document.getElementById('portalSubmissionType');
    const trackInput = document.getElementById('portalTrack');
    const statusNode = document.getElementById('portalFormStatus');
    const submitButton = form.querySelector('button[type="submit"]');
    const updateFields = () => {
        const checked = form.querySelector('input[name="application_type"]:checked');
        const normalized = normalizeTypeForPortal(checked ? checked.value : 'investor');
        submissionInput.value = normalized;
        trackInput.value = normalized === 'employment' ? 'employment_portal' : 'investment_portal';
    };
    form.querySelectorAll('input[name="application_type"]').forEach(radio => {
        radio.addEventListener('change', updateFields);
    });
    updateFields();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }
        if (statusNode) {
            statusNode.textContent = 'Sending your application…';
        }

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.submission_type = normalizeTypeForPortal(payload.submission_type);
        payload.concierge_track = payload.concierge_track || `portal_${payload.submission_type || 'investor'}`;
        payload.page_path = '/portal.html';
        payload.referrer = document.referrer || 'direct';
        payload.submission_id = generateSubmissionId();
        payload.timestamp_local = new Date().toISOString();

        try {
            const response = await fetch(PORTAL_FORM_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const body = await response.json().catch(() => null);
            const success = response.ok && body && body.ok;
            if (!success) {
                throw new Error(body && body.error ? body.error : 'server_error');
            }
            if (statusNode) {
                statusNode.textContent = 'Submitted. Our team will reach out within two business days.';
            }
            form.reset();
            updateFields();
        } catch (error) {
            if (statusNode) {
                statusNode.textContent = 'Unable to submit right now. Please try again in a few minutes.';
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit application';
            }
        }
    });
});
