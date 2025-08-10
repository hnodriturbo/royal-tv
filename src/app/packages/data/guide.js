/**
 * =======================================
 * Royal TV — Subscription & Setup Guide 🛎️✨
 * ---------------------------------------
 * Explains registration, payment, activation,
 * and setup steps for Royal TV. Includes app
 * recommendations by platform.
 *
 * Import this in any page:
 * import Guide from '@/packages/data/guide';
 * <Guide />
 * =======================================
 */

const Guide = () => (
  <div className="container-style border-2 mx-auto p-6 mt-12 mb-12">
    {/* 🎉 Steps Section */}
    <h2 className="text-4xl md:text-5xl font-bold text-wonderful-5 mb-6 text-center drop-shadow-lg">
      How to Get Started with Royal TV 🚀
    </h2>
    <ul className="list-decimal list-inside space-y-8 text-lg md:text-xl font-semibold text-cyan-100">
      <li>
        <span className="font-bold text-yellow-300">Register for a Royal TV account</span>
        <br />
        Quick, secure, and including a <span className="underline">FREE 1-day trial</span>!
      </li>
      <li>
        <span className="font-bold text-green-400">Request your free trial</span>
        <br /> by logging into your dashboard and clicking{' '}
        <span className="underline">"Request My Free Trial"</span>.
      </li>
      <li>
        <span className="font-bold text-orange-400">Already had your free trial?</span> <br />
        Go straight to choosing and purchasing your favorite subscription package!
      </li>
      <li>
        <span className="font-bold text-blue-400">Pay with Bitcoin</span> <br />
        Using our secure payment widget{' '}
        <span className="text-pink-300">(on the Buy Now page where everything is encrypted).</span>
        <br />
      </li>
      <li>
        <span className="font-bold text-pink-400">INSTANT ACTIVATION</span> of your subscription.
      </li>

      <li>
        <span className="font-bold text-purple-400">Set up your IPTV app</span>
        <br />
        Open your preferred player, add a new playlist and enter the credentials & URL we provide.{' '}
        <br />
        Username, password, and streaming link/URL and start streaming !
        <br />
        <br />
        <span className="text-cyan-200">
          Done! Enjoy unlimited channels and premium content with Royal TV. 🎬
        </span>
      </li>
    </ul>

    {/* 📱 IPTV App Recommendations */}
    <div className="mt-14">
      <h2 className="text-3xl font-extrabold text-green-500 text-shadow-dark-2 mb-8 text-center">
        Best IPTV Apps for Every Device 📲📺💻
      </h2>
      <div className="w-full flex flex-col md:flex-row gap-10 text-lg">
        {/* 🤖 Android Apps */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <h3 className="text-xl font-bold text-green-200 drop-shadow-lg mb-2">Android Apps 🤖</h3>
          <ul className="list-disc list-inside ml-4 space-y-2 text-green-100 drop-shadow">
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://maxplayer.tv/"
                target="_blank"
                rel="noopener noreferrer"
              >
                MaxPlayer (Top pick!)
              </a>
            </li>
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://tivimate.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                TiviMate (Android, Firestick, Android TV)
              </a>
            </li>
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://www.smartersiptvplayer.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Smarters Player Lite (iOS, Android, Windows, Mac)
              </a>
            </li>
            <li>
              Royal TV is compatible with virtually all modern IPTV apps—enjoy streaming your way!
            </li>
          </ul>
        </div>
        {/* 📺 Smart TV Apps */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <h3 className="text-xl font-bold text-yellow-200 drop-shadow-lg mb-2">
            Smart TV Apps 📺
          </h3>
          <ul className="list-disc list-inside ml-4 space-y-2 text-cyan-100 drop-shadow">
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://maxplayer.tv/"
                target="_blank"
                rel="noopener noreferrer"
              >
                MaxPlayer (Top pick!)
              </a>
            </li>
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://www.smartersiptvplayer.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                IPTV Smarters Player
              </a>
            </li>
            <li>
              Browse your TV’s app store for even more options—Royal TV works with almost every
              major Smart TV app!
            </li>
          </ul>
        </div>
        {/* 🌐 Cross-Platform Apps */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <h3 className="text-xl font-bold text-pink-200 drop-shadow-lg mb-2">
            Cross-Platform Apps 🌐
          </h3>
          <ul className="list-disc list-inside ml-4 space-y-2 text-cyan-100 drop-shadow">
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://maxplayer.tv/"
                target="_blank"
                rel="noopener noreferrer"
              >
                MaxPlayer (All devices)
              </a>
            </li>
            <li>
              <a
                className="text-blue-400 hover:text-pink-400 underline transition"
                href="https://www.smartersiptvplayer.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                IPTV Smarters Player (iOS, Android, Windows, Mac, Smart TV)
              </a>
            </li>
            <li>
              Many more apps available—Royal TV can stream anywhere you want, on any device! 💯
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default Guide;
