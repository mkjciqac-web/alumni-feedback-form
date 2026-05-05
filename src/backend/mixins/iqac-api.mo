import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import IqacLib "../lib/iqac";
import IqacTypes "../types/iqac";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  iqacStore : Map.Map<Common.SubmissionId, List.List<IqacTypes.IqacRow>>,
  nextIqacRowId : { var val : Nat },
) {
  /// Save (replace) all IQAC rows for a submission (admin only)
  public shared ({ caller }) func saveIqacRows(
    submissionId : Common.SubmissionId,
    rows : [IqacTypes.IqacRowInput],
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can save IQAC rows");
    };
    IqacLib.saveIqacRows(iqacStore, nextIqacRowId, submissionId, rows);
  };

  /// Get all IQAC rows for a submission (admin only)
  public query ({ caller }) func getIqacRows(submissionId : Common.SubmissionId) : async [IqacTypes.IqacRow] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view IQAC rows");
    };
    IqacLib.getIqacRows(iqacStore, submissionId);
  };

  /// Update the actionTaken field of a single IQAC row (admin only)
  public shared ({ caller }) func updateActionTaken(input : IqacTypes.UpdateActionTakenInput) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update action taken");
    };
    IqacLib.updateActionTaken(iqacStore, input);
  };
};
