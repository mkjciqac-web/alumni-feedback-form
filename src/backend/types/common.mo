module {
  public type SubmissionId = Nat;
  public type Timestamp = Int;
  public type IqacRowId = Nat;

  public type BankDetails = {
    accountHolderName : Text;
    accountNumber : Text;
    ifscCode : Text;
    bankName : Text;
    upiId : Text;
    uroPayApiKey : Text;
  };
};
