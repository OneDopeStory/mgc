"use strict";

// netlify/functions/request-invoice.js
var CORS = {
  "Access-Control-Allow-Origin": "https://www.mgcglobalconsulting.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
async function refreshQBToken() {
  const creds = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(process.env.QB_REFRESH_TOKEN)}`
  });
  const data = await res.json();
  return data.access_token;
}
async function notifySlack(body) {
  const webhook = process.env.SLACK_PAYMENTS_WEBHOOK;
  if (!webhook)
    return;
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: "*\u{1F4CB} New Invoice Request*" } },
        { type: "section", fields: [
          { type: "mrkdwn", text: `*Service:*
${body.service}` },
          { type: "mrkdwn", text: `*Amount:*
$${Number(body.amount).toLocaleString()}` },
          { type: "mrkdwn", text: `*Name:*
${body.customer_name}` },
          { type: "mrkdwn", text: `*Email:*
${body.customer_email}` },
          { type: "mrkdwn", text: `*Company:*
${body.company || "\u2014"}` },
          { type: "mrkdwn", text: `*Note:*
${body.note || "\u2014"}` }
        ] },
        { type: "context", elements: [{ type: "mrkdwn", text: `Received ${(/* @__PURE__ */ new Date()).toUTCString()}` }] }
      ]
    })
  });
}
async function createQBInvoice(token, body) {
  const BASE = `https://${process.env.QB_ENVIRONMENT === "sandbox" ? "sandbox-" : ""}quickbooks.api.intuit.com/v3/company/${process.env.QB_REALM_ID}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Content-Type": "application/json"
  };
  const safeEmail = (body.customer_email || "").replace(/'/g, "\\'");
  const qRes = await fetch(
    `${BASE}/query?query=SELECT * FROM Customer WHERE PrimaryEmailAddr='${safeEmail}'&minorversion=65`,
    { headers }
  );
  const qData = await qRes.json();
  let customerId = qData.QueryResponse?.Customer?.[0]?.Id;
  if (!customerId) {
    const cRes = await fetch(`${BASE}/customer?minorversion=65`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        DisplayName: body.company ? `${body.customer_name} (${body.company})` : body.customer_name,
        PrimaryEmailAddr: { Address: body.customer_email }
      })
    });
    const cData = await cRes.json();
    customerId = cData.Customer?.Id;
  }
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
  const invRes = await fetch(`${BASE}/invoice?minorversion=65`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      CustomerRef: { value: customerId },
      DocNumber: `MGC-${Date.now()}`,
      DueDate: dueDate,
      AllowOnlineCreditCardPayment: true,
      AllowOnlineACHPayment: true,
      Line: [{
        Amount: body.amount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: { value: "1", name: "Services" },
          Qty: 1,
          UnitPrice: body.amount
        },
        Description: body.service
      }],
      CustomerMemo: {
        value: `Thank you for choosing MGC Global Consulting. This invoice covers: ${body.service}. Payment accepted via Credit Card or ACH. Questions? mark@mgcglobalconsulting.com`
      }
    })
  });
  const invData = await invRes.json();
  const invoiceId = invData.Invoice?.Id;
  if (invoiceId) {
    await fetch(
      `${BASE}/invoice/${invoiceId}/send?sendTo=${encodeURIComponent(body.customer_email)}&minorversion=65`,
      { method: "POST", headers: { ...headers, "Content-Type": "application/octet-stream" } }
    ).catch(console.error);
  }
  return invoiceId;
}
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: CORS, body: "Method not allowed" };
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }
  const { service, amount, customer_name, customer_email } = body;
  if (!service || !amount || !customer_name || !customer_email) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing required fields" }) };
  }
  const results = await Promise.allSettled([
    notifySlack(body),
    (async () => {
      if (!process.env.QB_CLIENT_ID)
        return null;
      const token = await refreshQBToken();
      return createQBInvoice(token, body);
    })()
  ]);
  const invoiceId = results[1].status === "fulfilled" ? results[1].value : null;
  console.log("[request-invoice] service=%s amount=%s invoiceId=%s", service, amount, invoiceId);
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ received: true, invoice_id: invoiceId })
  };
};
//# sourceMappingURL=request-invoice.js.map
