import React from 'react';

const PaymentInstructions = () => {
  return (
    <div className="container-style">
      <h2 className="text-4xl">What you need to do here is:</h2>
      <hr className="border border-gray-400 w-full text-center items-center justify-center my-4" />
      <ul className="list-disc list-inside ml-4 space-y-1 drop-shadow-md">
        <li>Open your Bitcoin wallet.</li>
        <li>
          Click Send Bitcoin Money (In some wallets it says only
          &quot;Send&quot;).
        </li>
        <li>Copy the address to the send window in your bitcoin wallet.</li>
        <li>
          Copy the amount to the amount in the send window in your bitcoin
          wallet.
        </li>
        <li>Click Send.</li>
      </ul>
      <hr className="border border-gray-400 w-full text-center items-center justify-center my-4" />
      <h2 className="text-3xl">
        Finished and wait for payment completed. Then you receive an email with
        instructions.
      </h2>
      <hr className="border border-gray-400 w-full text-center items-center justify-center my-4" />
      <h2 className="text-2xl">
        Or you can scan the QR code below and use your bitcoin wallet
        automatically through your phone.
      </h2>
    </div>
  );
};

export default PaymentInstructions;
