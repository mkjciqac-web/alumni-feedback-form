import Map "mo:core/Map";
import List "mo:core/List";
import SubmissionLib "../lib/submission";
import Types "../types/submission";
import Common "../types/common";
import AccessControl "mo:caffeineai-authorization/access-control";

mixin (
  accessControlState : AccessControl.AccessControlState,
  submissions : Map.Map<Common.SubmissionId, Types.Submission>,
  nextSubmissionId : { var val : Nat },
) {
  /// Submit a new alumni feedback form (public, no auth required)
  public shared func submitForm(input : Types.SubmitFormInput) : async Common.SubmissionId {
    SubmissionLib.submitForm(submissions, nextSubmissionId, input);
  };

  /// List all submission summaries (open — admin auth is handled client-side)
  public query func listSubmissions() : async [Types.SubmissionSummary] {
    SubmissionLib.listSubmissions(submissions);
  };

  /// Get a single full submission by ID (open — admin auth is handled client-side)
  public query func getSubmission(id : Common.SubmissionId) : async ?Types.Submission {
    SubmissionLib.getSubmission(submissions, id);
  };

  /// Export all submissions as a CSV string (open — admin auth is handled client-side)
  public query func exportCsv() : async Text {
    SubmissionLib.exportCsv(submissions);
  };
};
