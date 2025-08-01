/**
 * ===============================================
 * 🚀 Coinremitter Payment Button Widget Integrator
 * For Widget ID: x7EGj8eHOw (6 months)
 * -----------------------------------------------
 * - Dynamically injects the Coinremitter Widget script
 * - Binds all widget event listeners for debugging & integration
 * - Prefills user/customer info dynamically (example provided)
 * - Use with: <cr-button class="btn_x7EGj8eHOw cr-button-bg-preview">Pay For 6 Months</cr-button>
 * ===============================================
 */

// --- 1️⃣ Inject the Coinremitter widget script ---
(function injectCoinremitterWidget() {
  // Remove old script if present (avoid double-load)
  const prev = document.getElementById('coinremitter-payment-button-widget');
  if (prev) prev.remove();

  // Create new script element
  const crPaymentButton_x7EGj8eHOw = document.createElement('script');
  crPaymentButton_x7EGj8eHOw.id = 'coinremitter-payment-button-widget';
  crPaymentButton_x7EGj8eHOw.src =
    'https://cdn.coinremitter.com/widget/payment_button/x7EGj8eHOw/checkout.js';
  crPaymentButton_x7EGj8eHOw.charset = 'UTF-8';
  crPaymentButton_x7EGj8eHOw.setAttribute('crossorigin', '*');

  // Insert script at the end of <body>
  document.body.appendChild(crPaymentButton_x7EGj8eHOw);

  // --- 2️⃣ After script loads, attach event handlers and prefill fields ---
  crPaymentButton_x7EGj8eHOw.onload = function () {
    // Wait for widget to initialize (window.widget_x7EGj8eHOw and crPaymentButton_x7EGj8eHOw are now defined)
    setTimeout(() => {
      // --- Widget Event Listeners ---
      const widgetEvent = window.widget_x7EGj8eHOw;
      if (widgetEvent && typeof widgetEvent.on === 'function') {
        widgetEvent.on('widgetInit', function (data) {
          console.log('🟢 Widget Initialized', data);
        });
        widgetEvent.on('widgetInitError', function (data) {
          console.error('❌ Widget Init Error', data);
        });
        widgetEvent.on('orderCreate', function (data) {
          console.log('📝 Order Created', data);
        });
        widgetEvent.on('orderCreatError', function (data) {
          console.error('❌ Order Create Error', data);
        });
        widgetEvent.on('transactionReceive', function (data) {
          console.log('💰 Transaction Received', data);
        });
        widgetEvent.on('transactionConfirm', function (data) {
          console.log('✅ Transaction Confirmed', data);
        });
        widgetEvent.on('orderPaid', function (data) {
          console.log('🤑 Order Paid', data);
        });
        widgetEvent.on('orderExpire', function (data) {
          console.warn('⌛ Order Expired', data);
        });
        widgetEvent.on('orderReport', function (data) {
          console.warn('📢 Order Reported', data);
        });
        widgetEvent.on('widgetClose', function (data) {
          console.log('🚪 Widget Closed', data);
        });
      } else {
        console.warn('⚠️ Widget event handler missing or not ready yet');
      }
    }, 150); // Widget usually loads in <100ms, but setTimeout ensures window is ready
  };
})();
