// /app/payment/success/page.js
export default function PaymentSuccess() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="p-10 text-center">
          <h1 className="text-3xl font-bold mb-4">🎉 Payment Successful</h1>
          <p>
            You’ll receive an email shortly. Your subscription will be ready
            within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
