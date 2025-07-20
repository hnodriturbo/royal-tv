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
        <span className="font-bold text-yellow-300">Register for a Royal TV account</span> — quick,
        secure, and unlocks every feature, including a{' '}
        <span className="underline">FREE 1-day trial</span>!
        <br />
        <span className="text-cyan-400">Sign up and join thousands of happy streamers!</span>
      </li>
      <li>
        <span className="font-bold text-green-400">Request your free trial</span> by logging into
        your dashboard and clicking <span className="underline">"Request My Free Trial"</span>.
        <br />
        <span className="text-blue-200">
          Our system is always online, so you never miss a show!
        </span>
      </li>
      <li>
        <span className="font-bold text-orange-400">Already had your free trial?</span> Go straight
        to choosing and purchasing your favorite subscription package!
        <br />
        <span className="text-green-200">No waiting—just pick a package and keep watching!</span>
      </li>
      <li>
        <span className="font-bold text-blue-400">Pay with Bitcoin</span> using our secure payment
        widget (on the Buy Now page).
        <br />
        <span className="text-pink-200">
          Crypto payments = no bank hassles and instant security!
        </span>
      </li>
      <li>
        <span className="font-bold text-pink-400">Wait for admin activation</span> (usually just
        minutes!). We’ll notify you right in your dashboard (and by email if you opted in).
        <br />
        <span className="text-purple-200">Super-fast approvals so you can start streaming!</span>
      </li>
      <li>
        <span className="font-bold text-teal-400">Receive your credentials</span> (username,
        password, and streaming link/URL) via dashboard notification and optionally by email.
        <br />
        <span className="text-yellow-200">Ready, set, stream! 🥳</span>
      </li>
      <li>
        <span className="font-bold text-purple-400">Set up your IPTV app</span>: Open your preferred
        player, add a new playlist and enter the credentials & URL we provide.
        <br />
        <span className="text-cyan-200">
          Done! Enjoy unlimited channels and premium content with Royal TV. 🎬
        </span>
      </li>
    </ul>

    {/* 📱 IPTV App Recommendations */}
    <div className="mt-14">
      <h2 className="text-3xl font-extrabold underline text-cyan-300 drop-shadow-2xl mb-8 text-center">
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
