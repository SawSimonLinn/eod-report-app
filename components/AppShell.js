import Header from './Header';
import Footer from './Footer';

export default function AppShell({ children }) {
  return (
    <>
      <Header />
      <main className="wrap">{children}</main>
      <Footer />
    </>
  );
}
