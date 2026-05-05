import Common "common";

module {
  public type IqacRow = {
    rowId : Common.IqacRowId;
    submissionId : Common.SubmissionId;
    weaknessText : Text;
    actionTaken : Text;
    matchingFeedbackExcerpts : [Text];
  };

  public type IqacRowInput = {
    weaknessText : Text;
    actionTaken : Text;
    matchingFeedbackExcerpts : [Text];
  };

  public type UpdateActionTakenInput = {
    submissionId : Common.SubmissionId;
    rowId : Common.IqacRowId;
    actionTaken : Text;
  };
};
