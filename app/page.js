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
