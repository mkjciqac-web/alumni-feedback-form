import Common "common";

module {
  public type LikertCurriculum = {
    #Excellent;
    #VeryGood;
    #Good;
    #Satisfactory;
    #Unsatisfactory;
  };

  public type LikertTeaching = {
    #excellent;
    #veryGood;
    #good;
    #satisfactory;
    #unSatisfactory;
  };

  public type CurrentStatus = {
    #Working;
    #Studying;
    #Other;
  };

  public type DegreeType = {
    #UG;
    #PG;
    #MPhil;
  };

  public type Registration = {
    name : Text;
    email : Text;
    phone : Text;
    graduationYear : Nat;
    department : Text;
    degreeType : DegreeType;
    currentStatus : CurrentStatus;
    company : ?Text;
    designation : ?Text;
    companyAddress : ?Text;
    college : ?Text;
    program : ?Text;
    collegeAddress : ?Text;
    // File references (DataURL) for working-status alumni
    appointmentOrder : ?Text;
    companyIdCard : ?Text;
    // File reference (DataURL) for studying-status alumni
    collegeIdCard : ?Text;
    // Occupation text for alumni with Other status
    occupation : ?Text;
  };

  public type CurriculumFeedback = {
    q1 : LikertCurriculum;
    q2 : LikertCurriculum;
    q3 : LikertCurriculum;
    q4 : LikertCurriculum;
    q5 : LikertCurriculum;
    q6 : LikertCurriculum;
    q7 : LikertCurriculum;
    q8 : LikertCurriculum;
    suggestions : Text;
  };

  public type TeachingFeedback = {
    q1 : LikertTeaching;
    q2 : LikertTeaching;
    q3 : LikertTeaching;
    q4 : LikertTeaching;
    q5 : LikertTeaching;
    q6 : LikertTeaching;
    q7 : LikertTeaching;
    q8 : LikertTeaching;
    q9 : LikertTeaching;
    q10 : LikertTeaching;
    additionalFacilities : Text;
    additionalComments : Text;
  };

  public type Submission = {
    submissionId : Common.SubmissionId;
    submittedAt : Common.Timestamp;
    registration : Registration;
    curriculum : CurriculumFeedback;
    teaching : TeachingFeedback;
    contributionAmount : ?Nat;
  };

  public type SubmissionSummary = {
    submissionId : Common.SubmissionId;
    submittedAt : Common.Timestamp;
    name : Text;
    email : Text;
    department : Text;
    degreeType : DegreeType;
    graduationYear : Nat;
  };

  public type SubmitFormInput = {
    registration : Registration;
    curriculum : CurriculumFeedback;
    teaching : TeachingFeedback;
    contributionAmount : ?Nat;
  };
};
