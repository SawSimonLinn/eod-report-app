import BrandMark from '../components/BrandMark';

export default function Loading() {
  return (
    <div className="page-loading">
      <BrandMark />
      <div className="page-loading-spinner" />
    </div>
  );
}
