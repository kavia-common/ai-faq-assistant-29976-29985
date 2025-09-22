import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Role of a message in the simulated chat.
 */
type Role = 'user' | 'assistant';

/**
 * Shared properties for a processing step in the RAG/MCP trace.
 */
interface StepBase {
  title: string;
  description: string;
  type: 'rag' | 'mcp';
  expanded: boolean;
}

/**
 * RAG-style processing step details.
 */
interface RAGStep extends StepBase {
  type: 'rag';
  details: {
    documents: Array<{ title: string; score: number; snippet: string }>;
    context: string;
  };
}

/**
 * MCP-style processing step details.
 */
interface MCPStep extends StepBase {
  type: 'mcp';
  details: {
    tools: Array<{ name: string; purpose: string }>;
    reasoning: string;
  };
}

type Step = RAGStep | MCPStep;

/**
 * Chat message type for the conversation timeline.
 */
interface Message {
  role: Role;
  content: string;
  meta?: { type: 'rag' | 'mcp'; summary: string };
}

/**
 * Sidebar category type.
 */
interface Category {
  name: string;
  icon: string;
  count: number;
}

/**
 * Static FAQ item type.
 */
interface FAQItem {
  q: string;
  a: string;
  category: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  /** Ocean Professional themed static AI FAQ Assistant */

  title = 'AI FAQ Assistant';
  draft = '';

  /**
   * When non-empty, FAQ list is filtered by this search term (case-insensitive, partial match)
   * across question and answer. When empty, category-only filtering applies.
   */
  searchQuery: string = '';

  categories: Category[] = [
    { name: 'Getting Started', icon: '🚀', count: 4 },
    { name: 'Pricing', icon: '💳', count: 3 },
    { name: 'Troubleshooting', icon: '🛠️', count: 4 },
    { name: 'Security', icon: '🔒', count: 3 },
  ];
  activeCategoryIndex = 0;

  initialMessages: Message[] = [
    { role: 'user', content: 'How does this FAQ assistant find accurate answers?' },
    {
      role: 'assistant',
      meta: { type: 'rag', summary: 'Retrieve relevant docs and answer with context' },
      content:
        'I simulate a RAG pipeline: first I retrieve the most relevant FAQ snippets, then I compose an answer grounded in that context. You can expand the Processing Trace to see the steps.',
    },
    {
      role: 'assistant',
      meta: { type: 'mcp', summary: 'Plan, use tools, verify' },
      content:
        'For multi-step queries, I also simulate MCP: I plan the steps, select appropriate tools (like policy lookup), and verify the final response for consistency.',
    },
  ];

  messages: Message[] = [...this.initialMessages];

  steps: Step[] = this.makeInitialSteps();

  /**
   * Create the initial set of RAG/MCP steps for the Processing Trace.
   * Kept private since it is an internal factory.
   */
  private makeInitialSteps(): Step[] {
    return [
      {
        title: 'Retrieve Top Matches',
        description: 'Vector-like retrieval over curated FAQ embeddings',
        type: 'rag',
        expanded: true,
        details: {
          documents: [
            {
              title: 'What is RAG?',
              score: 0.92,
              snippet:
                'Retrieval-Augmented Generation (RAG) retrieves relevant chunks from a knowledge base and uses them to ground the response.',
            },
            {
              title: 'How are answers verified?',
              score: 0.84,
              snippet:
                'Answers are compared against retrieved sources to ensure consistency and reduce hallucinations.',
            },
          ],
          context:
            'Q: How does the assistant find accurate answers?\nA: Use retrieval to gather relevant context from FAQs and then synthesize a grounded response.',
        },
      },
      {
        title: 'Compose Grounded Draft',
        description: 'Synthesize an answer using retrieved context',
        type: 'rag',
        expanded: false,
        details: {
          documents: [],
          context:
            'Draft: This assistant uses simulated retrieval to locate relevant FAQs and constructs a concise, grounded answer.',
        },
      },
      {
        title: 'Plan Multi-step Tools',
        description: 'Identify tools and sub-steps for complex queries',
        type: 'mcp',
        expanded: false,
        details: {
          tools: [
            { name: 'PolicyLookup', purpose: 'Check data retention policy' },
            { name: 'PricingTable', purpose: 'Compare plan features' },
          ],
          reasoning:
            'If the user asks about compliance and pricing together, plan to fetch policy details first, then cross-check pricing constraints.',
        },
      },
    ];
  }

  // PUBLIC_INTERFACE
  /**
   * Reset the simulated conversation, steps, and any active search filter.
   * This is a public method invoked by the header Reset button.
   */
  resetConversation(): void {
    this.messages = [...this.initialMessages];
    this.steps = this.makeInitialSteps();
    this.draft = '';
    this.searchQuery = '';
  }

  // PUBLIC_INTERFACE
  /**
   * Select a category for FAQ filtering.
   * If a search is active, the search continues to apply across all categories.
   * @param index The index of the category in the categories array.
   */
  selectCategory(index: number): void {
    this.activeCategoryIndex = index;
    // Category change does not clear search; search overrides category if present.
  }

  // PUBLIC_INTERFACE
  /**
   * Toggle step expansion in the processing trace.
   * @param idx The index of the step to expand/collapse.
   */
  toggleStep(idx: number): void {
    this.steps[idx].expanded = !this.steps[idx].expanded;
  }

  // PUBLIC_INTERFACE
  /**
   * Sends a draft message and applies FAQ search filtering logic.
   * - If the draft is empty and Send is clicked: reset search filter (category-only).
   * - If the draft has text and Send is clicked: apply search filter by that term.
   * Always appends the message to the simulated chat timeline.
   */
  sendDraft(): void {
    const text = (this.draft || '').trim();

    // Apply filtering behavior based on text presence
    if (text) {
      // Activate search override with the current draft text
      this.searchQuery = text;
    } else {
      // Reset search if user clicks Send with empty input
      this.searchQuery = '';
    }

    // Append to the simulated conversation timeline
    if (text) {
      this.messages = [
        ...this.messages,
        { role: 'user', content: text },
        {
          role: 'assistant',
          meta: { type: 'rag', summary: 'Retrieved context applied' },
          content:
            'Here is a simulated answer based on retrieved FAQs. For example, if you asked about pricing, I would cite plan differences and link to the billing policy. (Static demo)',
        },
      ];
    } else {
      // Provide a subtle assistant nudge indicating filters cleared
      this.messages = [
        ...this.messages,
        {
          role: 'assistant',
          meta: { type: 'mcp', summary: 'Filters reset' },
          content:
            'Search cleared. Showing FAQs by the selected category again. You can type a keyword and click Send to filter.',
        },
      ];
    }

    // Clear input field after Send
    this.draft = '';
  }

  faqs: FAQItem[] = [
    // Getting Started
    {
      q: 'What is an AI-powered FAQ Assistant?',
      a: 'A guided interface that answers common questions. In this static demo, responses are pre-scripted to simulate Retrieval-Augmented Generation and multi-step reasoning.',
      category: 'Getting Started',
    },
    {
      q: 'How do I use this demo?',
      a: 'Type a question in the chat input or browse the FAQ categories. Expand the Processing Trace to view the simulated RAG and MCP steps.',
      category: 'Getting Started',
    },
    {
      q: 'Does this require a backend?',
      a: 'No. This demo is 100% static. All content and interactions are simulated in the frontend.',
      category: 'Getting Started',
    },
    {
      q: 'What technologies were used?',
      a: 'Angular 19, modern CSS, and a custom Ocean Professional theme (blue with amber accents).',
      category: 'Getting Started',
    },

    // Pricing
    {
      q: 'What pricing plans are available?',
      a: 'Starter, Pro, and Enterprise (simulated). Each tier increases limits and support. This demo provides no live billing.',
      category: 'Pricing',
    },
    {
      q: 'Can I switch plans later?',
      a: 'Yes, upgrades or downgrades are supported in the simulation. In a real app, this would trigger billing APIs.',
      category: 'Pricing',
    },
    {
      q: 'Do you offer refunds?',
      a: 'Refunds follow a 14-day policy (simulated). For production, please integrate a billing provider’s policies.',
      category: 'Pricing',
    },

    // Troubleshooting
    {
      q: 'The chatbot is not responding.',
      a: 'In this static demo, replies are instant and pre-scripted. If you see nothing, try pressing Reset.',
      category: 'Troubleshooting',
    },
    {
      q: 'Where do I report bugs?',
      a: 'Use the Reset button or refresh the page; this project is for educational purposes and not connected to issue tracking.',
      category: 'Troubleshooting',
    },
    {
      q: 'How do I clear the conversation?',
      a: 'Click the Reset button in the header. It restores the initial messages and steps.',
      category: 'Troubleshooting',
    },
    {
      q: 'Why are steps pre-expanded?',
      a: 'To highlight RAG retrieval first. You can collapse or expand any step to explore.',
      category: 'Troubleshooting',
    },

    // Security
    {
      q: 'How is my data handled?',
      a: 'This is a static demo; no data is sent to servers. In production, secure transmission and storage policies are essential.',
      category: 'Security',
    },
    {
      q: 'Do you comply with GDPR?',
      a: 'Compliance is out of scope for this demo. In production, add proper DPA, consent flows, and data retention tooling.',
      category: 'Security',
    },
    {
      q: 'Is there authentication?',
      a: 'No authentication in this static demo. Real deployments should integrate auth providers and role policies.',
      category: 'Security',
    },
  ].map((x) => ({ ...x, expanded: false }));

  // PUBLIC_INTERFACE
  /**
   * Return FAQs filtered either by active search (if set) or by current category.
   * Search is case-insensitive and matches partial substrings in question or answer.
   */
  filteredFaqs(): FAQItem[] {
    const query = (this.searchQuery || '').trim().toLowerCase();

    if (query) {
      return this.faqs.filter((f) => {
        const q = f.q.toLowerCase();
        const a = f.a.toLowerCase();
        return q.includes(query) || a.includes(query);
      });
    }

    const cat = this.categories[this.activeCategoryIndex]?.name;
    return this.faqs.filter((f) => f.category === cat);
  }

  // PUBLIC_INTERFACE
  /**
   * Toggle an FAQ item open/closed for the filtered list.
   * @param i Index in the filtered list view.
   */
  toggleFaq(i: number): void {
    const current = this.filteredFaqs()[i];
    if (!current) return;
    current.expanded = !current.expanded;
  }

  /**
   * Example of chips shown near the chat header.
   */
  flowChips(): string[] {
    return ['RAG', 'MCP', 'Step-by-step'];
  }
}
