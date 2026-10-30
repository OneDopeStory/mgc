import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import ClientOnboardingWorkflow from "../workflows/client_onboarding_workflow.ts";

const clientOnboardingTrigger: Trigger<
  typeof ClientOnboardingWorkflow.definition
> = {
  type: TriggerTypes.Webhook,
  name: "Client onboarding",
  description:
    "External trigger called by netlify/functions/new-client-signup.js when a new client profile is saved",
  workflow: `#/workflows/${ClientOnboardingWorkflow.definition.callback_id}`,
  inputs: {
    channel: {
      value: "{{data.channel}}",
    },
    client_name: {
      value: "{{data.client_name}}",
    },
    client_email: {
      value: "{{data.client_email}}",
    },
    client_company: {
      value: "{{data.client_company}}",
    },
    client_phone: {
      value: "{{data.client_phone}}",
    },
    membership_tier: {
      value: "{{data.membership_tier}}",
    },
    onboarding_status: {
      value: "{{data.onboarding_status}}",
    },
  },
};

export default clientOnboardingTrigger;
