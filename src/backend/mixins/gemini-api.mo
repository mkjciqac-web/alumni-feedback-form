import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/submission";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  submissions : Map.Map<Common.SubmissionId, Types.Submission>,
  geminiApiKey : { var val : Text },
) {
  /// Transform callback required by the IC for HTTP outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

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

  func buildPrompt(sub : Types.Submission) : Text {
    let r = sub.registration;
    let c = sub.curriculum;
    let t = sub.teaching;
    "You are an academic quality analyst. Analyze the following alumni feedback and return a JSON object with this exact structure:\n" #
    "{\n" #
    "  \"strengths\": [\"...\"],\n" #
    "  \"weaknesses\": [\"...\"],\n" #
    "  \"improvements\": [\"...\"],\n" #
    "  \"iqacRows\": [\n" #
    "    {\n" #
    "      \"weaknessText\": \"...\",\n" #
    "      \"actionTaken\": \"\",\n" #
    "      \"matchingFeedbackExcerpts\": [\"...\"]\n" #
    "    }\n" #
    "  ]\n" #
    "}\n\n" #
    "Return ONLY the JSON object, no markdown fences, no extra text.\n\n" #
    "Alumni Feedback Data:\n" #
    "Name: " # r.name # "\n" #
    "Department: " # r.department # "\n" #
    "Graduation Year: " # r.graduationYear.toText() # "\n\n" #
    "=== CURRICULUM FEEDBACK ===\n" #
    "Q1 (Relevance of curriculum to industry): " # likertCurriculumToText(c.q1) # "\n" #
    "Q2 (Syllabus coverage and depth): " # likertCurriculumToText(c.q2) # "\n" #
    "Q3 (Practical/lab components): " # likertCurriculumToText(c.q3) # "\n" #
    "Q4 (Project/internship opportunities): " # likertCurriculumToText(c.q4) # "\n" #
    "Q5 (Elective/specialization options): " # likertCurriculumToText(c.q5) # "\n" #
    "Q6 (Value-added courses): " # likertCurriculumToText(c.q6) # "\n" #
    "Q7 (Industry exposure): " # likertCurriculumToText(c.q7) # "\n" #
    "Q8 (Overall curriculum satisfaction): " # likertCurriculumToText(c.q8) # "\n" #
    "Suggestions: " # c.suggestions # "\n\n" #
    "=== TEACHING & LEARNING FEEDBACK ===\n" #
    "Q1 (Teachers explained concepts clearly and effectively): " # likertTeachingToText(t.q1) # "\n" #
    "Q2 (Teaching methods improved learning): " # likertTeachingToText(t.q2) # "\n" #
    "Q3 (Teachers were approachable and supportive): " # likertTeachingToText(t.q3) # "\n" #
    "Q4 (Classroom interaction and participation encouraged): " # likertTeachingToText(t.q4) # "\n" #
    "Q5 (Assessment methods were fair and transparent): " # likertTeachingToText(t.q5) # "\n" #
    "Q6 (Practical/lab sessions were useful and well-organized): " # likertTeachingToText(t.q6) # "\n" #
    "Q7 (Library resources were adequate): " # likertTeachingToText(t.q7) # "\n" #
    "Q8 (ICT facilities supported learning): " # likertTeachingToText(t.q8) # "\n" #
    "Q9 (Sports/extracurricular activities useful for holistic development): " # likertTeachingToText(t.q9) # "\n" #
    "Q10 (Administrative support was timely and efficient): " # likertTeachingToText(t.q10) # "\n" #
    "Additional Facilities/Support Needed: " # t.additionalFacilities # "\n" #
    "Additional Comments: " # t.additionalComments # "\n";
  };

  func buildRequestBody(prompt : Text) : Text {
    let escapedPrompt = prompt.replace(#text "\"", "\\\"").replace(#text "\n", "\\n");
    "{\"contents\":[{\"parts\":[{\"text\":\"" # escapedPrompt # "\"}]}]}";
  };

  /// Extract the inner text value from a Gemini API response envelope.
  /// Finds "\"text\":" and extracts the string value between the subsequent quotes.
  /// Uses Text.toArray() for indexed char access (no deprecated Array.fromIter).
  func extractGeminiText(responseBody : Text) : Text {
    let marker = "\"text\":";
    let bodyArr : [Char] = responseBody.toArray();
    let markerArr : [Char] = marker.toArray();
    let bodyLen = bodyArr.size();
    let markerLen = markerArr.size();
    // Search for marker in body
    var markerStart : ?Nat = null;
    var i = 0;
    label search while (i + markerLen <= bodyLen) {
      var matched = true;
      var j = 0;
      while (j < markerLen) {
        if (bodyArr[i + j] != markerArr[j]) {
          matched := false;
        };
        j += 1;
      };
      if (matched) {
        markerStart := ?i;
        break search;
      };
      i += 1;
    };
    let afterMarker = switch (markerStart) {
      case null { return responseBody }; // fallback: return raw body
      case (?pos) { pos + markerLen };
    };
    // Skip whitespace after "text":
    var pos = afterMarker;
    while (pos < bodyLen and (bodyArr[pos] == ' ' or bodyArr[pos] == '\n' or bodyArr[pos] == '\t')) {
      pos += 1;
    };
    // Expect opening quote
    if (pos >= bodyLen or bodyArr[pos] != '\"') {
      return responseBody; // fallback
    };
    pos += 1; // skip opening quote
    // Collect characters until closing unescaped quote
    var result = "";
    var escaped = false;
    label collect while (pos < bodyLen) {
      let ch = bodyArr[pos];
      if (escaped) {
        // Handle escape sequences — convert \n back to real newline, \" to quote
        if (ch == 'n') {
          result #= "\n";
        } else if (ch == '\"') {
          result #= "\"";
        } else if (ch == '\\') {
          result #= "\\";
        } else {
          result #= "\\" # ch.toText();
        };
        escaped := false;
      } else if (ch == '\\') {
        escaped := true;
      } else if (ch == '\"') {
        break collect; // end of string
      } else {
        result #= ch.toText();
      };
      pos += 1;
    };
    result;
  };

  /// Call Gemini API for a submission, return structured analysis JSON as text (admin only)
  public shared ({ caller }) func analyzeSubmission(submissionId : Common.SubmissionId) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can analyze submissions");
    };
    let sub = switch (submissions.get(submissionId)) {
      case (?s) s;
      case null Runtime.trap("Submission not found");
    };
    let apiKey = geminiApiKey.val;
    if (apiKey == "") {
      Runtime.trap("Gemini API key not configured");
    };
    let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" # apiKey;
    let prompt = buildPrompt(sub);
    let body = buildRequestBody(prompt);
    let headers : [OutCall.Header] = [
      { name = "Content-Type"; value = "application/json" },
    ];
    let rawResponse = await OutCall.httpPostRequest(url, headers, body, transform);
    extractGeminiText(rawResponse);
  };
};
