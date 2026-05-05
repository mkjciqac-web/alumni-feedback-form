import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types/iqac";
import Common "../types/common";

module {
  public func saveIqacRows(
    iqacStore : Map.Map<Common.SubmissionId, List.List<Types.IqacRow>>,
    nextRowId : { var val : Nat },
    submissionId : Common.SubmissionId,
    rows : [Types.IqacRowInput],
  ) : () {
    let newRows = List.empty<Types.IqacRow>();
    for (input in rows.values()) {
      let rowId = nextRowId.val;
      nextRowId.val += 1;
      newRows.add({
        rowId;
        submissionId;
        weaknessText = input.weaknessText;
        actionTaken = input.actionTaken;
        matchingFeedbackExcerpts = input.matchingFeedbackExcerpts;
      });
    };
    iqacStore.add(submissionId, newRows);
  };

  public func getIqacRows(
    iqacStore : Map.Map<Common.SubmissionId, List.List<Types.IqacRow>>,
    submissionId : Common.SubmissionId,
  ) : [Types.IqacRow] {
    switch (iqacStore.get(submissionId)) {
      case (?rows) rows.toArray();
      case null [];
    };
  };

  public func updateActionTaken(
    iqacStore : Map.Map<Common.SubmissionId, List.List<Types.IqacRow>>,
    input : Types.UpdateActionTakenInput,
  ) : () {
    switch (iqacStore.get(input.submissionId)) {
      case (?rows) {
        rows.mapInPlace(func(row) {
          if (row.rowId == input.rowId) {
            { row with actionTaken = input.actionTaken };
          } else {
            row;
          };
        });
      };
      case null {};
    };
  };
};
