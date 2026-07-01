const CBU_LOGO = 'https://www.cbu.ac.zm/opus/assets/images/correct%20logo.png';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center text-center ${className}`}>
      <img
        src={CBU_LOGO}
        alt="Copperbelt University logo"
        className="img-fluid rounded-circle shadow-sm mb-3 login-logo mx-auto d-block"
        style={{ width: 90, height: 90, objectFit: 'contain', backgroundColor: 'white', padding: 8 }}
      />
      <h2 className="text-white fw-bold mb-1">Copperbelt University</h2>
      <p className="text-white-75 mb-0">Central Stores Management System</p>
      <p className="text-white-50 small">Secure access for campus inventory requests and approvals</p>
    </div>
  );
}