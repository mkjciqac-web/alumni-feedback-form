import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/submission";
import Common "../types/common";

module {
  func likertCurriculumToText(l : Types.LikertCurriculum) : Text {
    switch (l) {
      case (#Excellent) "Excellent";
      case (#VeryGood) "Very Good";
      case (#Good) "Good";
      case (#Satisfactory) "Satisfactory";
      case (#Unsatisfactory) "Unsatisfactory";
    };
  };

  func likertTeachingToText(l : Types.LikertTeaching) : Text {
    switch (l) {
      case (#excellent) "Excellent";
      case (#veryGood) "Very Good";
      case (#good) "Good";
      case (#satisfactory) "Satisfactory";
      case (#unSatisfactory) "Un Satisfactory";
    };
  };

  func degreeTypeToText(d : Types.DegreeType) : Text {
    switch (d) {
      case (#UG) "UG";
      case (#PG) "PG";
      case (#MPhil) "M.Phil";
    };
  };

  func currentStatusToText(s : Types.CurrentStatus) : Text {
    switch (s) {
      case (#Working) "Working";
      case (#Studying) "Studying";
      case (#Other) "Other";
    };
  };

  func optText(v : ?Text) : Text {
    switch (v) {
      case (?t) t;
      case null "";
    };
  };

  func escapeCsv(field : Text) : Text {
    // If field contains comma, quote, or newline, wrap in quotes and escape inner quotes
    if (field.contains(#char ',') or field.contains(#text "\"") or field.contains(#text "\n")) {
      "\"" # field.replace(#text "\"", "\"\"") # "\"";
    } else {
      field;
    };
  };

  public func submitForm(
    submissions : Map.Map<Common.SubmissionId, Types.Submission>,
    nextId : { var val : Nat },
    input : Types.SubmitFormInput,
  ) : Common.SubmissionId {
    let id = nextId.val;
    nextId.val += 1;
    let submission : Types.Submission = {
      submissionId = id;
      submittedAt = Time.now();
      registration = input.registration;
      curriculum = input.curriculum;
      teaching = input.teaching;
      contributionAmount = input.contributionAmount;
    };
    submissions.add(id, submission);
    id;
  };

  public func listSubmissions(
    submissions : Map.Map<Common.SubmissionId, Types.Submission>
  ) : [Types.SubmissionSummary] {
    let results = List.empty<Types.SubmissionSummary>();
    for ((_, sub) in submissions.entries()) {
      results.add({
        submissionId = sub.submissionId;
        submittedAt = sub.submittedAt;
        name = sub.registration.name;
        email = sub.registration.email;
        department = sub.registration.department;
        degreeType = sub.registration.degreeType;
        graduationYear = sub.registration.graduationYear;
      });
    };
    results.toArray();
  };

  public func getSubmission(
    submissions : Map.Map<Common.SubmissionId, Types.Submission>,
    id : Common.SubmissionId,
  ) : ?Types.Submission {
    submissions.get(id);
  };

  public func exportCsv(
    submissions : Map.Map<Common.SubmissionId, Types.Submission>
  ) : Text {
    let header = "SubmissionID,Name,Email,Phone,GraduationYear,Department,DegreeType,CurrentStatus,Company,Designation,Company Address,College,Program,College Address,Appointment Order,Company ID Card,College ID Card,CurriculumQ1,CurriculumQ2,CurriculumQ3,CurriculumQ4,CurriculumQ5,CurriculumQ6,CurriculumQ7,CurriculumQ8,Suggestions,Teaching Q1,Teaching Q2,Teaching Q3,Teaching Q4,Teaching Q5,Teaching Q6,Teaching Q7,Teaching Q8,Teaching Q9,Teaching Q10,Additional Facilities,Additional Comments,SubmittedAt";
    let rows = List.empty<Text>();
    rows.add(header);
    for ((_, sub) in submissions.entries()) {
      let r = sub.registration;
      let c = sub.curriculum;
      let t = sub.teaching;
      let row = escapeCsv(sub.submissionId.toText()) # "," #
        escapeCsv(r.name) # "," #
        escapeCsv(r.email) # "," #
        escapeCsv(r.phone) # "," #
        escapeCsv(r.graduationYear.toText()) # "," #
        escapeCsv(r.department) # "," #
        escapeCsv(degreeTypeToText(r.degreeType)) # "," #
        escapeCsv(currentStatusToText(r.currentStatus)) # "," #
        escapeCsv(optText(r.company)) # "," #
        escapeCsv(optText(r.designation)) # "," #
        escapeCsv(optText(r.companyAddress)) # "," #
        escapeCsv(optText(r.college)) # "," #
        escapeCsv(optText(r.program)) # "," #
        escapeCsv(optText(r.collegeAddress)) # "," #
        escapeCsv(optText(r.appointmentOrder)) # "," #
        escapeCsv(optText(r.companyIdCard)) # "," #
        escapeCsv(optText(r.collegeIdCard)) # "," #
        escapeCsv(likertCurriculumToText(c.q1)) # "," #
        escapeCsv(likertCurriculumToText(c.q2)) # "," #
        escapeCsv(likertCurriculumToText(c.q3)) # "," #
        escapeCsv(likertCurriculumToText(c.q4)) # "," #
        escapeCsv(likertCurriculumToText(c.q5)) # "," #
        escapeCsv(likertCurriculumToText(c.q6)) # "," #
        escapeCsv(likertCurriculumToText(c.q7)) # "," #
        escapeCsv(likertCurriculumToText(c.q8)) # "," #
        escapeCsv(c.suggestions) # "," #
        escapeCsv(likertTeachingToText(t.q1)) # "," #
        escapeCsv(likertTeachingToText(t.q2)) # "," #
        escapeCsv(likertTeachingToText(t.q3)) # "," #
        escapeCsv(likertTeachingToText(t.q4)) # "," #
        escapeCsv(likertTeachingToText(t.q5)) # "," #
        escapeCsv(likertTeachingToText(t.q6)) # "," #
        escapeCsv(likertTeachingToText(t.q7)) # "," #
        escapeCsv(likertTeachingToText(t.q8)) # "," #
        escapeCsv(likertTeachingToText(t.q9)) # "," #
        escapeCsv(likertTeachingToText(t.q10)) # "," #
        escapeCsv(t.additionalFacilities) # "," #
        escapeCsv(t.additionalComments) # "," #
        escapeCsv(sub.submittedAt.toText());
      rows.add(row);
    };
    rows.values().foldLeft("", func(acc : Text, line : Text) : Text {
      if (acc == "") line else acc # "\n" # line
    });
  };
};
