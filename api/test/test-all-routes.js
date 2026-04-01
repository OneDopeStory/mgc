/**
 * MGC Global Consulting — Webhook Test Suite
 * Run: node test/test-all-routes.js
 * Tests all 10 automation endpoints
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

const tests = [
  {
    name: "1. Contact Form — AI Consulting",
    endpoint: "/webhook/contact-form",
    body: {
      name: "Sarah Johnson",
      email: "sarah@techstartup.com",
      phone: "410-555-0123",
      company: "TechStartup Inc",
      service: "AI Consulting & Strategy",
      goal: "Automate our operations and reduce manual work by 50%",
      message: "We have a 20-person team struggling with disconnected tools and manual reporting. Looking for someone to build us an AI-powered ops layer."
    }
  },
  {
    name: "2. Membership Signup — Pro Tier",
    endpoint: "/webhook/membership-signup",
    body: {
      name: "David Williams",
      email: "david@consultingfirm.com",
      phone: "443-555-0199",
      company: "Williams Consulting Group",
      tier: "Pro",
      amount: "97"
    }
  },
  {
    name: "3. Calendly Booking",
    endpoint: "/webhook/calendly-booking",
    body: {
      name: "Maria Rodriguez",
      email: "maria@healthcare.org",
      start_time: new Date(Date.now() + 86400000).toISOString(),
      event_type: "30-Minute Strategy Call",
      questions_and_answers: [
        { question: "What's your main challenge?", answer: "Manual patient intake taking 3 days" },
        { question: "Company size?", answer: "45 employees, 200 patients/month" }
      ]
    }
  },
  {
    name: "4. Referral Submission",
    endpoint: "/webhook/referral",
    body: {
      referrerName: "James Carter",
      referrerEmail: "james@partner.com",
      referredName: "Lisa Thompson",
      referredEmail: "lisa@nonprofit.org",
      referredCompany: "Baltimore Community Foundation",
      notes: "Lisa runs operations for a 50-person nonprofit and desperately needs automation help",
      type: "referral"
    }
  },
  {
    name: "5. Stale Lead Check",
    endpoint: "/webhook/stale-lead-check",
    body: {
      staleLeads: [
        {
          id: "notion-123",
          name: "Robert Kim",
          email: "robert@realestate.com",
          service: "CRM & Pipeline Optimization",
          daysSince: 3,
          originalMessage: "Interested in CRM optimization for our 15-agent real estate team"
        }
      ]
    }
  },
  {
    name: "6. Invoice Alert",
    endpoint: "/webhook/invoice-alert",
    body: {
      clientName: "Anthony Harris — Recycle-4-Life",
      invoiceNumber: "#01-02-042026",
      amount: "7802.25",
      dueDate: "02/10/2026",
      services: "AI Automation Backend Integrations, Production Pipeline Generation, Initial Assessment, Documentation Filing",
      status: "Due",
      emailBody: "Following up on invoice for services rendered in February 2026"
    }
  },
  {
    name: "7. True Assist Intake",
    endpoint: "/webhook/true-assist-intake",
    body: {
      clientName: "Dr. Patricia Moore",
      clientEmail: "pmoore@homecare.com",
      phone: "410-555-0177",
      company: "Moore Home Care LLC",
      intakeType: "True Assist System",
      details: "Need complete intake automation for our 120 patient home care operation. Currently doing everything on paper and Excel.",
      urgency: "High"
    }
  },
  {
    name: "8. Daily Morning Briefing",
    endpoint: "/webhook/daily-briefing",
    body: {
      newLeads: [
        { name: "Sarah Johnson", service: "AI Consulting", status: "New" },
        { name: "David Williams", service: "Pro Membership", status: "Paid" }
      ],
      pendingFollowUps: [
        { name: "Robert Kim", daysSince: 3, service: "CRM Optimization" }
      ],
      openInvoices: [
        { client: "Recycle-4-Life", amount: 7802.25, daysOverdue: 0 }
      ],
      calendarEvents: [
        { time: "10:00 AM", name: "Maria Rodriguez", type: "Strategy Call" }
      ]
    }
  },
  {
    name: "9. Workshop Inquiry",
    endpoint: "/webhook/workshop-inquiry",
    body: {
      name: "Kevin Adams",
      email: "kadams@bank.com",
      company: "First National Community Bank",
      industry: "Financial Services",
      teamSize: "35",
      format: "Team AI Bootcamp",
      goals: "Upskill our loan officers and branch managers on AI tools for customer service and document processing"
    }
  },
  {
    name: "10. Weekly Summary",
    endpoint: "/webhook/weekly-summary",
    body: {
      weekData: {
        newLeads: 8,
        callsBooked: 4,
        proposalsSent: 2,
        newMembers: 1,
        revenueCollected: 7802.25,
        openPipeline: 24500,
        topService: "AI Consulting & Strategy"
      }
    }
  }
];

async function runTests() {
  console.log("\n🚀 MGC Global Consulting — Webhook Test Suite");
  console.log("=".repeat(60));
  console.log(`Testing against: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    try {
      const res = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(test.body)
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ ${res.status} — ${JSON.stringify(data)}`);
        passed++;
      } else {
        console.log(`❌ ${res.status} — ${await res.text()}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ERROR — ${err.message}`);
      failed++;
    }

    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log("\nMGC Global Consulting — www.mgcglobalconsulting.com");
}

runTests().catch(console.error);
