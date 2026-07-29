import Link from 'next/link';
import AppShell from '../components/AppShell';
import ScrollReveal from '../components/ScrollReveal';
import HeroIntro from '../components/HeroIntro';
import { BoltIcon, ShuffleIcon, ReceiptIcon, LockIcon } from '../components/icons';

const FEATURES = [
  {
    icon: BoltIcon,
    title: 'Done in seconds',
    description: 'Jot down a few quick notes and get a ready-to-paste report instantly — no typing the same update by hand every night.',
  },
  {
    icon: ShuffleIcon,
    title: 'Never sounds copy-pasted',
    description: 'Pick short or long, and each report is written in a slightly different voice so every store’s update reads naturally.',
  },
  {
    icon: ReceiptIcon,
    title: 'Gas expenses too',
    description: 'Same idea for reimbursements — describe the trip, add receipts, and get a clean expense report to submit.',
  },
  {
    icon: LockIcon,
    title: 'Stays on your device',
    description: 'Recent reports are saved locally so you can find and copy them again. Nothing is sent anywhere else.',
  },
];

const STEPS = [
  {
    title: 'Type a few notes',
    description: 'Issues, equipment, conditions, clock-out time — leave anything blank if there is nothing to say.',
  },
  {
    title: 'Pick short or long',
    description: 'Choose the length that fits your group chat, and how much detail you want to include.',
  },
  {
    title: 'Copy and send',
    description: 'Your report is generated in a natural voice, ready to paste — no editing needed.',
  },
];

const STATS = [
  { value: '<30s', label: 'To generate a full report' },
  { value: '10+', label: 'Locations one team can run' },
  { value: '2', label: 'Report lengths — short or long' },
  { value: '0', label: 'Reports sent to a server' },
];

const USE_CASES = [
  {
    tag: 'Store Manager',
    title: 'Skip the nightly retype',
    description: 'Jot down what happened on shift and get a report ready for the group chat before you clock out.',
  },
  {
    tag: 'District Manager',
    title: 'Consistent updates, every store',
    description: 'Every location reports in the same format, so scanning ten updates takes as long as scanning one.',
  },
  {
    tag: 'New Hire',
    title: 'Never guess what to include',
    description: 'The prompts walk you through what to cover, so first-week reports read like a veteran wrote them.',
  },
];

const FAQS = [
  {
    question: 'Is my data stored anywhere?',
    answer:
      'Recent reports are saved locally in your browser so you can find and copy them again later. Nothing is sent to or stored on a server.',
  },
  {
    question: 'Does it work for expense reports too?',
    answer:
      'Yes — describe a trip and add receipts, and it generates a clean gas expense report the same way it generates EOD reports.',
  },
  {
    question: 'Can I edit the report after it generates?',
    answer: 'Yes, the output is plain text in a normal field — copy it as-is or tweak anything before pasting it in.',
  },
  {
    question: 'Is this free to use?',
    answer: 'Yes, it’s free. Just type your notes and generate as many reports as you need.',
  },
];

export default function HomePage() {
  return (
    <AppShell wide>
      <HeroIntro />

      <div className="feature-grid">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <ScrollReveal as="div" className="feature-card" delay={i * 60} key={title}>
            <div className="f-icon">
              <Icon />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </ScrollReveal>
        ))}
      </div>

      <div className="stats-band">
        {STATS.map(({ value, label }, i) => (
          <ScrollReveal as="div" className="stat-card" delay={i * 50} key={label}>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal as="h2" className="section-heading">
        How it works
      </ScrollReveal>
      <div className="steps-grid">
        {STEPS.map(({ title, description }, i) => (
          <ScrollReveal as="div" className="step-card" delay={i * 80} key={title}>
            <div className="step-number">{i + 1}</div>
            <h3>{title}</h3>
            <p>{description}</p>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal as="h2" className="section-heading">
        Built for every role on the floor
      </ScrollReveal>
      <div className="usecase-grid">
        {USE_CASES.map(({ tag, title, description }, i) => (
          <ScrollReveal as="div" className="usecase-card" delay={i * 70} key={title}>
            <span className="uc-tag">{tag}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal as="h2" className="section-heading">
        Questions people ask
      </ScrollReveal>
      <div className="faq-list">
        {FAQS.map(({ question, answer }, i) => (
          <ScrollReveal as="details" className="faq-item" delay={i * 50} key={question}>
            <summary>
              {question}
              <span className="faq-plus" aria-hidden="true"></span>
            </summary>
            <p>{answer}</p>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal as="div" className="cta-band">
        <div>
          <h2>Ready to stop typing the same update by hand?</h2>
          <p>It takes less time to generate a report than it does to type one from scratch.</p>
        </div>
        <Link href="/generate" className="btn-lg primary">
          Generate a report
        </Link>
      </ScrollReveal>
    </AppShell>
  );
}
