'use strict';
/**
 * Notion Integration
 * ──────────────────
 * Finds the client record in the Notion Clients database
 * by email (or name fallback), updates their Status to "Paid",
 * and logs the payment details in a rich page comment.
 */

const { Client } = require('@notionhq/client');
const log        = require('./logger');

function getClient() {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

const STATUS_PROP  = process.env.NOTION_STATUS_PROPERTY  || 'Status';
const EMAIL_PROP   = process.env.NOTION_EMAIL_PROPERTY   || 'Email';
const PAID_VALUE   = process.env.NOTION_PAID_STATUS_VALUE || 'Paid';
const DB_ID        = process.env.NOTION_CLIENTS_DATABASE_ID;

/**
 * Query the Clients database for a matching record.
 */
async function findClientPage(notion, email, name) {
  // Try email match first
  if (email) {
    const res = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: EMAIL_PROP,
        email: { equals: email },
      },
    });
    if (res.results.length > 0) return res.results[0];
  }

  // Fall back to name match (contains)
  if (name) {
    const res = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Name',
        title: { contains: name },
      },
    });
    if (res.results.length > 0) return res.results[0];
  }

  return null;
}

/**
 * Update a Notion page's Status property to "Paid" and
 * append a payment summary block to the page body.
 */
async function markClientPaid(event) {
  const notion = getClient();
  const page   = await findClientPage(notion, event.customerEmail, event.customerName);

  if (!page) {
    log.warn('Notion', `No client record found for ${event.customerEmail ?? event.customerName}`);
    return { found: false };
  }

  const pageId  = page.id;
  const amount  = `$${Number(event.amount).toFixed(2)}`;
  const inv     = event.invoiceNum ?? event.invoiceId ?? 'N/A';
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Update Status property
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [STATUS_PROP]: {
        select: { name: PAID_VALUE },
      },
      // Optional: set a "Last Payment Date" if that property exists
      ...(event.date ? {
        'Last Payment Date': {
          date: { start: event.date },
        },
      } : {}),
    },
  });

  // Append a payment detail block to the page
  await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: { content: `💰 Payment Received — ${dateStr}` },
              annotations: { bold: true },
            },
          ],
          icon: { emoji: '✅' },
          color: 'green_background',
        },
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: `Amount: ${amount} ${event.currency}` } }],
        },
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: `Invoice: ${inv}` } }],
        },
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: `QB Payment ID: ${event.paymentId}` } }],
        },
      },
      ...(event.memo ? [{
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: `Memo: ${event.memo}` } }],
        },
      }] : []),
      { type: 'divider', divider: {} },
    ],
  });

  log.info('Notion', `Client "${event.customerName}" marked Paid`, { pageId });
  return { found: true, pageId };
}

module.exports = { markClientPaid };
