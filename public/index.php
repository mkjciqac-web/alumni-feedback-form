<?php include 'config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alumni Feedback Form – <?php echo COLLEGE_NAME; ?></title>
    <link rel="stylesheet" href="style.css">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <div class="header-logo">
                <div class="logo-icon">🎓</div>
                <div class="header-text">
                    <h1><?php echo SITE_NAME; ?></h1>
                    <p><?php echo COLLEGE_NAME; ?></p>
                </div>
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <!-- Progress Bar -->
            <div class="progress-bar">
                <div class="progress-step active" id="prog-1">
                    <div class="step-circle">1</div>
                    <div class="step-label">Registration</div>
                </div>
                <div class="progress-line" id="line-1"></div>
                <div class="progress-step" id="prog-2">
                    <div class="step-circle">2</div>
                    <div class="step-label">Curriculum</div>
                </div>
                <div class="progress-line" id="line-2"></div>
                <div class="progress-step" id="prog-3">
                    <div class="step-circle">3</div>
                    <div class="step-label">Teaching &amp; Learning</div>
                </div>
            </div>

            <div id="form-success" class="success-message" style="display:none;">
                <div class="success-icon">✅</div>
                <h2>Thank You!</h2>
                <p>Your feedback has been submitted successfully. We appreciate your valuable contribution.</p>
                <button class="btn-primary" onclick="location.reload()">Submit Another Response</button>
            </div>

            <div id="payment-success-banner" class="payment-banner payment-success" style="display:none;">
                ✅ Payment Successful! Your contribution has been recorded.
            </div>
            <div id="payment-cancelled-banner" class="payment-banner payment-cancelled" style="display:none;">
                ❌ Payment was cancelled. You can try again or choose a different contribution option.
            </div>

            <form id="feedback-form" enctype="multipart/form-data" novalidate>

                <!-- ═══════════════════════════════════════════════════════════
                     STEP 1: Registration
                ═══════════════════════════════════════════════════════════ -->
                <div class="step active" id="step-1">
                    <div class="step-header">
                        <h2>Step 1: Alumni Registration</h2>
                        <p>Please provide your personal and academic information. All fields marked <span class="required">*</span> are required.</p>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="name">Full Name <span class="required">*</span></label>
                            <input type="text" id="name" name="name" placeholder="Enter your full name" required>
                            <span class="field-error" id="err-name"></span>
                        </div>
                        <div class="form-group">
                            <label for="email">Email Address <span class="required">*</span></label>
                            <input type="email" id="email" name="email" placeholder="your@email.com" required>
                            <span class="field-error" id="err-email"></span>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">Phone Number <span class="required">*</span></label>
                            <input type="tel" id="phone" name="phone" placeholder="10-digit mobile number" maxlength="10" required>
                            <span class="field-error" id="err-phone"></span>
                        </div>
                        <div class="form-group">
                            <label for="degree">Degree <span class="required">*</span></label>
                            <select id="degree" name="degree" required>
                                <option value="">-- Select Degree --</option>
                                <option value="UG">UG (Under Graduate)</option>
                                <option value="PG">PG (Post Graduate)</option>
                                <option value="M.Phil">M.Phil</option>
                            </select>
                            <span class="field-error" id="err-degree"></span>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="department">Department <span class="required">*</span></label>
                            <select id="department" name="department" required>
                                <option value="">-- Select Degree First --</option>
                            </select>
                            <span class="field-error" id="err-department"></span>
                        </div>
                        <div class="form-group">
                            <label for="batch">Batch (Year of Study) <span class="required">*</span></label>
                            <select id="batch" name="batch" required>
                                <option value="">-- Select Degree First --</option>
                            </select>
                            <span class="field-error" id="err-batch"></span>
                        </div>
                    </div>

                    <!-- Status – radio buttons (single-select) -->
                    <div class="form-group">
                        <label>Current Status <span class="required">*</span></label>
                        <div class="radio-group" id="status-group">
                            <label class="radio-label">
                                <input type="radio" name="status" value="Working" onchange="toggleStatusFields(this.value)"> Working
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="status" value="Studying" onchange="toggleStatusFields(this.value)"> Studying
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="status" value="Other" onchange="toggleStatusFields(this.value)"> Other
                            </label>
                        </div>
                        <span class="field-error" id="err-status"></span>
                    </div>

                    <!-- Working Fields -->
                    <div id="working-fields" class="conditional-section" style="display:none;">
                        <div class="section-divider"><span>Employment Details</span></div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="company_name">Company Name <span class="required">*</span></label>
                                <input type="text" id="company_name" name="company_name" placeholder="Current employer">
                            </div>
                            <div class="form-group">
                                <label for="designation">Designation / Role <span class="required">*</span></label>
                                <input type="text" id="designation" name="designation" placeholder="Your role/position">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="company_address">Company Address <span class="required">*</span></label>
                            <textarea id="company_address" name="company_address" rows="2" placeholder="Full company address"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment_order">Upload Appointment Order <span class="required">*</span></label>
                                <div class="file-upload-wrapper">
                                    <input type="file" id="appointment_order" name="appointment_order" accept="image/*,.pdf">
                                    <div class="file-upload-hint">Accepted: JPG, PNG, PDF (max 5MB)</div>
                                </div>
                                <span class="field-error" id="err-appointment-order"></span>
                            </div>
                            <div class="form-group">
                                <label for="company_id_card">Upload Company ID Card <span class="required">*</span></label>
                                <div class="file-upload-wrapper">
                                    <input type="file" id="company_id_card" name="company_id_card" accept="image/*,.pdf">
                                    <div class="file-upload-hint">Accepted: JPG, PNG, PDF (max 5MB)</div>
                                </div>
                                <span class="field-error" id="err-company-id-card"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Studying Fields -->
                    <div id="studying-fields" class="conditional-section" style="display:none;">
                        <div class="section-divider"><span>Study Details</span></div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="college_name_field">College / University Name <span class="required">*</span></label>
                                <input type="text" id="college_name_field" name="college_name_field" placeholder="Name of institution">
                            </div>
                            <div class="form-group">
                                <label for="program">Program / Course <span class="required">*</span></label>
                                <input type="text" id="program" name="program" placeholder="e.g. M.Tech, MBA">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="college_address">College Address <span class="required">*</span></label>
                            <textarea id="college_address" name="college_address" rows="2" placeholder="Full college address"></textarea>
                        </div>
                        <div class="form-group" style="max-width:380px;">
                            <label for="study_id_card">Upload College ID Card <span class="required">*</span></label>
                            <div class="file-upload-wrapper">
                                <input type="file" id="study_id_card" name="study_id_card" accept="image/*,.pdf">
                                <div class="file-upload-hint">Accepted: JPG, PNG, PDF (max 5MB)</div>
                            </div>
                            <span class="field-error" id="err-study-id-card"></span>
                        </div>
                    </div>

                    <!-- Occupation -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="occupation">Occupation <span class="required">*</span></label>
                            <select id="occupation" name="occupation" required onchange="toggleOccupationOther()">
                                <option value="">-- Select Occupation --</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Engineer">Engineer</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Business">Business</option>
                                <option value="Government Employee">Government Employee</option>
                                <option value="Other">Other</option>
                            </select>
                            <span class="field-error" id="err-occupation"></span>
                        </div>
                        <div class="form-group" id="occupation-other-group" style="display:none;">
                            <label for="occupation_other">Please specify occupation <span class="required">*</span></label>
                            <input type="text" id="occupation_other" name="occupation_other" placeholder="Enter your occupation">
                            <span class="field-error" id="err-occupation-other"></span>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-primary" onclick="nextStep(1)" data-ocid="step1.primary_button">
                            Next: Curriculum Feedback →
                        </button>
                    </div>
                </div>

                <!-- ═══════════════════════════════════════════════════════════
                     STEP 2: Curriculum Feedback
                ═══════════════════════════════════════════════════════════ -->
                <div class="step" id="step-2">
                    <div class="step-header">
                        <h2>Step 2: Curriculum Feedback</h2>
                        <p>Please rate the following aspects of the curriculum. <strong>All questions are compulsory.</strong></p>
                    </div>

                    <!-- Q1: Strongly Agree / Disagree scale -->
                    <div class="likert-wrapper">
                        <table class="likert-table">
                            <thead>
                                <tr>
                                    <th class="q-col">Question</th>
                                    <th>Strongly<br>Agree (5)</th>
                                    <th>Agree (4)</th>
                                    <th>Neutral (3)</th>
                                    <th>Disagree (2)</th>
                                    <th>Strongly<br>Disagree (1)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="q-text">1. Curriculum inculcates creative analytical, problem solving, decision making skills</td>
                                    <td class="radio-cell"><label class="radio-circle"><input type="radio" name="curr_q1" value="5" required><span>SA</span></label></td>
                                    <td class="radio-cell"><label class="radio-circle"><input type="radio" name="curr_q1" value="4"><span>A</span></label></td>
                                    <td class="radio-cell"><label class="radio-circle"><input type="radio" name="curr_q1" value="3"><span>N</span></label></td>
                                    <td class="radio-cell"><label class="radio-circle"><input type="radio" name="curr_q1" value="2"><span>D</span></label></td>
                                    <td class="radio-cell"><label class="radio-circle"><input type="radio" name="curr_q1" value="1"><span>SD</span></label></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Q2–Q8: Excellent scale -->
                    <div class="likert-wrapper" style="margin-top:16px;">
                        <table class="likert-table">
                            <thead>
                                <tr>
                                    <th class="q-col">Question</th>
                                    <th>Excellent (5)</th>
                                    <th>Very Good (4)</th>
                                    <th>Good (3)</th>
                                    <th>Satisfactory (2)</th>
                                    <th>Un Satisfactory (1)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $currQ2to8 = [
                                    'curr_q2' => 'Programme content includes Project work/field trip/internship/Practical, and it was effective, useful',
                                    'curr_q3' => 'The subjects offered were up-to-date and industry-relevant',
                                    'curr_q4' => 'Curriculum integrates human values, ethics, environment and Sustainability',
                                    'curr_q5' => 'Curriculum Focus on Employability skills like communication, team work, adaptability',
                                    'curr_q6' => 'The curriculum allowed me to develop soft skills like time management, conflict resolution, ethics',
                                    'curr_q7' => 'Curriculum prepared me to transition from academic to professional life',
                                    'curr_q8' => 'Availability of books for Curriculum',
                                ];
                                $qNum = 2;
                                foreach ($currQ2to8 as $name => $question):
                                ?>
                                <tr>
                                    <td class="q-text"><?php echo $qNum; ?>. <?php echo htmlspecialchars($question); ?></td>
                                    <?php for ($i = 5; $i >= 1; $i--): ?>
                                    <td class="radio-cell">
                                        <label class="radio-circle">
                                            <input type="radio" name="<?php echo $name; ?>" value="<?php echo $i; ?>" <?php echo ($i === 5) ? 'required' : ''; ?>>
                                            <span><?php echo $i; ?></span>
                                        </label>
                                    </td>
                                    <?php endfor; ?>
                                </tr>
                                <?php $qNum++; endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <span class="field-error" id="err-curriculum"></span>

                    <!-- Q9 & Q10: Open-ended (required) -->
                    <div class="form-group mt-2">
                        <label for="curr_open1">9. What improvements would you suggest for curriculum and teaching? <span class="required">*</span></label>
                        <textarea id="curr_open1" name="curr_open1" rows="3" placeholder="Your suggestions for curriculum improvement..." required></textarea>
                        <span class="field-error" id="err-curr-open1"></span>
                    </div>
                    <div class="form-group">
                        <label for="curr_open2">10. Any additional comments or suggestions? <span class="required">*</span></label>
                        <textarea id="curr_open2" name="curr_open2" rows="3" placeholder="Any other comments or suggestions..." required></textarea>
                        <span class="field-error" id="err-curr-open2"></span>
                    </div>

                    <div class="form-actions between">
                        <button type="button" class="btn-secondary" onclick="prevStep(2)" data-ocid="step2.secondary_button">← Back</button>
                        <button type="button" class="btn-primary" onclick="nextStep(2)" data-ocid="step2.primary_button">Next: Teaching Feedback →</button>
                    </div>
                </div>

                <!-- ═══════════════════════════════════════════════════════════
                     STEP 3: Teaching & Learning Feedback
                ═══════════════════════════════════════════════════════════ -->
                <div class="step" id="step-3">
                    <div class="step-header">
                        <h2>Step 3: Teaching &amp; Learning Feedback</h2>
                        <p>Please rate the following aspects of teaching. <strong>All questions are compulsory.</strong></p>
                    </div>

                    <!-- TL1–TL10: Excellent scale -->
                    <div class="likert-wrapper">
                        <table class="likert-table">
                            <thead>
                                <tr>
                                    <th class="q-col">Question</th>
                                    <th>Excellent (5)</th>
                                    <th>Very Good (4)</th>
                                    <th>Good (3)</th>
                                    <th>Satisfactory (2)</th>
                                    <th>Un Satisfactory (1)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $teachingQuestions = [
                                    'teach_q1'  => 'Teachers are well prepared and knowledgeable in their subject area',
                                    'teach_q2'  => 'Teachers effectively communicate complex concepts in an understandable manner',
                                    'teach_q3'  => 'Teachers use a variety of teaching methods to accommodate different learning styles',
                                    'teach_q4'  => 'Teachers provide constructive feedback on assignments and examinations',
                                    'teach_q5'  => 'Teachers are accessible and available for consultation outside of class hours',
                                    'teach_q6'  => 'Teachers encourage student participation and critical thinking in class',
                                    'teach_q7'  => 'Teachers integrate real-world examples and current developments into their teaching',
                                    'teach_q8'  => 'Teachers maintain a positive and inclusive classroom environment',
                                    'teach_q9'  => 'Use of technology and multimedia tools enhances your learning experience',
                                    'teach_q10' => 'Overall satisfaction with the teaching quality',
                                ];
                                $tNum = 1;
                                foreach ($teachingQuestions as $tname => $tquestion):
                                ?>
                                <tr>
                                    <td class="q-text"><?php echo $tNum; ?>. <?php echo htmlspecialchars($tquestion); ?></td>
                                    <?php for ($i = 5; $i >= 1; $i--): ?>
                                    <td class="radio-cell">
                                        <label class="radio-circle">
                                            <input type="radio" name="<?php echo $tname; ?>" value="<?php echo $i; ?>" <?php echo ($i === 5) ? 'required' : ''; ?>>
                                            <span><?php echo $i; ?></span>
                                        </label>
                                    </td>
                                    <?php endfor; ?>
                                </tr>
                                <?php $tNum++; endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    <span class="field-error" id="err-teaching"></span>

                    <!-- TO1 & TO2: Open-ended (required) -->
                    <div class="form-group mt-2">
                        <label for="teach_open1">What teaching methods did you find most effective during your studies? <span class="required">*</span></label>
                        <textarea id="teach_open1" name="teach_open1" rows="3" placeholder="Share the teaching methods you found most effective..." required></textarea>
                        <span class="field-error" id="err-teach-open1"></span>
                    </div>
                    <div class="form-group">
                        <label for="teach_open2">What suggestions do you have for improving the overall teaching and learning experience? <span class="required">*</span></label>
                        <textarea id="teach_open2" name="teach_open2" rows="3" placeholder="Your suggestions for teaching improvement..." required></textarea>
                        <span class="field-error" id="err-teach-open2"></span>
                    </div>

                    <!-- Resource Persons Section -->
                    <div class="resource-persons-section">
                        <div class="section-divider"><span>Resource Persons</span></div>
                        <div class="form-group">
                            <label class="contrib-label">Can You Arrange Resource Persons For? <span class="required">*</span></label>
                            <div class="radio-group" id="resource-persons-group">
                                <label class="radio-label">
                                    <input type="radio" name="resource_persons" value="yes" onchange="toggleResourceOptions(this)"> Yes
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="resource_persons" value="no" onchange="toggleResourceOptions(this)"> No
                                </label>
                            </div>
                            <span class="field-error" id="err-resource-persons"></span>
                        </div>

                        <div id="resource-options-section" class="conditional-section" style="display:none;">
                            <p class="resource-options-label">Select type: <span class="required">*</span></p>
                            <div class="radio-group vertical">
                                <label class="radio-label">
                                    <input type="radio" name="resource_persons_option" value="SEMINARS"> SEMINARS
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="resource_persons_option" value="GUEST LECTURES"> GUEST LECTURES
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="resource_persons_option" value="COLLEGE FUNCTIONS"> COLLEGE FUNCTIONS
                                </label>
                            </div>
                            <span class="field-error" id="err-resource-options"></span>
                        </div>
                    </div>

                    <!-- Contribution Section -->
                    <div class="contribution-section">
                        <div class="section-divider"><span>Willingness to Contribute</span></div>
                        <div class="form-group">
                            <label class="contrib-label">Are You Willing to Contribute For? <span class="required">*</span></label>
                            <div class="radio-group vertical" id="contribution-group">
                                <label class="radio-label">
                                    <input type="radio" name="contribution_choice" value="POOR STUDENTS EDUCATION EXPENSES" onchange="toggleContributionPayment(this.value)">
                                    POOR STUDENTS EDUCATION EXPENSES
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="contribution_choice" value="ORPHANAGES / OLD AGE HOMES" onchange="toggleContributionPayment(this.value)">
                                    ORPHANAGES / OLD AGE HOMES
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="contribution_choice" value="BOOKS TO LIBRARY & STUDENTS" onchange="toggleContributionPayment(this.value)">
                                    BOOKS TO LIBRARY &amp; STUDENTS
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="contribution_choice" value="None" onchange="toggleContributionPayment(this.value)">
                                    None
                                </label>
                            </div>
                            <span class="field-error" id="err-contribution"></span>
                        </div>

                        <!-- Payment Section (shown only for option A or B) -->
                        <div id="payment-section" class="payment-section" style="display:none;">
                            <div class="form-group payment-amount-group">
                                <label for="contribution_amount">Contribution Amount (₹) <span class="required">*</span></label>
                                <div class="amount-input-wrap">
                                    <span class="currency-symbol">₹</span>
                                    <input type="number" id="contribution_amount" name="contribution_amount" min="1" step="1" placeholder="Enter amount">
                                </div>
                                <span class="field-error" id="err-amount"></span>
                            </div>

                            <div id="payment-status-display" style="display:none;"></div>

                            <button type="button" class="pay-now-btn" id="pay-now-btn" onclick="openRazorpay()" data-ocid="payment.primary_button">
                                💳 Pay via Razorpay
                            </button>

                            <!-- UPI Alternatives -->
                            <div class="upi-alternatives">
                                <div class="upi-alt-heading">Or pay directly via UPI</div>
                                <div class="upi-alt-methods">
                                    <div class="upi-method">
                                        <span class="upi-method-icon">📱</span>
                                        <div>
                                            <div class="upi-method-title">Pay via Mobile Number</div>
                                            <div class="upi-method-val" id="upi-mobile-display"><?php echo htmlspecialchars(getSetting('upi_mobile', getSetting('upi_id', ''))); ?></div>
                                        </div>
                                    </div>
                                    <div class="upi-method">
                                        <span class="upi-method-icon">🆔</span>
                                        <div>
                                            <div class="upi-method-title">Pay via UPI ID</div>
                                            <div class="upi-method-val" id="upi-id-display"><?php echo htmlspecialchars(getSetting('upi_id', '')); ?></div>
                                            <?php if (getSetting('upi_id', '')): ?>
                                            <button type="button" class="copy-btn" onclick="copyUpiId()" data-ocid="payment.secondary_button">Copy UPI ID</button>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Payment Screenshot Upload -->
                            <div id="payment-screenshot-section" class="payment-screenshot-upload" style="display:none;">
                                <div class="form-group">
                                    <label for="payment_screenshot">Upload Payment Screenshot <span class="required">*</span></label>
                                    <div class="file-upload-wrapper">
                                        <input type="file" id="payment_screenshot" name="payment_screenshot" accept="image/jpeg,image/png,image/gif,image/webp,.pdf" data-ocid="payment.upload_button">
                                        <div class="file-upload-hint">Accepted: JPG, PNG, GIF, WEBP, PDF (max 5MB)</div>
                                    </div>
                                    <span class="field-error" id="err-payment-screenshot"></span>
                                </div>
                            </div>

                            <!-- Hidden payment fields -->
                            <input type="hidden" name="payment_status" id="payment_status_field" value="">
                            <input type="hidden" name="payment_reference" id="payment_reference_field" value="">
                            <input type="hidden" name="razorpay_payment_id" id="razorpay_payment_id_field" value="">
                            <input type="hidden" name="razorpay_order_id" id="razorpay_order_id_field" value="">
                            <input type="hidden" name="razorpay_signature" id="razorpay_signature_field" value="">
                        </div>
                    </div>

                    <div class="form-actions between">
                        <button type="button" class="btn-secondary" onclick="prevStep(3)" data-ocid="step3.secondary_button">← Back</button>
                        <button type="button" class="btn-primary" id="submit-btn" onclick="submitForm()" data-ocid="step3.submit_button">
                            Submit Feedback ✓
                        </button>
                    </div>
                    <span class="field-error" id="err-submit"></span>
                </div>
            </form>
        </div>
    </main>

    <footer class="site-footer">
        <p>&copy; <?php echo date('Y'); ?> <?php echo COLLEGE_NAME; ?></p>
    </footer>

    <script>
        const PAYMENT_SETTINGS = {
            razorpayKeyId:  <?php echo json_encode(getSetting('razorpay_key_id', '')); ?>,
            upiId:          <?php echo json_encode(getSetting('upi_id', '')); ?>,
            accountHolder:  <?php echo json_encode(getSetting('account_holder', 'Alumni Fund')); ?>,
        };
        const UPI_ID = <?php echo json_encode(getSetting('upi_id', '')); ?>;
    </script>
    <script src="form.js"></script>
</body>
</html>
