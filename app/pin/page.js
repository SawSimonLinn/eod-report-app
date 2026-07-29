import { Suspense } from 'react';
import PinForm from '../../components/PinForm';

export const metadata = {
  title: 'Enter PIN · End of Day Report',
  description: 'Enter your PIN to access the End of Day Report tool.',
};

export default function PinPage() {
  return (
    <Suspense fallback={null}>
      <PinForm />
    </Suspense>
  );
}
