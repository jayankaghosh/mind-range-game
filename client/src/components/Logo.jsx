export default function Logo({ size = 'md' }) {
  const imgSize = size === 'lg' ? 88 : size === 'sm' ? 32 : 48;
  const titleSize = size === 'lg' ? '2.6rem' : size === 'sm' ? '1.1rem' : '1.6rem';

  return (
    <div style={{
      display: 'flex',
      flexDirection: size === 'sm' ? 'row' : 'column',
      alignItems: 'center',
      gap: size === 'sm' ? 10 : 10,
    }}>
      <img src="/logo.svg" alt="Mind Range logo" width={imgSize} height={imgSize} />
      <div className="logo-title" style={{ fontSize: titleSize }}> Mind Range</div>
    </div>
  );
}
