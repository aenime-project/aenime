import { useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileGate({ siteKey, children }) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedVerification = localStorage.getItem('turnstileVerified');
    const cachedTime = localStorage.getItem('turnstileVerifiedTime');
    
    if (cachedVerification === 'true' && cachedTime) {
      const verificationAge = Date.now() - parseInt(cachedTime);
      if (verificationAge < 30 * 60 * 1000) {
        setVerified(true);
      } else {
        localStorage.removeItem('turnstileVerified');
        localStorage.removeItem('turnstileVerifiedTime');
      }
    }
    
    setLoading(false);
  }, []);

  const handleSuccess = (token) => {
    console.log("✅ Turnstile verified:", token);
    setVerified(true);
    localStorage.setItem('turnstileVerified', 'true');
    localStorage.setItem('turnstileVerifiedTime', Date.now().toString());
    localStorage.setItem('turnstileToken', token);
  };

  const handleError = () => {
    console.log("❌ Turnstile failed");
    localStorage.removeItem('turnstileVerified');
    localStorage.removeItem('turnstileVerifiedTime');
    localStorage.removeItem('turnstileToken');
  };

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#252434",
          zIndex: 9999,
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {!verified && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#252434",
            zIndex: 9999,
          }}
        >
          <Turnstile
            siteKey={siteKey}
            onSuccess={handleSuccess}
            onError={handleError}
            onExpire={() => {
              console.log("🔄 Turnstile expired");
              handleError();
            }}
          />
        </div>
      )}
      {verified && children}
    </>
  );
}
