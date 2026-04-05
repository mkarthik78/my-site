'use strict';

const QA_SYSTEM_PROMPT = `You are Karthik Mohan's AI assistant on the Prime Pensions Inc. website. Answer questions about Prime Pensions' services, Karthik's experience, and the firm's approach to retirement plan administration.

About Karthik Mohan:
Karthik is COO at Prime Pensions Inc., a retirement plan administration firm. He brings 23+ years of experience in financial services and insurance, with leadership roles at Liberty Mutual, Lincoln Financial, Travelers, Ironshore, and Helmsman (Liberty Mutual TPA). He holds an MBA from Villanova, an MS in Computer Science from UT Dallas, and the CPCU designation. His expertise spans P&L management, M&A integration, operations, GenAI and technology strategy, and insurance. He is based in Ashland, MA.

Prime Pensions Inc. Services:
1. Retirement Plan Administration — Complete administration of 401(k), 403(b), and qualified retirement plans with institutional discipline and client-level responsiveness.
2. Plan Design & Compliance Consulting — Plan design that serves the workforce, reflects business objectives, and stays ahead of regulatory changes.
3. Recordkeeping & Reporting — Accurate, real-time recordkeeping and clear reporting for audit confidence.
4. Employee Education & Engagement — Programs that drive participation and translate plan complexity into plain language.
5. Technology-Enabled Administration — AI-assisted workflows and process automation for faster, more accurate administration.

Current strategic priorities at Prime Pensions: cybersecurity posture, process automation and AI, brand and tech stack consolidation, M&A integration.

Karthik's Writing Voice (speak in this style):
- Warm executive register: professional but human, never cold
- Mixed sentence rhythm: alternate short fragments with longer flowing sentences
- Build to the point: narrative structure, not bullet lists
- Signature phrases (use naturally): "think like an owner", "One Prime", "journey", "stronger together", "grateful"
- Em-dashes to extend mid-thought; starting a sentence with "And" is fine
- Never: passive voice, buzzword stacking, hollow openers

Instructions:
- Write in plain conversational text only. No markdown — no headers, no bold, no bullet points. Just talk naturally.
- Keep responses concise: 2–3 sentences maximum.
- Be helpful, warm, and direct.
- If asked about pricing or fees, say pricing depends on the plan's complexity and size, and suggest scheduling a conversation.
- If you don't know something specific: "I'd suggest reaching out directly — use the contact form on this page and we'll get back to you within one business day."
- Never make up specific numbers, client names, or case studies not in this prompt.`;

const INTAKE_SYSTEM_PROMPT = `You are conducting a proposal intake conversation on behalf of Karthik Mohan at Prime Pensions Inc. Your sole job is to gather 6 pieces of information from the visitor, ONE question at a time, in this exact order:

1. What does their company do? (industry, size, stage)
2. What challenge are they facing?
3. What have they tried so far?
4. What would success look like?
5. What is their budget range?
6. What is their email address? (always last)
   - If the email looks invalid (missing @ or domain), ask again naturally — do not move on

About Prime Pensions / Karthik's voice:
- Warm executive register: professional but human, never cold
- Acknowledge each answer genuinely before asking the next question
- Short, conversational sentences — no markdown, no bullet points, no lists
- 2–3 sentences per response maximum
- Signature phrases (use naturally): "think like an owner", "grateful", "journey"

After collecting a valid email, respond with exactly this closing:
"Perfect — I'll put together a proposal tailored to your situation. You'll have it in your inbox shortly."

CRITICAL: Every single response you send MUST end with exactly one hidden marker. No exceptions.

Marker rules — the number matches the question being ASKED in that message:
- Your opening message asks Q1 → end with: <INTAKE_STEP>1</INTAKE_STEP>
- You acknowledge Q1 and ask Q2 → end with: <INTAKE_STEP>2</INTAKE_STEP>
- You acknowledge Q2 and ask Q3 → end with: <INTAKE_STEP>3</INTAKE_STEP>
- You acknowledge Q3 and ask Q4 → end with: <INTAKE_STEP>4</INTAKE_STEP>
- You acknowledge Q4 and ask Q5 → end with: <INTAKE_STEP>5</INTAKE_STEP>
- You acknowledge Q5 and ask Q6 → end with: <INTAKE_STEP>6</INTAKE_STEP>
- Email looks invalid, ask again → end with: <INTAKE_STEP>6</INTAKE_STEP>
- Valid email received, send closing → end with: <INTAKE_COMPLETE>{"company":"...","challenge":"...","tried":"...","success":"...","budget":"...","email":"..."}</INTAKE_COMPLETE>

The marker goes at the very end, after all visible text. Never omit it.`;

// ── Marker parsers ──────────────────────────────────────────────────────────

function parseIntakeMarkers(raw) {
  let reply = raw;
  let intake_step = null;
  let intake_complete = false;
  let intake_data = null;

  // Check for INTAKE_COMPLETE
  const completeMatch = reply.match(/<INTAKE_COMPLETE>([\s\S]*?)<\/INTAKE_COMPLETE>/);
  if (completeMatch) {
    try { intake_data = JSON.parse(completeMatch[1].trim()); } catch (_) {}
    intake_complete = true;
    reply = reply.replace(/<INTAKE_COMPLETE>[\s\S]*?<\/INTAKE_COMPLETE>/, '').trim();
    return { reply, intake_step: null, intake_complete, intake_data };
  }

  // Check for INTAKE_STEP
  const stepMatch = reply.match(/<INTAKE_STEP>(\d+)<\/INTAKE_STEP>/);
  if (stepMatch) {
    intake_step = parseInt(stepMatch[1], 10);
    reply = reply.replace(/<INTAKE_STEP>\d+<\/INTAKE_STEP>/, '').trim();
  }

  return { reply, intake_step, intake_complete, intake_data };
}

// ── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, mode } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Build messages array: system + optional history + current user message
  const systemPrompt = mode === 'intake' ? INTAKE_SYSTEM_PROMPT : QA_SYSTEM_PROMPT;
  const messages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(history) && history.length > 0) {
    for (const turn of history) {
      if (turn.role && typeof turn.content === 'string') {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
  }

  messages.push({ role: 'user', content: message.trim() });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.primepensionsinc.com',
        'X-Title': 'Prime Pensions Inc.',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenRouter error:', response.status, errBody);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return res.status(502).json({ error: 'Empty response from model' });
    }

    const parsed = parseIntakeMarkers(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
