// server/utils/sendSMS.js
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = require('twilio')(accountSid, authToken);

const sendSMS = async (toPhoneNumber, messageBody) => {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Twilio credentials or phone number not configured in environment variables.');
    return; // Or throw an error
  }

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: toPhoneNumber,
    });
    console.log('SMS sent:', message.sid);
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Handle the error appropriately, e.g., log it, notify admin
  }
};

module.exports = sendSMS;