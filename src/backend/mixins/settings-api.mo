import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import SettingsLib "../lib/settings";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  geminiApiKey : { var val : Text },
  bankDetails : { var val : ?Common.BankDetails },
) {
  /// Get Gemini API key (admin only)
  public query ({ caller }) func getGeminiApiKey() : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view the Gemini API key");
    };
    SettingsLib.getGeminiApiKey(geminiApiKey);
  };

  /// Set Gemini API key (admin only)
  public shared ({ caller }) func setGeminiApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the Gemini API key");
    };
    SettingsLib.setGeminiApiKey(geminiApiKey, key);
  };

  /// Get bank details (public — shown in payment modal to alumni)
  public query func getBankDetails() : async ?Common.BankDetails {
    SettingsLib.getBankDetails(bankDetails);
  };

  /// Set bank details — open to any caller (admin session is client-side only)
  public shared func setBankDetails(details : Common.BankDetails) : async () {
    SettingsLib.setBankDetails(bankDetails, details);
  };
};
