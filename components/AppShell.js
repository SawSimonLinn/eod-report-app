import Header from './Header';
import Footer from './Footer';

export default function AppShell({ children, wide }) {
  return (
    <>
      <Header />
      <main className={`wrap${wide ? ' wide' : ''}`}>{children}</main>
      <Footer />
    </>
  );
}
