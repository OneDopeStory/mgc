# How do usage and length limits work? | Claude Help Center

**Source:** https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work

---

When chatting with Claude, you may encounter two different types of limits that work in distinct ways: usage limits and length limits. Understanding the difference between these can help you use Claude more effectively.

## What are usage limits?
Usage limits control how much you can interact with Claude over a specific time period. Think of this as your "conversation budget" that determines how many messages you can send to Claude, or how long you can work with Claude Code, before needing to wait for your limit to reset.

Your usage is affected by several factors, including the length and complexity of your conversations, the features you use, and which Claude model you're chatting with. Different subscription plans (Pro, Max, Team, etc.) have different usage allowances, with paid plans offering higher limits.

Note that your usage of all different Claude product surfaces (claude.ai, Claude Code, Claude Desktop) counts towards the same usage limit.

## How can I get unlimited usage?
There are a couple of different ways to increase your usage depending on your plan:
- If you’re using a paid plan, including Pro, Max, Team, or seat-based Enterprise plans, see these articles for details about purchasing extra usage: [Extra usage for paid Claude plans](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans), [Extra usage for Team and seat-based Enterprise plans](https://support.claude.com/en/articles/12005970-extra-usage-for-team-and-seat-based-enterprise-plans).
- If your organization has a usage-based Enterprise plan, your usage is based on consumption. See this article for additional information: [How am I billed for my Enterprise plan?](https://support.claude.com/en/articles/11526368-how-am-i-billed-for-my-enterprise-plan).

For strategies to maximize your message allotment, see [Usage limit best practices](https://support.claude.com/en/articles/9797557-usage-limit-best-practices).

## What are length limits?
Length limits relate to Claude's context window—the amount of information Claude can work with in a single chat. Think of the context window as Claude's working memory that determines how much content it can process and remember at once.

Claude's context window size is 200K tokens across all models and paid plans, except for Enterprise plans, which have a 500K context window on some models. For more information, refer to [What is the Enterprise plan?](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan).

## Automatic context management
For users with code execution enabled, Claude now automatically manages long conversations. When your conversation approaches the context window limit, Claude summarizes earlier messages to continue the conversation seamlessly. This means you can have longer, more natural conversations with fewer interruptions.

Your full chat history is preserved so Claude can reference it even after summarization. You may occasionally see that Claude is "organizing its thoughts" during long conversations—this indicates automatic context management is working.

**Note:** [Code execution must be enabled](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude#h_1c99382190) for automatic context management. Rare edge cases (such as very large first messages) may still encounter context limits.

---

### Strategies to maximize context and usage:
- **Utilize projects effectively:** Projects use retrieval-augmented generation (RAG), which allows Claude to work with larger amounts of information more efficiently by only loading relevant content into the context window.
- **Shorten project instructions:** Keep your project instructions concise and focused on essential information.
- **Remove unused project files:** Regularly clean up files you're no longer actively using.
- **Toggle extended thinking off:** Turn off this feature when you don't need Claude's enhanced reasoning.
- **Temporarily disable non-critical tools and connectors:** Disable web search, Research, and MCP connectors from your "Search and tools" settings when they're not needed.

## Summary: Usage vs. Length Limits
- **Usage Limits:** Control how much you can use Claude across all conversations over time (quantity over time).
- **Length Limits:** Control how long any single conversation can become (depth/complexity of individual conversations).

If you hit your usage limit, you'll need to wait for it to reset or purchase extra usage. If you hit a length limit, you can start a new conversation or use projects to work with information more efficiently.

---

# Stitch - Design with AI

**Source:** https://stitch.withgoogle.com/docs

Stitch is an AI-powered design tool that generates UIs for mobile and web applications, making design ideation fast and easy. It integrates directly with development workflows to bridge the gap between design and code.

## Key Capabilities
- **Project Management:** Create and organize UI design projects.
- **AI Screen Generation:** Generate entire screens from simple text prompts.
- **Design Systems:** Define and apply foundational design tokens (colors, typography, shapes) across multiple screens.
- **AI Editing:** Modify existing screens and UI elements using natural language instructions.
- **UI Variants:** Generate multiple creative variations of a base dseign to explore different aesthetic directions.
- **Component-Based:** Focuses on modular design that can be translated into frontend code.

## Integration Highlights
Stitch allows developers and designers to:
- **Rapidly Prototype:** Go from an idea to a visual UI in minutes.
- **Maintain Consistency:** Use Design Systems to ensure branding is uniform across all generated screens.
- **Iterate Fast:** Use the "Edit" and "Variants" features to tweak designs without manual pixel-pushing.

