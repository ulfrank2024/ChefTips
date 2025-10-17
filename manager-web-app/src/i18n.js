import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(HttpApi) // use http backend to load translations
  .init({
    supportedLngs: ['en', 'fr'],
    fallbackLng: 'en',
    ns: [
      'common',
      'errors',
      'pages/login',
      'pages/signup',
      'pages/verifyOtp',
      'pages/forgotPassword',
      'pages/resetPassword',
      'pages/joinTeam',
      'pages/setupInvitedPassword',
      'pages/managerDashboard',
      'pages/employeeDashboard',
      'pages/employeeDetails',
      'pages/profilePage',
      'components/manager/manageDepartments',
      'components/manager/manageCategories',
      'components/manager/manageRules',
      'components/manager/manageEmployees',
      'components/manager/payPeriodReport',
      'components/manager/createPool',
      // Add other namespaces as needed for other pages/components
    ],
    defaultNS: 'common', // Fallback namespace
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // path to translation files
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    debug: true, // Set to false in production
  });

export default i18n;
