/* ── Department data ──────────────────────────────────────────────────────── */
const DEPARTMENTS = {
    UG: [
        'TAMIL','ENGLISH','MATHEMATICS','STATISTICS','COMPUTER SCIENCE',
        'COMPUTER APPLICATIONS','COMMERCE','COMMERCE COMPUTER APPLICATIONS',
        'BUSINESS ADMINISTRATION','BIOCHEMISTRY','BIOTECHNOLOGY',
        'PHYSICS','CHEMISTRY','ND','ID','PSYCHOLOGY'
    ],
    PG: [
        'TAMIL','ENGLISH','MATHEMATICS','COMPUTER SCIENCE','COMPUTER APPLICATIONS',
        'COMMERCE','COMMERCE COMPUTER APPLICATIONS','BUSINESS ADMINISTRATION',
        'BIOCHEMISTRY','BIOTECHNOLOGY','PHYSICS','CHEMISTRY','ND','PSYCHOLOGY'
    ],
    'M.Phil': ['MATHEMATICS','COMPUTER SCIENCE','COMMERCE','BIOCHEMISTRY','ENGLISH']
};

/* ── State ────────────────────────────────────────────────────────────────── */
let currentStep        = 1;
let paymentVerified    = false;
let selectedContribution = null;

const PAYMENT_REQUIRED = ['POOR STUDENTS EDUCATION EXPENSES', 'ORPHANAGES / OLD AGE HOMES'];

/* ── Degree → Department & Batch ─────────────────────────────────────────── */
document.getElementById('degree').addEventListener('change', function () {
    populateDepartments(this.value);
    populateBatch(this.value);
});

function populateDepartments(degree) {
    const sel = document.getElementById('department');
    sel.innerHTML = '<option value="">-- Select Department --</option>';
    if (!degree || !DEPARTMENTS[degree]) return;
    DEPARTMENTS[degree].forEach(dept => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = dept;
        sel.appendChild(opt);
    });
}

function populateBatch(degree) {
    const sel = document.getElementById('batch');
    sel.innerHTML = '<option value="">-- Select Batch --</option>';
    if (!degree) return;
    // UG: 3-year spans 1990-1993 up to 2022-2025
    // PG/M.Phil: 2-year spans 1990-1992 up to 2023-2025
    const span      = degree === 'UG' ? 3 : 2;
    const endStart  = degree === 'UG' ? 2022 : 2023;
    for (let y = 1990; y <= endStart; y++) {
        const opt = document.createElement('option');
        opt.value = opt.textContent = `${y}-${y + span}`;
        sel.appendChild(opt);
    }
}

/* ── Status radio → conditional fields ───────────────────────────────────── */
function toggleStatusFields(status) {
    document.getElementById('working-fields').style.display  = status === 'Working'  ? 'block' : 'none';
    document.getElementById('studying-fields').style.display = status === 'Studying' ? 'block' : 'none';
}

/* ── Occupation "Other" ───────────────────────────────────────────────────── */
function toggleOccupationOther() {
    const val = document.getElementById('occupation').value;
    const og  = document.getElementById('occupation-other-group');
    og.style.display = val === 'Other' ? 'flex' : 'none';
    if (val !== 'Other') {
        document.getElementById('occupation_other').value = '';
    }
}

/* ── Resource Persons Yes/No toggle ──────────────────────────────────────── */
function toggleResourceOptions(radio) {
    const section = document.getElementById('resource-options-section');
    section.style.display = radio.value === 'yes' ? 'block' : 'none';
    if (radio.value === 'no') {
        document.querySelectorAll('input[name="resource_persons_option"]').forEach(r => { r.checked = false; });
    }
}

/* ── Contribution radio → payment section ────────────────────────────────── */
function toggleContributionPayment(value) {
    selectedContribution = value;
    const needsPayment = PAYMENT_REQUIRED.includes(value);
    document.getElementById('payment-section').style.display = needsPayment ? 'block' : 'none';

    if (!needsPayment) {
        resetPaymentState();
    } else {
        paymentVerified = false;
        document.getElementById('payment-success-banner').style.display  = 'none';
        document.getElementById('payment-cancelled-banner').style.display = 'none';
        document.getElementById('payment-status-display').style.display  = 'none';
        // Show screenshot section immediately when payment option is selected
        document.getElementById('payment-screenshot-section').style.display = 'block';
        document.getElementById('contribution_amount').value = '';
        const btn = document.getElementById('pay-now-btn');
        btn.disabled = false;
        btn.textContent = '💳 Pay via Razorpay';
        clearHiddenPaymentFields();
    }
}

function resetPaymentState() {
    paymentVerified = false;
    document.getElementById('payment-success-banner').style.display  = 'none';
    document.getElementById('payment-cancelled-banner').style.display = 'none';
    document.getElementById('payment-status-display').style.display  = 'none';
    document.getElementById('payment-screenshot-section').style.display = 'none';
    document.getElementById('contribution_amount').value = '';
    clearHiddenPaymentFields();
}

function clearHiddenPaymentFields() {
    ['payment_status_field','payment_reference_field',
     'razorpay_payment_id_field','razorpay_order_id_field','razorpay_signature_field']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ── Copy UPI ID ──────────────────────────────────────────────────────────── */
function copyUpiId() {
    const upiId = UPI_ID || document.getElementById('upi-id-display').textContent.trim();
    if (!upiId) return;
    navigator.clipboard.writeText(upiId).then(() => {
        const btn = document.querySelector('.copy-btn');
        if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.textContent = 'Copy UPI ID'; }, 2000); }
    }).catch(() => {
        prompt('Copy this UPI ID:', upiId);
    });
}

/* ── Step navigation ──────────────────────────────────────────────────────── */
function nextStep(step) {
    if (!validateStep(step)) return;
    document.getElementById(`step-${step}`).classList.remove('active');
    document.getElementById(`step-${step + 1}`).classList.add('active');
    document.getElementById(`prog-${step}`).classList.add('completed');
    document.getElementById(`prog-${step + 1}`).classList.add('active');
    if (step > 1) document.getElementById(`line-${step - 1}`).classList.add('active');
    document.getElementById(`line-${step}`).classList.add('active');
    currentStep = step + 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    document.getElementById(`step-${step}`).classList.remove('active');
    document.getElementById(`step-${step - 1}`).classList.add('active');
    document.getElementById(`prog-${step}`).classList.remove('active');
    currentStep = step - 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Step validation ──────────────────────────────────────────────────────── */
function validateStep(step) {
    clearErrors();
    let valid = true;

    if (step === 1) {
        const name       = document.getElementById('name').value.trim();
        const email      = document.getElementById('email').value.trim();
        const phone      = document.getElementById('phone').value.trim();
        const degree     = document.getElementById('degree').value;
        const department = document.getElementById('department').value;
        const batch      = document.getElementById('batch').value;
        const status     = document.querySelector('input[name="status"]:checked');
        const occupation = document.getElementById('occupation').value;
        const occOther   = document.getElementById('occupation_other').value.trim();

        if (!name)  { showError('err-name',  'Full name is required'); valid = false; }

        if (!email) {
            showError('err-email', 'Email is required'); valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('err-email', 'Please enter a valid email address'); valid = false;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        if (!phone) {
            showError('err-phone', 'Phone number is required'); valid = false;
        } else if (cleanPhone.length !== 10) {
            showError('err-phone', 'Phone number must be exactly 10 digits'); valid = false;
        }

        if (!degree)     { showError('err-degree',     'Please select a degree');        valid = false; }
        if (!department) { showError('err-department', 'Please select a department');    valid = false; }
        if (!batch)      { showError('err-batch',      'Please select your batch');      valid = false; }
        if (!status)     { showError('err-status',     'Please select your current status'); valid = false; }

        // Validate working fields
        if (status && status.value === 'Working') {
            if (!document.getElementById('designation').value.trim()) {
                showError('err-status', 'Please enter your designation'); valid = false;
            }
            if (!document.getElementById('company_address').value.trim()) {
                showError('err-status', 'Please enter your company address'); valid = false;
            }
            const apptOrder = document.getElementById('appointment_order');
            if (!apptOrder.files || apptOrder.files.length === 0) {
                showError('err-appointment-order', 'Please upload your appointment order'); valid = false;
            }
            const companyId = document.getElementById('company_id_card');
            if (!companyId.files || companyId.files.length === 0) {
                showError('err-company-id-card', 'Please upload your company ID card'); valid = false;
            }
        }

        // Validate studying fields
        if (status && status.value === 'Studying') {
            if (!document.getElementById('program').value.trim()) {
                showError('err-status', 'Please enter your program/course'); valid = false;
            }
            if (!document.getElementById('college_address').value.trim()) {
                showError('err-status', 'Please enter your college address'); valid = false;
            }
            const studyId = document.getElementById('study_id_card');
            if (!studyId.files || studyId.files.length === 0) {
                showError('err-study-id-card', 'Please upload your college ID card'); valid = false;
            }
        }

        if (!occupation) { showError('err-occupation', 'Please select your occupation'); valid = false; }
        if (occupation === 'Other' && !occOther) {
            showError('err-occupation-other', 'Please specify your occupation'); valid = false;
        }
    }

    if (step === 2) {
        const likertQs = ['curr_q1','curr_q2','curr_q3','curr_q4','curr_q5','curr_q6','curr_q7','curr_q8'];
        const allAnswered = likertQs.every(q => document.querySelector(`input[name="${q}"]:checked`));
        if (!allAnswered) {
            showError('err-curriculum', 'Please answer all curriculum rating questions (Q1–Q8) before proceeding');
            valid = false;
        }
        const currOpen1 = document.getElementById('curr_open1').value.trim();
        const currOpen2 = document.getElementById('curr_open2').value.trim();
        if (!currOpen1) { showError('err-curr-open1', 'This field is required — please share your suggestions'); valid = false; }
        if (!currOpen2) { showError('err-curr-open2', 'This field is required — please add any additional comments'); valid = false; }
    }

    return valid;
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
}

/* ── Razorpay Checkout ────────────────────────────────────────────────────── */
async function openRazorpay() {
    clearErrors();

    const amount = parseFloat(document.getElementById('contribution_amount').value);
    if (!amount || amount < 1) {
        showError('err-amount', 'Please enter a valid contribution amount (minimum ₹1)');
        return;
    }

    const keyId = (PAYMENT_SETTINGS.razorpayKeyId || '').trim();
    if (!keyId) {
        showPaymentStatus('error', '⚠️ Payment gateway not configured. Please contact admin or use UPI methods below.');
        return;
    }

    const btn = document.getElementById('pay-now-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Initialising...';

    let orderData;
    try {
        const res = await fetch('create_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount, currency: 'INR' })
        });
        orderData = await res.json();
    } catch (err) {
        btn.disabled = false;
        btn.textContent = '💳 Pay via Razorpay';
        showPaymentStatus('error', '⚠️ Could not connect to payment server. Please try again.');
        return;
    }

    if (!orderData || !orderData.order_id) {
        btn.disabled = false;
        btn.textContent = '💳 Pay via Razorpay';
        showPaymentStatus('error', '⚠️ Failed to create payment order. ' + (orderData && orderData.message ? orderData.message : 'Please try again.'));
        return;
    }

    const alumniName  = document.getElementById('name').value.trim();
    const alumniEmail = document.getElementById('email').value.trim();
    const alumniPhone = document.getElementById('phone').value.trim();

    const options = {
        key:         keyId,
        amount:      orderData.amount,
        currency:    orderData.currency || 'INR',
        order_id:    orderData.order_id,
        name:        'Alumni Contribution',
        description: selectedContribution || 'Alumni Contribution',
        prefill:     { name: alumniName, email: alumniEmail, contact: alumniPhone },
        theme:       { color: '#1a3c6e' },

        handler: async function (response) {
            try {
                const vRes = await fetch('verify_payment.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id:   response.razorpay_order_id,
                        razorpay_signature:  response.razorpay_signature
                    })
                });
                const vData = await vRes.json();

                if (vData.verified) {
                    paymentVerified = true;
                    document.getElementById('payment_status_field').value      = 'Paid';
                    document.getElementById('payment_reference_field').value   = response.razorpay_payment_id;
                    document.getElementById('razorpay_payment_id_field').value = response.razorpay_payment_id;
                    document.getElementById('razorpay_order_id_field').value   = response.razorpay_order_id;
                    document.getElementById('razorpay_signature_field').value  = response.razorpay_signature;

                    document.getElementById('payment-success-banner').style.display  = 'flex';
                    document.getElementById('payment-cancelled-banner').style.display = 'none';
                    document.getElementById('payment-status-display').style.display  = 'none';
                    btn.textContent = '✅ Payment Complete';
                    btn.style.background = '#10b981';
                    window.scrollTo({ top: document.getElementById('payment-success-banner').offsetTop - 20, behavior: 'smooth' });
                } else {
                    paymentVerified = false;
                    btn.disabled = false;
                    btn.textContent = '💳 Pay via Razorpay';
                    showPaymentStatus('error', '⚠️ Payment verification failed: ' + (vData.message || 'Please contact admin.'));
                }
            } catch (e) {
                paymentVerified = false;
                btn.disabled = false;
                btn.textContent = '💳 Pay via Razorpay';
                showPaymentStatus('error', '⚠️ Could not verify payment. Please contact admin with payment ID: ' + response.razorpay_payment_id);
            }
        },

        modal: {
            ondismiss: function () {
                paymentVerified = false;
                btn.disabled = false;
                btn.textContent = '💳 Pay via Razorpay';
                document.getElementById('payment-cancelled-banner').style.display = 'flex';
                document.getElementById('payment-success-banner').style.display  = 'none';
                document.getElementById('payment-status-display').style.display  = 'none';
            }
        }
    };

    try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            paymentVerified = false;
            btn.disabled = false;
            btn.textContent = '💳 Pay via Razorpay';
            showPaymentStatus('error', '❌ Payment failed: ' + (response.error.description || 'Unknown error'));
        });
        rzp.open();
    } catch (e) {
        btn.disabled = false;
        btn.textContent = '💳 Pay via Razorpay';
        showPaymentStatus('error', '⚠️ Could not open payment gateway. Please try again.');
    }
}

function showPaymentStatus(type, message) {
    const el = document.getElementById('payment-status-display');
    el.style.display = 'block';
    el.className = 'payment-status-msg payment-status-' + type;
    el.innerHTML = message;
}

/* ── Form Submission ──────────────────────────────────────────────────────── */
async function submitForm() {
    clearErrors();
    let valid = true;

    // Validate teaching Likert questions
    const teachQs = ['teach_q1','teach_q2','teach_q3','teach_q4','teach_q5',
                     'teach_q6','teach_q7','teach_q8','teach_q9','teach_q10'];
    const allTeachAnswered = teachQs.every(q => document.querySelector(`input[name="${q}"]:checked`));
    if (!allTeachAnswered) {
        showError('err-teaching', 'Please answer all teaching & learning rating questions (Q1–Q10)');
        window.scrollTo({ top: document.getElementById('step-3').offsetTop - 80, behavior: 'smooth' });
        valid = false;
    }

    // Validate teaching open-ended
    const teachOpen1 = document.getElementById('teach_open1').value.trim();
    const teachOpen2 = document.getElementById('teach_open2').value.trim();
    if (!teachOpen1) { showError('err-teach-open1', 'This field is required — please share the teaching methods you found most effective'); valid = false; }
    if (!teachOpen2) { showError('err-teach-open2', 'This field is required — please share your suggestions for improvement'); valid = false; }

    // Validate resource persons
    const resourcePersons = document.querySelector('input[name="resource_persons"]:checked');
    if (!resourcePersons) {
        showError('err-resource-persons', 'Please indicate whether you can arrange resource persons');
        valid = false;
    } else if (resourcePersons.value === 'yes') {
        const optionSelected = document.querySelector('input[name="resource_persons_option"]:checked');
        if (!optionSelected) {
            showError('err-resource-options', 'Please select the type of resource person you can arrange');
            valid = false;
        }
    }

    // Validate contribution choice
    const contribution = document.querySelector('input[name="contribution_choice"]:checked');
    if (!contribution) {
        showError('err-contribution', 'Please indicate your willingness to contribute');
        valid = false;
    }

    if (!valid) return;

    // Validate payment if required
    if (PAYMENT_REQUIRED.includes(selectedContribution)) {
        const amount = parseFloat(document.getElementById('contribution_amount').value);
        if (!amount || amount < 1) {
            showError('err-amount', 'Please enter a contribution amount');
            document.getElementById('contribution_amount').focus();
            return;
        }
        if (!paymentVerified) {
            showError('err-submit', 'Please complete and verify your payment before submitting.');
            document.getElementById('payment-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }
        const screenshotInput = document.getElementById('payment_screenshot');
        if (!screenshotInput.files || screenshotInput.files.length === 0) {
            showError('err-payment-screenshot', 'Please upload a payment screenshot');
            screenshotInput.focus();
            return;
        }
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';

    try {
        const formData = new FormData(document.getElementById('feedback-form'));
        // Include resource persons option (radio) as the array-named field the backend expects
        const rpOption = document.querySelector('input[name="resource_persons_option"]:checked');
        if (rpOption) formData.set('resource_persons_options', rpOption.value);

        const res  = await fetch('api.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            document.getElementById('feedback-form').style.display    = 'none';
            document.querySelector('.progress-bar').style.display     = 'none';
            document.getElementById('form-success').style.display     = 'block';
            document.getElementById('payment-success-banner').style.display  = 'none';
            document.getElementById('payment-cancelled-banner').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showError('err-submit', data.message || data.error || 'Submission failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback ✓';
        }
    } catch (err) {
        showError('err-submit', 'Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback ✓';
    }
}
