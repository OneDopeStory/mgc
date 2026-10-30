import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

const NewLeadNotificationWorkflow = DefineWorkflow({
  callback_id: "new_lead_notification",
  title: "New lead notification",
  description:
    "Posts an incoming MGC lead to the right staff channel as soon as lead-intake.js saves it",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      lead_name: {
        type: Schema.types.string,
      },
      lead_email: {
        type: Schema.types.string,
      },
      lead_company: {
        type: Schema.types.string,
      },
      lead_service: {
        type: Schema.types.string,
      },
      lead_message: {
        type: Schema.types.string,
      },
      lead_source: {
        type: Schema.types.string,
      },
    },
    required: ["channel", "lead_name", "lead_email"],
  },
});

NewLeadNotificationWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: NewLeadNotificationWorkflow.inputs.channel,
  message:
    `:dart: *New lead* — ${NewLeadNotificationWorkflow.inputs.lead_name}\n` +
    `*Email:* ${NewLeadNotificationWorkflow.inputs.lead_email}\n` +
    `*Company:* ${NewLeadNotificationWorkflow.inputs.lead_company}\n` +
    `*Service:* ${NewLeadNotificationWorkflow.inputs.lead_service}\n` +
    `*Source:* ${NewLeadNotificationWorkflow.inputs.lead_source}\n` +
    `*Message:* ${NewLeadNotificationWorkflow.inputs.lead_message}`,
});

export default NewLeadNotificationWorkflow;
