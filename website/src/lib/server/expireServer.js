/**
 * 🕒 Sweeps and expires free trials:
 *   • Fetches all non-expired free trials
 *   • Marks as expired if needed
 *   • Updates expiring_at if found on MegaOTT
 *   • Logs megaott_id and user name for each trial
 */

import prisma from '../core/prisma.js';
import axios from 'axios';
import calculateMonthsDaysLeft from '../utils/calculateMonthsDaysLeft.js';

export async function sweepAndExpireFreeTrials() {
  // 🕒 Log sweep start
  console.log(`🕒 Free Trial Sweeper started at ${new Date().toLocaleString()}`);

  // 📦 Find all free trials that are NOT expired
  const freeTrials = await prisma.freeTrial.findMany({
    where: {
      status: { not: 'expired' }
    },
    select: {
      trial_id: true,
      megaott_id: true,
      expiring_at: true,
      status: true,
      user: {
        select: {
          name: true
        }
      }
    }
  });

  // 📊 Log how many trials to process
  console.log(`📦 Found ${freeTrials.length} free trials to check`);

  // 🔄 Loop through each trial
  for (const trial of freeTrials) {
    const { trial_id, expiring_at, status, megaott_id, user } = trial;
    const name = user?.name || 'unknown user';

    // 🟢 Only process trials with a megaott_id
    if (!megaott_id) {
      console.log(`⚠️ [TRIAL] Skipped: No megaott_id for trial_id=${trial_id} | user=${name}`);
      continue;
    }

    // 🌍 Fetch fresh trial data from MegaOTT
    let megaottResponse;
    try {
      // 🔑 MegaOTT API key
      const megaott_api_key = process.env.MEGAOTT_API_KEY;

      const response = await axios.get(`https://megaott.net/api/v1/subscriptions/${megaott_id}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${megaott_api_key}`
        }
      });
      megaottResponse = response.data;
    } catch (error) {
      // 🔴 Log API error
      console.log(
        `❌ [TRIAL] MegaOTT API error for megaott_id=${megaott_id}: ${error.response?.data?.message || error.message}`
      );
      continue;
    }

    // 🕵️ Check if expiring_at was updated at MegaOTT
    let newExpiringAt = megaottResponse.expiring_at ? new Date(megaottResponse.expiring_at) : null;

    // 📝 If local DB does not match remote, update it
    if (newExpiringAt && (!expiring_at || expiring_at.getTime() !== newExpiringAt.getTime())) {
      await prisma.freeTrial.update({
        where: { trial_id },
        data: { expiring_at: newExpiringAt }
      });
      console.log(
        `🔄 [TRIAL] Updated expiring_at for user: ${name} | megaott_id=${megaott_id} | new expiring_at=${newExpiringAt.toLocaleString()}`
      );
    }

    // ⏳ Check if trial is now expired
    if (newExpiringAt && newExpiringAt < new Date() && status !== 'expired') {
      await prisma.freeTrial.update({
        where: { trial_id },
        data: { status: 'expired' }
      });
      console.log(
        `[TRIAL] Marked as expired for user: ${name} | expiring_at=${newExpiringAt.toLocaleString()}`
      );
    }
    // ⚡ Check if status of trial is active and calculate how many hours are left...
    else if (newExpiringAt && newExpiringAt > new Date() && status === 'active') {
      const timeLeft = calculateMonthsDaysLeft(newExpiringAt);
      console.log(
        `[TRIAL] Free Trial is active for user: ${name} | expiring_at=${newExpiringAt.toLocaleString()} | time left: ${timeLeft}`
      );
    }
    // 🧠 If status is expired log it
    else if (status === 'expired') {
      console.log(
        `[TRIAL] Checked: megaott_id=${megaott_id} | user=${name} | This Trial is expired`
      );
    }
    // ❌ If status is active and not yet has an expiring at (user has not logged in and the trial has not yet begun)
    else if (status === 'active' && expiring_at === null) {
      console.log(
        `[TRIAL] Checked: megaott_id=${megaott_id} | user=${name} | This Trial Has Not Been Activated By The User!`
      );
    }
    // 👇 All other possibilities
    else {
      console.log(
        `[TRIAL] Checked: megaott_id=${megaott_id} | user=${name} | This Trial was checked and we found nothing related to it that is important`
      );
    }
  }

  // 🎉 Done!
  console.log(`✅ Free Trial Sweeper finished at ${new Date().toLocaleString()}`);
}

/**
 * 🕒 Sweeps and expires subscriptions:
 *   • Fetches all non-expired subscriptions
 *   • Marks as expired if needed
 *   • Logs megaott_id and name of user for each sub
 *   • Uses local time in logs
 */

export async function sweepAndExpireSubscriptions() {
  // 🕒 Log sweep start time (local time)
  console.log(`🕒 Sweeper started at ${new Date().toLocaleString()}`);

  // 📦 Find all subscriptions that are NOT expired, include user object (safe fields only!)
  const subscriptionsNotExpired = await prisma.subscription.findMany({
    where: {
      status: { not: 'expired' }
    },
    select: {
      subscription_id: true,
      expiring_at: true,
      status: true,
      megaott_id: true,
      user: {
        select: {
          name: true
        }
      }
    }
  });

  // 📊 Log how many subscriptions to process
  console.log(`📦 Found ${subscriptionsNotExpired.length} subscriptions to check`);

  // 🔄 Loop through each subscription
  for (const subscription of subscriptionsNotExpired) {
    // ⚡ Extract fields we use from subscription object
    const { subscription_id, expiring_at, status, megaott_id, user } = subscription;

    const name = user?.name || 'unknown user';

    // 🔍 Log sub with username and megaott_id and expiring_at (local time)
    console.log(
      `🔎 [SUB] Checking subscription_id=${subscription.subscription_id} | megaott_id=${subscription.megaott_id} | expiring_at=${expiring_at ? expiring_at.toLocaleString() : 'N/A'}`
    );

    // ⏳ Check if expired, update status if needed
    if (expiring_at && expiring_at < new Date() && status !== 'expired') {
      await prisma.subscription.update({
        where: { subscription_id },
        data: { status: 'expired' }
      });
      // 🛑 Log the expiration (local time)
      console.log(
        `[SUB] Subscription marked as expired from active for user: ${name || 'couldnt find user name'}`
      );
    } else if (expiring_at && expiring_at > new Date() && status === 'active') {
      // ⚙️ Calculate the time left with the imported function
      const timeLeft = calculateMonthsDaysLeft(expiring_at);
      // ✅ Still active
      console.log(
        `[SUB] Subscription is active for user: ${name} | expiring_at=${expiring_at.toLocaleString()} | time left: ${timeLeft} `
      );
    } else {
      // ℹ️ Just log the check
      console.log(
        `[SUB] checked: ${subscription_id} | megaott_id=${megaott_id} | name of user=${name}`
      );
    }
  }

  // 🎉 Done!
  console.log(`✅ Subscription sweeper finished at time: ${new Date().toLocaleString()}`);
}
