import { Manifest } from "deno-slack-sdk/mod.ts";
import NewLeadNotificationWorkflow from "./workflows/new_lead_notification_workflow.ts";
import ClientOnboardingWorkflow from "./workflows/client_onboarding_workflow.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "mgc-lead-workflow",
  description:
    "Alex's workflow-as-code layer: posts new MGC leads and client onboardings to the right staff channel",
  icon: "assets/default_new_app_icon.png",
  workflows: [NewLeadNotificationWorkflow, ClientOnboardingWorkflow],
  outgoingDomains: [],
  botScopes: [
    "chat:write",
    "chat:write.public",
  ],
});
