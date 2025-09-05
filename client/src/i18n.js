import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// the translations
const resources = {
  en: {
    translation: {
      "welcome": "Welcome to the Courier System",
      "login": "Login",
      "register": "Register",
      "logout": "Logout",
      "parcelList": "Parcel List",
      "createParcel": "Create Parcel",
      "dashboard": "Dashboard",
      "agentParcels": "Assigned Parcels",
      "email": "Email",
      "password": "Password",
      "LoginButton": "Login",
      "RegisterButton": "Register",
      "trackParcel": "Track Parcel",
      "bookParcel": "Book Parcel",
      "myParcels": "My Parcels",
      "pickupAddress": "Pickup Address",
      "deliveryAddress": "Delivery Address",
      "parcelSize": "Parcel Size",
      "parcelType": "Parcel Type",
      "paymentMethod": "Payment Method",
      "codAmount": "COD Amount",
      "status": "Status",
      "pending": "Pending",
      "pickedUp": "Picked Up",
      "inTransit": "In Transit",
      "delivered": "Delivered",
      "failed": "Failed",
      "assignedAgent": "Assigned Agent",
      "trackingNumber": "Tracking Number",
      "estimatedDelivery": "Estimated Delivery",
      "actualDelivery": "Actual Delivery",
      "customer": "Customer",
      "agent": "Agent",
      "admin": "Admin"
    }
  },
  bn: {
    translation: {
      "welcome": "কুরিয়ার সিস্টেমে আপনাকে স্বাগতম",
      "login": "লগইন করুন",
      "register": "নিবন্ধন করুন",
      "logout": "লগআউট",
      "parcelList": "পার্সেল তালিকা",
      "createParcel": "পার্সেল তৈরি করুন",
      "dashboard": "ড্যাশবোর্ড",
      "agentParcels": "নির্ধারিত পার্সেল",
      "email": "ইমেইল",
      "password": "পাসওয়ার্ড",
      "LoginButton": "লগইন",
      "RegisterButton": "নিবন্ধন",
      "trackParcel": "পার্সেল ট্র্যাক করুন",
      "bookParcel": "পার্সেল বুক করুন",
      "myParcels": "আমার পার্সেল",
      "pickupAddress": "পিকআপ ঠিকানা",
      "deliveryAddress": "ডেলিভারি ঠিকানা",
      "parcelSize": "পার্সেলের আকার",
      "parcelType": "পার্সেলের ধরন",
      "paymentMethod": "পেমেন্ট পদ্ধতি",
      "codAmount": "ক্যাশ অন ডেলিভারি পরিমাণ",
      "status": "অবস্থা",
      "pending": "অপেক্ষমান",
      "pickedUp": "সংগ্রহ করা হয়েছে",
      "inTransit": "পরিবহনে",
      "delivered": "ডেলিভার করা হয়েছে",
      "failed": "ব্যর্থ",
      "assignedAgent": "নির্ধারিত এজেন্ট",
      "trackingNumber": "ট্র্যাকিং নম্বর",
      "estimatedDelivery": "আনুমানিক ডেলিভারি",
      "actualDelivery": "প্রকৃত ডেলিভারি",
      "customer": "গ্রাহক",
      "agent": "এজেন্ট",
      "admin": "অ্যাডমিন"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    debug: true,

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;