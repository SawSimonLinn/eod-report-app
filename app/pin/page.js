import { Suspense } from 'react';
import PinForm from '../../components/PinForm';

export const metadata = {
  title: 'Enter PIN · Wraply.lol',
  description: 'Enter your PIN to access the Wraply.lol tool.',
};

export default function PinPage() {
  return (
    <Suspense fallback={null}>
      <PinForm />
    </Suspense>
  );
}
