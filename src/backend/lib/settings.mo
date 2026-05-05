import Common "../types/common";

module {
  public func getGeminiApiKey(geminiApiKey : { var val : Text }) : Text {
    geminiApiKey.val;
  };

  public func setGeminiApiKey(geminiApiKey : { var val : Text }, key : Text) : () {
    geminiApiKey.val := key;
  };

  public func getBankDetails(bankDetails : { var val : ?Common.BankDetails }) : ?Common.BankDetails {
    bankDetails.val;
  };

  public func setBankDetails(bankDetails : { var val : ?Common.BankDetails }, details : Common.BankDetails) : () {
    bankDetails.val := ?details;
  };
};
