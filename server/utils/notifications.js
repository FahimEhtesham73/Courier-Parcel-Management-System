const sendEmail = require('./sendEmail');
const sendSMS = require('./sendSMS');

/**
 * Send notification to customer about parcel status update
 * @param {Object} customer - Customer object with email, phone, username
 * @param {Object} parcel - Parcel object with tracking number, status, etc.
 * @param {string} language - Language preference ('en' or 'bn')
 */
const sendParcelStatusNotification = async (customer, parcel, language = 'en') => {
  try {
    const messages = {
      en: {
        subject: `Parcel Status Updated: ${parcel.trackingNumber}`,
        emailBody: `Dear ${customer.username},\n\nYour parcel (Tracking: ${parcel.trackingNumber}) status has been updated to: ${parcel.status}.\n\n${getStatusMessage(parcel.status, 'en')}\n\nThank you for using CourierPro!`,
        smsBody: `CourierPro: Your parcel ${parcel.trackingNumber} is now ${parcel.status}. ${getStatusMessage(parcel.status, 'en', true)}`
      },
      bn: {
        subject: `পার্সেল স্ট্যাটাস আপডেট: ${parcel.trackingNumber}`,
        emailBody: `প্রিয় ${customer.username},\n\nআপনার পার্সেল (ট্র্যাকিং: ${parcel.trackingNumber}) এর স্ট্যাটাস আপডেট হয়েছে: ${getStatusInBangla(parcel.status)}।\n\n${getStatusMessage(parcel.status, 'bn')}\n\nকুরিয়ারপ্রো ব্যবহার করার জন্য ধন্যবাদ!`,
        smsBody: `কুরিয়ারপ্রো: আপনার পার্সেল ${parcel.trackingNumber} এখন ${getStatusInBangla(parcel.status)}। ${getStatusMessage(parcel.status, 'bn', true)}`
      }
    };

    const message = messages[language] || messages.en;

    // Send email notification
    if (customer.email) {
      await sendEmail(customer.email, message.subject, message.emailBody);
      console.log(`Email notification sent to ${customer.email}`);
    }

    // Send SMS notification
    if (customer.phone) {
      await sendSMS(customer.phone, message.smsBody);
      console.log(`SMS notification sent to ${customer.phone}`);
    }
  } catch (error) {
    console.error('Error sending parcel status notification:', error);
  }
};

/**
 * Send parcel booking confirmation
 * @param {Object} customer - Customer object
 * @param {Object} parcel - Parcel object
 * @param {string} language - Language preference
 */
const sendBookingConfirmation = async (customer, parcel, language = 'en') => {
  try {
    const messages = {
      en: {
        subject: `Parcel Booking Confirmed: ${parcel.trackingNumber}`,
        emailBody: `Dear ${customer.username},\n\nYour parcel booking has been confirmed!\n\nTracking Number: ${parcel.trackingNumber}\nPickup: ${parcel.pickupAddress}\nDelivery: ${parcel.deliveryAddress}\nEstimated Delivery: ${parcel.estimatedDelivery ? new Date(parcel.estimatedDelivery).toDateString() : 'TBD'}\n\nYou can track your parcel anytime using the tracking number.\n\nThank you for choosing CourierPro!`,
        smsBody: `CourierPro: Booking confirmed! Tracking: ${parcel.trackingNumber}. Estimated delivery: ${parcel.estimatedDelivery ? new Date(parcel.estimatedDelivery).toLocaleDateString() : 'TBD'}`
      },
      bn: {
        subject: `পার্সেল বুকিং নিশ্চিত: ${parcel.trackingNumber}`,
        emailBody: `প্রিয় ${customer.username},\n\nআপনার পার্সেল বুকিং নিশ্চিত হয়েছে!\n\nট্র্যাকিং নম্বর: ${parcel.trackingNumber}\nপিকআপ: ${parcel.pickupAddress}\nডেলিভারি: ${parcel.deliveryAddress}\nআনুমানিক ডেলিভারি: ${parcel.estimatedDelivery ? new Date(parcel.estimatedDelivery).toLocaleDateString() : 'নির্ধারিত হয়নি'}\n\nআপনি যেকোনো সময় ট্র্যাকিং নম্বর ব্যবহার করে আপনার পার্সেল ট্র্যাক করতে পারেন।\n\nকুরিয়ারপ্রো বেছে নেওয়ার জন্য ধন্যবাদ!`,
        smsBody: `কুরিয়ারপ্রো: বুকিং নিশ্চিত! ট্র্যাকিং: ${parcel.trackingNumber}। আনুমানিক ডেলিভারি: ${parcel.estimatedDelivery ? new Date(parcel.estimatedDelivery).toLocaleDateString() : 'নির্ধারিত হয়নি'}`
      }
    };

    const message = messages[language] || messages.en;

    if (customer.email) {
      await sendEmail(customer.email, message.subject, message.emailBody);
    }

    if (customer.phone) {
      await sendSMS(customer.phone, message.smsBody);
    }
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
};


/**
 * Get status-specific message
 * @param {string} status - Parcel status
 * @param {string} language - Language preference
 * @param {boolean} short - Whether to return short message for SMS
 * @returns {string} Status message
 */
const getStatusMessage = (status, language = 'en', short = false) => {
  const messages = {
    en: {
      'Pending': short ? 'Awaiting pickup.' : 'Your parcel is awaiting pickup by our delivery agent.',
      'Picked Up': short ? 'Picked up successfully.' : 'Your parcel has been picked up and is being processed.',
      'In Transit': short ? 'On the way to destination.' : 'Your parcel is on the way to the delivery destination.',
      'Delivered': short ? 'Successfully delivered!' : 'Your parcel has been successfully delivered!',
      'Failed': short ? 'Delivery failed.' : 'Delivery attempt failed. Our team will contact you soon.'
    },
    bn: {
      'Pending': short ? 'পিকআপের অপেক্ষায়।' : 'আপনার পার্সেল আমাদের ডেলিভারি এজেন্টের পিকআপের অপেক্ষায় রয়েছে।',
      'Picked Up': short ? 'সফলভাবে পিকআপ হয়েছে।' : 'আপনার পার্সেল পিকআপ হয়েছে এবং প্রক্রিয়াধীন রয়েছে।',
      'In Transit': short ? 'গন্তব্যের পথে।' : 'আপনার পার্সেল ডেলিভারি গন্তব্যের পথে রয়েছে।',
      'Delivered': short ? 'সফলভাবে ডেলিভার হয়েছে!' : 'আপনার পার্সেল সফলভাবে ডেলিভার হয়েছে!',
      'Failed': short ? 'ডেলিভারি ব্যর্থ।' : 'ডেলিভারি চেষ্টা ব্যর্থ হয়েছে। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।'
    }
  };

  return messages[language]?.[status] || messages.en[status] || '';
};

/**
 * Get status in Bangla
 * @param {string} status - English status
 * @returns {string} Bangla status
 */
const getStatusInBangla = (status) => {
  const statusMap = {
    'Pending': 'অপেক্ষমান',
    'Picked Up': 'সংগ্রহ করা হয়েছে',
    'In Transit': 'পরিবহনে',
    'Delivered': 'ডেলিভার করা হয়েছে',
    'Failed': 'ব্যর্থ'
  };
  return statusMap[status] || status;
};

/**
 * Send agent assignment notification
 * @param {Object} agent - Agent object
 * @param {Object} parcel - Parcel object
 * @param {string} language - Language preference
 */
const sendAgentAssignmentNotification = async (agent, parcel, language = 'en') => {
  try {
    const messages = {
      en: {
        subject: `New Parcel Assigned: ${parcel.trackingNumber}`,
        emailBody: `Dear ${agent.username},\n\nA new parcel has been assigned to you:\n\nTracking Number: ${parcel.trackingNumber}\nPickup: ${parcel.pickupAddress}\nDelivery: ${parcel.deliveryAddress}\nPayment: ${parcel.paymentMethod}${parcel.codAmount ? ` (COD: ৳${parcel.codAmount})` : ''}\n\nPlease check your dashboard for more details.\n\nCourierPro Team`,
        smsBody: `CourierPro: New parcel assigned! Tracking: ${parcel.trackingNumber}. Pickup: ${parcel.pickupAddress}. Check your dashboard for details.`
      },
      bn: {
        subject: `নতুন পার্সেল বরাদ্দ: ${parcel.trackingNumber}`,
        emailBody: `প্রিয় ${agent.username},\n\nআপনার জন্য একটি নতুন পার্সেল বরাদ্দ করা হয়েছে:\n\nট্র্যাকিং নম্বর: ${parcel.trackingNumber}\nপিকআপ: ${parcel.pickupAddress}\nডেলিভারি: ${parcel.deliveryAddress}\nপেমেন্ট: ${parcel.paymentMethod}${parcel.codAmount ? ` (COD: ৳${parcel.codAmount})` : ''}\n\nবিস্তারিত জানতে আপনার ড্যাশবোর্ড চেক করুন।\n\nকুরিয়ারপ্রো টিম`,
        smsBody: `কুরিয়ারপ্রো: নতুন পার্সেল বরাদ্দ! ট্র্যাকিং: ${parcel.trackingNumber}। পিকআপ: ${parcel.pickupAddress}। বিস্তারিত জানতে ড্যাশবোর্ড দেখুন।`
      }
    };

    const message = messages[language] || messages.en;

    if (agent.email) {
      await sendEmail(agent.email, message.subject, message.emailBody);
    }

    if (agent.phone) {
      await sendSMS(agent.phone, message.smsBody);
    }
  } catch (error) {
    console.error('Error sending agent assignment notification:', error);
  }
};

/**
 * Send agent verification notification
 * @param {Object} recipient - User object (admin or agent)
 * @param {Object} agent - Agent object
 * @param {string} action - Action type ('submitted', 'approved', 'rejected')
 * @param {string} language - Language preference
 */
const sendAgentVerificationNotification = async (recipient, agent, action, language = 'en') => {
  try {
    const messages = {
      en: {
        submitted: {
          subject: 'New Agent Verification Request',
          emailBody: `Dear Admin,\n\nA new delivery agent verification request has been submitted by ${agent.username} (${agent.email}).\n\nPlease review the documents in the admin panel.\n\nCourierPro Team`,
          smsBody: `CourierPro: New agent verification request from ${agent.username}. Please review in admin panel.`
        },
        approved: {
          subject: 'Verification Approved - Welcome to CourierPro!',
          emailBody: `Dear ${agent.username},\n\nCongratulations! Your delivery agent verification has been approved.\n\nYou can now start accepting delivery assignments through the CourierPro platform.\n\nWelcome to the team!\n\nCourierPro Team`,
          smsBody: `CourierPro: Your verification has been approved! You can now start accepting deliveries.`
        },
        rejected: {
          subject: 'Verification Request Update',
          emailBody: `Dear ${agent.username},\n\nWe regret to inform you that your delivery agent verification request has been rejected.\n\nPlease contact our support team for more information or to resubmit with corrected documents.\n\nCourierPro Team`,
          smsBody: `CourierPro: Your verification request needs attention. Please contact support.`
        }
      },
      bn: {
        submitted: {
          subject: 'নতুন এজেন্ট যাচাইকরণ অনুরোধ',
          emailBody: `প্রিয় অ্যাডমিন,\n\n${agent.username} (${agent.email}) এর কাছ থেকে একটি নতুন ডেলিভারি এজেন্ট যাচাইকরণ অনুরোধ জমা দেওয়া হয়েছে।\n\nঅনুগ্রহ করে অ্যাডমিন প্যানেলে নথিগুলি পর্যালোচনা করুন।\n\nকুরিয়ারপ্রো টিম`,
          smsBody: `কুরিয়ারপ্রো: ${agent.username} থেকে নতুন এজেন্ট যাচাইকরণ অনুরোধ। অ্যাডমিন প্যানেলে পর্যালোচনা করুন।`
        },
        approved: {
          subject: 'যাচাইকরণ অনুমোদিত - কুরিয়ারপ্রোতে স্বাগতম!',
          emailBody: `প্রিয় ${agent.username},\n\nঅভিনন্দন! আপনার ডেলিভারি এজেন্ট যাচাইকরণ অনুমোদিত হয়েছে।\n\nআপনি এখন কুরিয়ারপ্রো প্ল্যাটফর্মের মাধ্যমে ডেলিভারি অ্যাসাইনমেন্ট গ্রহণ করা শুরু করতে পারেন।\n\nটিমে স্বাগতম!\n\nকুরিয়ারপ্রো টিম`,
          smsBody: `কুরিয়ারপ্রো: আপনার যাচাইকরণ অনুমোদিত হয়েছে! আপনি এখন ডেলিভারি গ্রহণ করা শুরু করতে পারেন।`
        },
        rejected: {
          subject: 'যাচাইকরণ অনুরোধ আপডেট',
          emailBody: `প্রিয় ${agent.username},\n\nআমরা জানাতে দুঃখিত যে আপনার ডেলিভারি এজেন্ট যাচাইকরণ অনুরোধ প্রত্যাখ্যান করা হয়েছে।\n\nআরও তথ্যের জন্য বা সংশোধিত নথি দিয়ে পুনরায় জমা দেওয়ার জন্য অনুগ্রহ করে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।\n\nকুরিয়ারপ্রো টিম`,
          smsBody: `কুরিয়ারপ্রো: আপনার যাচাইকরণ অনুরোধে মনোযোগ প্রয়োজন। অনুগ্রহ করে সাপোর্টের সাথে যোগাযোগ করুন।`
        }
      }
    };

    const message = messages[language]?.[action] || messages.en[action];

    if (!message) {
      console.error('Invalid action for agent verification notification:', action);
      return;
    }

    if (recipient.email) {
      await sendEmail(recipient.email, message.subject, message.emailBody);
    }

    if (recipient.phone) {
      await sendSMS(recipient.phone, message.smsBody);
    }
  } catch (error) {
    console.error('Error sending agent verification notification:', error);
  }
};

module.exports = {
  sendParcelStatusNotification,
  sendBookingConfirmation,
  sendAgentAssignmentNotification,
  getStatusMessage,
  getStatusInBangla,
  sendAgentVerificationNotification
};