import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileGate({ siteKey, children }) {
  const [verified, setVerified] = useState(false);

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
            background: "#fff",
            zIndex: 9999,
          }}
        >
          <Turnstile
            siteKey={siteKey}
            onSuccess={(token) => {
              console.log("✅ Turnstile verified:", token);
              setVerified(true);
            }}
            onError={() => console.log("❌ Turnstile failed")}
          />
        </div>
      )}

      {/* Once verified, show app */}
      {verified && children}
    </>
  );
}
