import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import SubmissionTypes "types/submission";
import IqacTypes "types/iqac";
import Common "types/common";
import SubmissionApi "mixins/submission-api";
import IqacApi "mixins/iqac-api";
import SettingsApi "mixins/settings-api";
import GeminiApi "mixins/gemini-api";

actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Migration types ──────────────────────────────────────────────────────
  // OldRegistration: the ORIGINAL deployed type — no file fields at all.
  type OldRegistration = {
    name : Text;
    email : Text;
    phone : Text;
    graduationYear : Nat;
    department : Text;
    degreeType : SubmissionTypes.DegreeType;
    currentStatus : SubmissionTypes.CurrentStatus;
    company : ?Text;
    designation : ?Text;
    college : ?Text;
    program : ?Text;
  };

  type OldSubmission = {
    submissionId : Common.SubmissionId;
    submittedAt : Common.Timestamp;
    registration : OldRegistration;
    curriculum : SubmissionTypes.CurriculumFeedback;
    teaching : SubmissionTypes.TeachingFeedback;
  };

  // RegistrationV2: intermediate type — has appointmentOrder/companyIdCard
  // but NOT companyAddress/collegeAddress/collegeIdCard.
  type RegistrationV2 = {
    name : Text;
    email : Text;
    phone : Text;
    graduationYear : Nat;
    department : Text;
    degreeType : SubmissionTypes.DegreeType;
    currentStatus : SubmissionTypes.CurrentStatus;
    company : ?Text;
    designation : ?Text;
    college : ?Text;
    program : ?Text;
    appointmentOrder : ?Text;
    companyIdCard : ?Text;
  };

  type SubmissionV2 = {
    submissionId : Common.SubmissionId;
    submittedAt : Common.Timestamp;
    registration : RegistrationV2;
    curriculum : SubmissionTypes.CurriculumFeedback;
    teaching : SubmissionTypes.TeachingFeedback;
  };

  // RegistrationV3: has all address/id fields but NOT occupation
  type RegistrationV3 = {
    name : Text;
    email : Text;
    phone : Text;
    graduationYear : Nat;
    department : Text;
    degreeType : SubmissionTypes.DegreeType;
    currentStatus : SubmissionTypes.CurrentStatus;
    company : ?Text;
    designation : ?Text;
    companyAddress : ?Text;
    college : ?Text;
    program : ?Text;
    collegeAddress : ?Text;
    appointmentOrder : ?Text;
    companyIdCard : ?Text;
    collegeIdCard : ?Text;
  };

  // SubmissionV3: has all address/id fields but NOT contributionAmount or occupation
  type SubmissionV3 = {
    submissionId : Common.SubmissionId;
    submittedAt : Common.Timestamp;
    registration : RegistrationV3;
    curriculum : SubmissionTypes.CurriculumFeedback;
    teaching : SubmissionTypes.TeachingFeedback;
  };

  // RegistrationV4: has all address/id fields + contributionAmount, but NOT occupation
  type RegistrationV4 = {
    name : Text;
    email : Text;
    phone : Text;
    graduationYear : Nat;
    department : Text;
    degreeType : SubmissionTypes.DegreeType;
    currentStatus : SubmissionTypes.CurrentStatus;
    company : ?Text;
    designation : ?Text;
    companyAddress : ?Text;
    college : ?Text;
    program : ?Text;
    collegeAddress : ?Text;
    appointmentOrder : ?Text;
    companyIdCard : ?Text;
    collegeIdCard : ?Text;
  };

  // SubmissionV4: has contributionAmount but no occupation in registration
  type SubmissionV4 = {
    submissionId : Common.SubmissionId;
    submittedAt : Common.Timestamp;
    registration : RegistrationV4;
    curriculum : SubmissionTypes.CurriculumFeedback;
    teaching : SubmissionTypes.TeachingFeedback;
    contributionAmount : ?Nat;
  };

  // ── Stable variable: ORIGINAL schema (no file fields) ───────────────────
  let submissions = Map.empty<Common.SubmissionId, OldSubmission>();
  let nextSubmissionIdVal : Nat = 0;
  let nextSubmissionId = { var val = nextSubmissionIdVal };

  // ── Stable variable: V2 schema (appointmentOrder + companyIdCard only) ───
  let submissionsV2 = Map.empty<Common.SubmissionId, SubmissionV2>();

  // ── Stable variable: V3 schema (all address/id fields, no contributionAmount) ──
  let submissionsV3 = Map.empty<Common.SubmissionId, SubmissionV3>();

  // ── Stable variable: CURRENT schema (V4 — includes contributionAmount but no occupation) ───
  let submissionsV4 = Map.empty<Common.SubmissionId, SubmissionV4>();

  // ── Stable variable: V5 schema (adds occupation to Registration) ───
  let submissionsV5 = Map.empty<Common.SubmissionId, SubmissionTypes.Submission>();

  // IQAC state
  let iqacStore = Map.empty<Common.SubmissionId, List.List<IqacTypes.IqacRow>>();
  let nextIqacRowIdVal : Nat = 0;
  let nextIqacRowId = { var val = nextIqacRowIdVal };

  // Settings state
  let geminiApiKeyVal : Text = "";
  let geminiApiKey = { var val = geminiApiKeyVal };

  // Bank details — old 5-field type for stable compatibility with previous deployment
  type OldBankDetails = {
    accountHolderName : Text;
    accountNumber : Text;
    ifscCode : Text;
    bankName : Text;
    upiId : Text;
  };

  // bankDetailsState: kept with old 5-field type so the stable checker is satisfied
  let bankDetailsState : { var val : ?OldBankDetails } = { var val = null };

  // bankDetailsStateV2: new 6-field type (adds uroPayApiKey) — current schema
  let bankDetailsStateV2 : { var val : ?Common.BankDetails } = { var val = null };

  // Include domain mixins — all submission operations use submissionsV5 (current schema)
  include SubmissionApi(accessControlState, submissionsV5, nextSubmissionId);
  include IqacApi(accessControlState, iqacStore, nextIqacRowId);
  include SettingsApi(accessControlState, geminiApiKey, bankDetailsStateV2);
  include GeminiApi(accessControlState, submissionsV5, geminiApiKey);

  // ── Migration: old schemas → current schema ──────────────────────────────
  // Runs once on upgrade. Copies entries from submissions (V1), submissionsV2,
  // submissionsV3, and submissionsV4 into submissionsV5 (current schema),
  // setting new optional fields (occupation) to null.

  system func postupgrade() {
    // Migrate old bankDetails (5-field) → bankDetailsStateV2 (6-field with uroPayApiKey)
    if (bankDetailsStateV2.val == null) {
      switch (bankDetailsState.val) {
        case null {};
        case (?old) {
          bankDetailsStateV2.val := ?{
            accountHolderName = old.accountHolderName;
            accountNumber = old.accountNumber;
            ifscCode = old.ifscCode;
            bankName = old.bankName;
            upiId = old.upiId;
            uroPayApiKey = "";
          };
        };
      };
    };

    // Migrate V1 → V5
    for ((id, oldSub) in submissions.entries()) {
      if (submissionsV5.get(id) == null) {
        let newReg : SubmissionTypes.Registration = {
          name = oldSub.registration.name;
          email = oldSub.registration.email;
          phone = oldSub.registration.phone;
          graduationYear = oldSub.registration.graduationYear;
          department = oldSub.registration.department;
          degreeType = oldSub.registration.degreeType;
          currentStatus = oldSub.registration.currentStatus;
          company = oldSub.registration.company;
          designation = oldSub.registration.designation;
          companyAddress = null;
          college = oldSub.registration.college;
          program = oldSub.registration.program;
          collegeAddress = null;
          appointmentOrder = null;
          companyIdCard = null;
          collegeIdCard = null;
          occupation = null;
        };
        submissionsV5.add(id, {
          submissionId = oldSub.submissionId;
          submittedAt = oldSub.submittedAt;
          registration = newReg;
          curriculum = oldSub.curriculum;
          teaching = oldSub.teaching;
          contributionAmount = null;
        });
      };
    };
    // Migrate V2 → V5
    for ((id, v2Sub) in submissionsV2.entries()) {
      if (submissionsV5.get(id) == null) {
        let newReg : SubmissionTypes.Registration = {
          name = v2Sub.registration.name;
          email = v2Sub.registration.email;
          phone = v2Sub.registration.phone;
          graduationYear = v2Sub.registration.graduationYear;
          department = v2Sub.registration.department;
          degreeType = v2Sub.registration.degreeType;
          currentStatus = v2Sub.registration.currentStatus;
          company = v2Sub.registration.company;
          designation = v2Sub.registration.designation;
          companyAddress = null;
          college = v2Sub.registration.college;
          program = v2Sub.registration.program;
          collegeAddress = null;
          appointmentOrder = v2Sub.registration.appointmentOrder;
          companyIdCard = v2Sub.registration.companyIdCard;
          collegeIdCard = null;
          occupation = null;
        };
        submissionsV5.add(id, {
          submissionId = v2Sub.submissionId;
          submittedAt = v2Sub.submittedAt;
          registration = newReg;
          curriculum = v2Sub.curriculum;
          teaching = v2Sub.teaching;
          contributionAmount = null;
        });
      };
    };
    // Migrate V3 → V5
    for ((id, v3Sub) in submissionsV3.entries()) {
      if (submissionsV5.get(id) == null) {
        let newReg : SubmissionTypes.Registration = {
          name = v3Sub.registration.name;
          email = v3Sub.registration.email;
          phone = v3Sub.registration.phone;
          graduationYear = v3Sub.registration.graduationYear;
          department = v3Sub.registration.department;
          degreeType = v3Sub.registration.degreeType;
          currentStatus = v3Sub.registration.currentStatus;
          company = v3Sub.registration.company;
          designation = v3Sub.registration.designation;
          companyAddress = v3Sub.registration.companyAddress;
          college = v3Sub.registration.college;
          program = v3Sub.registration.program;
          collegeAddress = v3Sub.registration.collegeAddress;
          appointmentOrder = v3Sub.registration.appointmentOrder;
          companyIdCard = v3Sub.registration.companyIdCard;
          collegeIdCard = v3Sub.registration.collegeIdCard;
          occupation = null;
        };
        submissionsV5.add(id, {
          submissionId = v3Sub.submissionId;
          submittedAt = v3Sub.submittedAt;
          registration = newReg;
          curriculum = v3Sub.curriculum;
          teaching = v3Sub.teaching;
          contributionAmount = null;
        });
      };
    };
    // Migrate V4 → V5 (adds occupation field, defaults to null)
    for ((id, v4Sub) in submissionsV4.entries()) {
      if (submissionsV5.get(id) == null) {
        let newReg : SubmissionTypes.Registration = {
          name = v4Sub.registration.name;
          email = v4Sub.registration.email;
          phone = v4Sub.registration.phone;
          graduationYear = v4Sub.registration.graduationYear;
          department = v4Sub.registration.department;
          degreeType = v4Sub.registration.degreeType;
          currentStatus = v4Sub.registration.currentStatus;
          company = v4Sub.registration.company;
          designation = v4Sub.registration.designation;
          companyAddress = v4Sub.registration.companyAddress;
          college = v4Sub.registration.college;
          program = v4Sub.registration.program;
          collegeAddress = v4Sub.registration.collegeAddress;
          appointmentOrder = v4Sub.registration.appointmentOrder;
          companyIdCard = v4Sub.registration.companyIdCard;
          collegeIdCard = v4Sub.registration.collegeIdCard;
          occupation = null;
        };
        submissionsV5.add(id, {
          submissionId = v4Sub.submissionId;
          submittedAt = v4Sub.submittedAt;
          registration = newReg;
          curriculum = v4Sub.curriculum;
          teaching = v4Sub.teaching;
          contributionAmount = v4Sub.contributionAmount;
        });
      };
    };
  };
};
