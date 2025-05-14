// /app/payment/failed/page.js
export default function PaymentFailed() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="p-10 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">
            ❌ Payment Failed
          </h1>
          <p>Please try again or contact support if the issue persists.</p>
        </div>
      </div>
    </div>
  );
}
