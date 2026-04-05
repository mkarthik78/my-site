/* ═══════════════════════════════════════════════════════════════
   Prime Pensions Inc. — main.js
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Nav: scroll state ──────────────────────────────────────── */
const nav = document.getElementById('nav');

function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ── Nav: mobile toggle ─────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    document.body.style.overflow = '';
    navToggle.setAttribute('aria-expanded', false);
  });
});

// Close menu on outside click
document.addEventListener('click', e => {
  if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ── Smooth scroll for anchor links ────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = 74; // nav height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Scroll reveal ──────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

// Apply reveal classes to elements
function initReveal() {
  const selectors = [
    '.why__card',
    '.service-card',
    '.testimonial-card',
    '.about__content p',
    '.section-intro',
    '.contact__info',
    '.contact__form-wrap',
    '.cta-banner__text',
    '.cta-banner__actions',
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      // Stagger siblings
      if (i < 4) el.classList.add(`reveal--delay-${i + 1}`);
    });
  });

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });
}

initReveal();

/* ── Contact form ───────────────────────────────────────────── */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', e => {
  e.preventDefault();

  // Basic validation
  const required = form.querySelectorAll('[required]');
  let valid = true;

  required.forEach(field => {
    field.style.borderColor = '';
    if (!field.value.trim()) {
      field.style.borderColor = '#e05252';
      valid = false;
    }
  });

  if (!valid) {
    const firstInvalid = form.querySelector('[required]:placeholder-shown, [required][value=""]');
    (firstInvalid || form.querySelector('[required]')).focus();
    return;
  }

  // Simulate submission
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending…';
  submitBtn.disabled = true;

  setTimeout(() => {
    form.style.display = 'none';
    formSuccess.classList.add('visible');

    // Smooth scroll to success message
    const offset = 74;
    const top = formSuccess.getBoundingClientRect().top + window.scrollY - offset - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 900);
});

// Remove error state on input
form.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('input', () => {
    field.style.borderColor = '';
  });
});

/* ── Active nav link highlighting ───────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav__link:not(.nav__link--cta)');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinkEls.forEach(link => {
          link.classList.toggle(
            'nav__link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  { threshold: 0.35 }
);

sections.forEach(section => sectionObserver.observe(section));

/* ══════════════════════════════════════════════════════════════
   DUAL CHAT WIDGETS
══════════════════════════════════════════════════════════════ */

const chatLaunchers  = document.getElementById('chatLaunchers');
const launchQA       = document.getElementById('launchQA');
const launchProposal = document.getElementById('launchProposal');

// ── Q&A Widget ────────────────────────────────────────────────
const chatWidget   = document.getElementById('chatWidget');
const chatClose    = document.getElementById('chatClose');
const chatPanel    = document.getElementById('chatPanel');
const chatMessages = document.getElementById('chatMessages');
const chatTyping   = document.getElementById('chatTyping');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');

let chatBusy = false;

function openQA() {
  chatLaunchers.classList.add('hidden');
  chatWidget.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  setTimeout(() => chatInput.focus(), 260);
}

function closeQA() {
  chatWidget.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  chatLaunchers.classList.remove('hidden');
}

launchQA.addEventListener('click', openQA);
chatClose.addEventListener('click', closeQA);

function appendMessage(role, text) {
  const row = document.createElement('div');
  row.className = `chat-msg chat-msg--${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg__bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping()  { chatTyping.classList.add('visible'); }
function hideTyping()  { chatTyping.classList.remove('visible'); }

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || chatBusy) return;

  chatBusy = true;
  chatSend.disabled = true;
  chatInput.value = '';
  chatInput.disabled = true;

  appendMessage('user', text);
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    hideTyping();
    appendMessage('assistant', data.reply);
  } catch (err) {
    hideTyping();
    appendMessage('assistant', "I'm having a little trouble connecting right now. Please reach out through the contact form below — we will get back to you within one business day.");
    console.error('Chat error:', err);
  } finally {
    chatBusy = false;
    chatSend.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ── Proposal Widget ───────────────────────────────────────────
const proposalWidget   = document.getElementById('proposalWidget');
const proposalClose    = document.getElementById('proposalClose');
const proposalPanel    = document.getElementById('proposalPanel');
const proposalMessages = document.getElementById('proposalMessages');
const proposalTyping   = document.getElementById('proposalTyping');
const proposalInput    = document.getElementById('proposalInput');
const proposalSend     = document.getElementById('proposalSend');
const proposalFill     = document.getElementById('proposalFill');
const proposalLabel    = document.getElementById('proposalLabel');

let proposalBusy     = false;
let proposalHistory  = []; // [{role, content}] — full conversation so far
let proposalStarted  = false;
let proposalComplete = false;

const PROPOSAL_OPENING = "Thanks for reaching out — let's put together something tailored to your situation. To get started: what does your company do? I'm curious about the industry, size, and where you are in your journey.";

function openProposal() {
  chatLaunchers.classList.add('hidden');
  proposalWidget.classList.add('open');
  proposalPanel.setAttribute('aria-hidden', 'false');
  if (!proposalStarted) {
    proposalStarted = true;
    // Show opening message directly — no API call needed
    appendProposalMessage('assistant', PROPOSAL_OPENING);
    proposalHistory.push({ role: 'assistant', content: PROPOSAL_OPENING });
    updateProgress(1);
    setTimeout(() => proposalInput.focus(), 260);
  } else {
    if (!proposalComplete) setTimeout(() => proposalInput.focus(), 260);
  }
}

function closeProposal() {
  proposalWidget.classList.remove('open');
  proposalPanel.setAttribute('aria-hidden', 'true');
  chatLaunchers.classList.remove('hidden');
}

launchProposal.addEventListener('click', openProposal);
proposalClose.addEventListener('click', closeProposal);

function updateProgress(step) {
  proposalFill.style.width = `${Math.round((step / 6) * 100)}%`;
  proposalLabel.textContent = `Step ${step} of 6`;
}

function appendProposalMessage(role, text) {
  const row = document.createElement('div');
  row.className = `chat-msg chat-msg--${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg__bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  proposalMessages.appendChild(row);
  proposalMessages.scrollTop = proposalMessages.scrollHeight;
}

function showProposalTyping() { proposalTyping.classList.add('visible'); }
function hideProposalTyping() { proposalTyping.classList.remove('visible'); }

async function sendProposalMessage(text) {
  if (!text || proposalBusy || proposalComplete) return;

  proposalBusy = true;
  proposalSend.disabled = true;
  proposalInput.disabled = true;

  appendProposalMessage('user', text);

  // History to send = all turns completed before this message
  const historyToSend = [...proposalHistory];
  proposalHistory.push({ role: 'user', content: text });

  showProposalTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: historyToSend, mode: 'intake' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    hideProposalTyping();

    appendProposalMessage('assistant', data.reply);
    proposalHistory.push({ role: 'assistant', content: data.reply });

    if (data.intake_step) {
      updateProgress(data.intake_step);
    }

    if (data.intake_complete) {
      proposalComplete = true;
      proposalInput.placeholder = 'Proposal request submitted.';
      // Fire and forget — stub logs intake data
      fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: proposalHistory,
          intakeData: data.intake_data,
        }),
      }).catch(err => console.error('generate-proposal error:', err));
    } else {
      setTimeout(() => proposalInput.focus(), 100);
    }
  } catch (err) {
    hideProposalTyping();
    appendProposalMessage('assistant', "I'm having a little trouble right now — please close and try again in a moment.");
    proposalHistory.push({ role: 'assistant', content: "I'm having a little trouble right now — please close and try again in a moment." });
    console.error('Proposal chat error:', err);
  } finally {
    proposalBusy = false;
    if (!proposalComplete) {
      proposalSend.disabled = false;
      proposalInput.disabled = false;
    }
  }
}

function handleProposalSend() {
  const text = proposalInput.value.trim();
  if (!text) return;
  proposalInput.value = '';
  sendProposalMessage(text);
}

proposalSend.addEventListener('click', handleProposalSend);
proposalInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleProposalSend(); }
});

// ── Close both on Escape ──────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (chatWidget.classList.contains('open'))     closeQA();
    if (proposalWidget.classList.contains('open')) closeProposal();
  }
});
