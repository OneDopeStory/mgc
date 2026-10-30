import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

const ClientOnboardingWorkflow = DefineWorkflow({
  callback_id: "client_onboarding",
  title: "Client onboarding",
  description:
    "Posts a new client signup to the onboarding channel, prefilled from Supabase, as soon as new-client-signup.js saves the profile",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      client_name: {
        type: Schema.types.string,
      },
      client_email: {
        type: Schema.types.string,
      },
      client_company: {
        type: Schema.types.string,
      },
      client_phone: {
        type: Schema.types.string,
      },
      membership_tier: {
        type: Schema.types.string,
      },
      onboarding_status: {
        type: Schema.types.string,
      },
    },
    required: ["channel", "client_name", "client_email"],
  },
});

ClientOnboardingWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: ClientOnboardingWorkflow.inputs.channel,
  message:
    `:wave: *New client onboarding* — ${ClientOnboardingWorkflow.inputs.client_name}\n` +
    `*Email:* ${ClientOnboardingWorkflow.inputs.client_email}\n` +
    `*Company:* ${ClientOnboardingWorkflow.inputs.client_company}\n` +
    `*Phone:* ${ClientOnboardingWorkflow.inputs.client_phone}\n` +
    `*Membership tier:* ${ClientOnboardingWorkflow.inputs.membership_tier}\n` +
    `*Status:* ${ClientOnboardingWorkflow.inputs.onboarding_status}\n` +
    `:point_right: Reply in this thread to add kickoff notes, assign an owner, or flag missing info.`,
});

export default ClientOnboardingWorkflow;
