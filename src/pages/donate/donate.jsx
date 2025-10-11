function DonatePage() {
  return (
    <div className="max-w-md mx-auto text-center pt-24 pb-10">
      <h1 className="text-2xl font-semibold mb-4">Support Aenime 💖</h1>
      <p className="mb-6 text-gray-300">
        If you enjoy using Aenime, consider supporting us to keep the site ad-free.
      </p>
      <div className="space-y-4">
        <a href="https://ko-fi.com/carlodee" target="_blank" rel="noopener noreferrer" className="block bg-blue-500 py-2 rounded">Ko-fi</a>
        <a href="https://paypal.me/deeCarlo" target="_blank" rel="noopener noreferrer" className="block bg-yellow-500 py-2 rounded">PayPal</a>
        <div className="bg-gray-800 p-3 rounded text-sm text-left">
          <strong>Bitcoin:</strong><br />
          <code>1H9uPpbW8FBEuuihqeg35V1QR7m5f5wbea</code>
        </div>
      </div>
    </div>
  );
}

export default DonatePage;
