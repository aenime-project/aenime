import { useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileGate({ siteKey, children }) {
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local") ||
      window.location.hostname === "");

  const [verified, setVerified] = useState(isLocalhost || Boolean(import.meta.env?.DEV));
  const [loading, setLoading] = useState(!isLocalhost && !import.meta.env?.DEV);

  useEffect(() => {
    // Automatically bypass on local development / localhost
    if (isLocalhost || import.meta.env?.DEV) {
      setVerified(true);
      setLoading(false);
      return;
    }

    const cachedVerification = localStorage.getItem("turnstileVerified");
    const cachedTime = localStorage.getItem("turnstileVerifiedTime");

    if (cachedVerification === "true" && cachedTime) {
      const verificationAge = Date.now() - parseInt(cachedTime, 10);
      if (verificationAge < 30 * 60 * 1000) {
        setVerified(true);
      } else {
        localStorage.removeItem("turnstileVerified");
        localStorage.removeItem("turnstileVerifiedTime");
      }
    }

    setLoading(false);
  }, [isLocalhost]);

  const handleSuccess = (token) => {
    console.log("✅ Turnstile verified:", token);
    setVerified(true);
    try {
      localStorage.setItem("turnstileVerified", "true");
      localStorage.setItem("turnstileVerifiedTime", Date.now().toString());
      localStorage.setItem("turnstileToken", token);
    } catch {}
  };

  const handleError = () => {
    console.log("❌ Turnstile failed or unable to connect");
    // If on localhost or error occurred, allow user bypass
    if (isLocalhost) {
      setVerified(true);
      return;
    }
    try {
      localStorage.removeItem("turnstileVerified");
      localStorage.removeItem("turnstileVerifiedTime");
      localStorage.removeItem("turnstileToken");
    } catch {}
  };

  if (isLocalhost || verified) {
    return <>{children}</>;
  }

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
          color: "#fff",
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
            flexDirection: "column",
            gap: "1rem",
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
          {/* Fallback button in case of network or domain mismatch */}
          <button
            onClick={() => setVerified(true)}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#B24B92",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Continue to Site
          </button>
        </div>
      )}
      {verified && children}
    </>
  );
}
