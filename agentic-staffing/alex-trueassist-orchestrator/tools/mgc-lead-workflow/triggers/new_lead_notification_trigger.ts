import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import NewLeadNotificationWorkflow from "../workflows/new_lead_notification_workflow.ts";

const newLeadNotificationTrigger: Trigger<
  typeof NewLeadNotificationWorkflow.definition
> = {
  type: TriggerTypes.Webhook,
  name: "New lead notification",
  description:
    "External trigger called by netlify/functions/lead-intake.js when a lead is saved",
  workflow: `#/workflows/${NewLeadNotificationWorkflow.definition.callback_id}`,
  inputs: {
    channel: {
      value: "{{data.channel}}",
    },
    lead_name: {
      value: "{{data.lead_name}}",
    },
    lead_email: {
      value: "{{data.lead_email}}",
    },
    lead_company: {
      value: "{{data.lead_company}}",
    },
    lead_service: {
      value: "{{data.lead_service}}",
    },
    lead_message: {
      value: "{{data.lead_message}}",
    },
    lead_source: {
      value: "{{data.lead_source}}",
    },
  },
};

export default newLeadNotificationTrigger;
