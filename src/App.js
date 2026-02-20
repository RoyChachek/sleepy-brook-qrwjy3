import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  MapIcon,
  BarChart3,
  List,
  Navigation,
  User,
  Users,
  Check,
  X,
  MapPin,
  Trophy,
  Camera,
  Image as ImageIcon,
  Share2,
  Sparkles,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

// ============================================================================
// הגדרות למערכת מחוץ לג'מיני (Vercel / CodeSandbox / Github)
// ============================================================================

// 1. מפתח API של ג'מיני (בשביל הרוסט והעובדות) - חינם מ- https://aistudio.google.com/app/apikey
const MY_GEMINI_API_KEY = "AIzaSyAd-AKYPVqfWWb8SPk813QmyBQgVqi0YS4"; // <--- הדביקו את המפתח שלכם בין המרכאות כאן

// 2. הגדרות Firebase (בשביל לשמור נתונים בענן ולסנכרן עם עמר) - חינם מ- https://console.firebase.google.com/
const MY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDK2UEObEcHwSSBcqGdTSJ2Q2pqIr8dZnY",
  authDomain: "golden-goat-345ed.firebaseapp.com",
  projectId: "golden-goat-345ed",
  storageBucket: "golden-goat-345ed.firebasestorage.app",
  messagingSenderId: "334282008479",
  appId: "1:334282008479:web:c339ea6f650a27ea27bfaa",
  measurementId: "G-90X8CVF1ZS",
};
/*
  דוגמה לאיך זה אמור להיראות אחרי שתעתיקו מפיירבייס, פשוט תחליפו את ה-null למעלה בבלוק כזה:
  {
    apiKey: "AIzaSyDoX...",
    authDomain: "golden-goat.firebaseapp.com",
    projectId: "golden-goat",
    storageBucket: "golden-goat.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  }
*/
// ============================================================================

// === FIREBASE CLOUD SYNC INIT ===
const appId = typeof __app_id !== "undefined" ? __app_id : "golden-goat-app";
const firebaseConfig =
  MY_FIREBASE_CONFIG ||
  (typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : null);
let app, auth, db;
if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// === COMPRESSED DATABASE (~260 STATIONS) ===
const rawStationsData = [
  ["s1", "פז כצנלסון (גבעתיים)", 32.0754, 34.8091, "גבעתיים", "כצנלסון 121"],
  ["s2", "פז צומת השרון (פרדסיה)", 32.2855, 34.8982, "פרדסיה", "אזור חרצית 16"],
  ["s3", "פז דרך עכו (מוצקין)", 32.8335, 35.0952, "קרית מוצקין", "דרך עכו 217"],
  ["s4", 'פז מערב (ראשל"צ)', 31.973, 34.7925, "ראשון לציון", ""],
  ["s5", "פז מחלף השלום", 32.0734, 34.7942, "תל אביב", ""],
  ["s6", "פז רוקח", 32.102, 34.8, "תל אביב", ""],
  ["s7", "פז נמיר 1", 32.115, 34.795, "תל אביב", ""],
  ["s8", "פז נמיר 2 (צפון)", 32.125, 34.798, "תל אביב", ""],
  ["s9", "פז קיבוץ גלויות", 32.05, 34.775, "תל אביב", ""],
  ["s10", "פז לה גווארדיה", 32.058, 34.79, "תל אביב", ""],
  ["s11", "פז יגאל אלון", 32.068, 34.795, "תל אביב", ""],
  ["s12", "פז יפו (שעון)", 32.055, 34.755, "תל אביב-יפו", ""],
  ["s13", "פז רמת אביב", 32.115, 34.79, "תל אביב", ""],
  ["s14", "פז ירמיהו", 32.095, 34.775, "תל אביב", ""],
  ["s15", "פז הטייסים", 32.045, 34.81, "תל אביב", ""],
  ["s16", "פז קויפמן (הים)", 32.065, 34.76, "תל אביב", ""],
  ["s17", "פז אוניברסיטה", 32.11, 34.805, "תל אביב", ""],
  ["s18", "פז המסגר", 32.065, 34.785, "תל אביב", ""],
  ["s19", "פז אלוף שדה", 32.056, 34.815, "רמת גן", ""],
  ["s20", "פז ביאליק", 32.085, 34.8, "רמת גן", ""],
  ["s21", "פז אבא הלל", 32.095, 34.81, "רמת גן", ""],
  ["s22", "פז ז'בוטינסקי ר\"ג", 32.085, 34.82, "רמת גן", ""],
  ["s23", "פז חזון איש", 32.078, 34.83, "בני ברק", ""],
  ["s24", "פז השומר", 32.088, 34.835, "בני ברק", ""],
  ["s25", "פז סגולה", 32.105, 34.9, "פתח תקווה", ""],
  ["s26", "פז רבין", 32.085, 34.87, "פתח תקווה", ""],
  ["s27", "פז גהה", 32.09, 34.84, "פתח תקווה", ""],
  ["s28", "פז סירקין", 32.085, 34.915, "פתח תקווה", ""],
  ["s29", "פז ירקונים", 32.105, 34.91, "פתח תקווה", ""],
  ["s30", "פז ז'בוטינסקי פ\"ת", 32.09, 34.86, "פתח תקווה", ""],
  ["s31", "פז גיסין", 32.1, 34.88, "פתח תקווה", ""],
  ["s32", "פז צומת סביון", 32.035, 34.855, "קרית אונו", ""],
  ["s33", "פז יהוד מרכז", 32.03, 34.885, "יהוד", ""],
  ["s34", "פז יהוד תעשיה", 32.035, 34.895, "יהוד", ""],
  ["s35", "פז אור יהודה", 32.035, 34.86, "אור יהודה", ""],
  ["s36", "פז קוגל", 32.016, 34.78, "חולון", ""],
  ["s37", "פז הלוחם", 32.025, 34.77, "חולון", ""],
  ["s38", "פז לוי אשכול", 32.025, 34.785, "חולון", ""],
  ["s39", "פז המלאכה", 32.005, 34.8, "חולון", ""],
  ["s40", "פז קוממיות", 32.005, 34.745, "בת ים", ""],
  ["s41", "פז יוספטל", 32.015, 34.75, "בת ים", ""],
  ["s42", "פז דוד רזיאל", 32.025, 34.745, "בת ים", ""],
  ["s43", "פז משה דיין", 31.983, 34.77, "ראשון לציון", ""],
  ["s44", 'פז מזרח רשל"צ', 31.965, 34.82, "ראשון לציון", ""],
  ["s45", "פז מרכז (הדר)", 31.96, 34.8, "ראשון לציון", ""],
  ["s46", "פז שדרות נים (גילי)", 31.95, 34.825, "ראשון לציון", ""],
  ["s47", "פז מכבים", 31.975, 34.815, "ראשון לציון", ""],
  ["s48", "פז נס ציונה (ויצמן)", 31.93, 34.8, "נס ציונה", ""],
  ["s49", "פז בילו", 31.87, 34.815, "רחובות", ""],
  ["s50", "פז הרצל רחובות", 31.895, 34.81, "רחובות", ""],
  ["s51", "פז פארק המדע", 31.915, 34.805, "רחובות", ""],
  ["s52", "פז דרך הים", 31.89, 34.795, "רחובות", ""],
  ["s53", "פז יבנה", 31.875, 34.745, "יבנה", ""],
  ["s54", "פז יבנה מזרח", 31.865, 34.76, "יבנה", ""],
  ["s55", "פז מחלף הסירה", 32.162, 34.81, "הרצליה", ""],
  ["s56", "פז הרצליה פיתוח", 32.165, 34.8, "הרצליה", ""],
  ["s57", "פז שבעת הכוכבים", 32.165, 34.825, "הרצליה", ""],
  ["s58", "פז כפר שמריהו", 32.185, 34.82, "כפר שמריהו", ""],
  ["s59", "פז אחוזה", 32.185, 34.87, "רעננה", ""],
  ["s60", "פז רעננה צפון", 32.195, 34.875, "רעננה", ""],
  ["s61", "פז כפר סבא מרכז", 32.175, 34.905, "כפר סבא", ""],
  ["s62", "פז כפר סבא מזרח", 32.175, 34.925, "כפר סבא", ""],
  ["s63", "פז קניון ערים", 32.175, 34.91, "כפר סבא", ""],
  ["s64", "פז הוד השרון", 32.155, 34.895, "הוד השרון", ""],
  ["s65", "פז הוד השרון תעשיה", 32.145, 34.905, "הוד השרון", ""],
  ["s66", "פז רמת השרון", 32.145, 34.84, "רמת השרון", ""],
  ["s67", "פז מחלף מורשה", 32.125, 34.85, "רמת השרון", ""],
  ["s68", "פז פולג (כביש החוף)", 32.275, 34.85, "נתניה", ""],
  ["s69", "פז הרצל נתניה", 32.325, 34.855, "נתניה", ""],
  ["s70", "פז ננתיה צפון", 32.345, 34.86, "נתניה", ""],
  ["s71", 'פז אזה"ת נתניה', 32.285, 34.865, "נתניה", ""],
  ["s72", "פז אבן יהודה", 32.27, 34.885, "אבן יהודה", ""],
  ["s73", "פז קדימה צורן", 32.28, 34.915, "קדימה", ""],
  ["s74", "פז כפר יונה", 32.315, 34.935, "כפר יונה", ""],
  ["s75", "פז בית יצחק", 32.325, 34.895, "בית יצחק", ""],
  ["s76", "פז חבצלת השרון", 32.355, 34.865, "חבצלת השרון", ""],
  ["s77", "פז ינאי / בית ינאי", 32.38, 34.865, "כביש 2", ""],
  ["s78", "פז חדרה מרכז", 32.435, 34.915, "חדרה", ""],
  ["s79", "פז חדרה מערב", 32.435, 34.89, "חדרה", ""],
  ["s80", 'פז חדרה אזה"ת', 32.455, 34.92, "חדרה", ""],
  ["s81", "פז פרדס חנה", 32.47, 34.965, "פרדס חנה", ""],
  ["s82", "פז אור עקיבא (קניון אורות)", 32.51, 34.915, "אור עקיבא", ""],
  ["s83", "פז בנימינה", 32.52, 34.945, "בנימינה", ""],
  ["s84", "פז זכרון יעקב", 32.575, 34.95, "זכרון יעקב", ""],
  ["s85", "פז כרכור", 32.475, 34.995, "כרכור", ""],
  ["s86", "פז כביש 6 - באקה (לצפון)", 32.405, 35.02, "כביש 6", ""],
  ["s87", "פז כביש 6 - באקה (לדרום)", 32.4055, 35.018, "כביש 6", ""],
  ["s88", "פז כביש 6 - נען (לצפון)", 31.87, 34.89, "כביש 6", ""],
  ["s89", "פז כביש 6 - נען (לדרום)", 31.869, 34.888, "כביש 6", ""],
  ["s90", "פז שער הגיא", 31.8152, 35.021, "כביש 1", ""],
  ["s91", "פז שורש", 31.795, 35.06, "שורש", ""],
  ["s92", "פז אבו גוש", 31.805, 35.105, "אבו גוש", ""],
  ["s93", "פז מבשרת ציון", 31.795, 35.15, "מבשרת ציון", ""],
  ["s94", "פז גבעת שאול", 31.79, 35.19, "ירושלים", ""],
  ["s95", "פז רוממה", 31.785, 35.2, "ירושלים", ""],
  ["s96", "פז הר הצופים", 31.795, 35.24, "ירושלים", ""],
  ["s97", "פז תלפיות", 31.75, 35.215, "ירושלים", ""],
  ["s98", "פז קטמון", 31.765, 35.205, "ירושלים", ""],
  ["s99", "פז גילה", 31.725, 35.185, "ירושלים", ""],
  ["s100", "פז דרך חברון", 31.745, 35.22, "ירושלים", ""],
  ["s101", "פז עמק רפאים (בקעה)", 31.76, 35.22, "ירושלים", ""],
  ["s102", "פז מוזיאון ישראל", 31.775, 35.205, "ירושלים", ""],
  ["s103", "פז מעלה אדומים", 31.765, 35.295, "מעלה אדומים", ""],
  ["s104", "פז צומת שילת", 31.915, 35.0, "מודיעין", ""],
  ["s105", "פז מודיעין סנטר", 31.895, 35.01, "מודיעין", ""],
  ["s106", "פז ליגד סנטר", 31.925, 34.98, "מודיעין", ""],
  ["s107", "פז מכבים רעות", 31.885, 35.02, "מודיעין", ""],
  ["s108", "פז בית שמש (כניסה)", 31.745, 34.985, "בית שמש", ""],
  ["s109", 'פז בית שמש אזה"ת', 31.755, 34.98, "בית שמש", ""],
  ["s110", "פז קרית ארבע", 31.535, 35.115, "קרית ארבע", ""],
  ["s111", "פז גוש עציון", 31.645, 35.12, "צומת הגוש", ""],
  ["s112", "פז רמלה (ירושלים)", 31.925, 34.87, "רמלה", ""],
  ["s113", "פז לוד", 31.955, 34.89, "לוד", ""],
  ["s114", "פז רמלה דרום", 31.91, 34.88, "רמלה", ""],
  ["s115", "פז מזכרת בתיה", 31.855, 34.84, "מזכרת בתיה", ""],
  ["s116", "פז גדרה", 31.815, 34.78, "גדרה", ""],
  ["s117", "פז עד הלום", 31.765, 34.66, "אשדוד", ""],
  ["s118", "פז נמל אשדוד", 31.825, 34.65, "אשדוד", ""],
  ["s119", "פז אשדוד סיטי", 31.795, 34.64, "אשדוד", ""],
  ["s120", "פז אשדוד מזרח", 31.785, 34.665, "אשדוד", ""],
  ["s121", "פז אשקלון צפון", 31.666, 34.57, "אשקלון", ""],
  ["s122", "פז אשקלון מרכז (דוד)", 31.66, 34.56, "אשקלון", ""],
  ["s123", "פז אשקלון דרום", 31.645, 34.555, "אשקלון", ""],
  ["s124", "פז אשקלון אפרידר", 31.675, 34.55, "אשקלון", ""],
  ["s125", "פז אקסודוס", 31.68, 34.56, "אשקלון", ""],
  ["s126", "פז קסטינה", 31.7331, 34.7645, "קרית מלאכי", ""],
  ["s127", 'פז קרית מלאכי אזה"ת', 31.725, 34.76, "קרית מלאכי", ""],
  ["s128", "פז פלוגות", 31.615, 34.765, "קרית גת", ""],
  ["s129", "פז קרית גת מרכז", 31.605, 34.77, "קרית גת", ""],
  ["s130", "פז שדרות", 31.525, 34.595, "שדרות", ""],
  ["s131", "פז נתיבות", 31.425, 34.585, "נתיבות", ""],
  ["s132", "פז אופקים", 31.315, 34.62, "אופקים", ""],
  ["s133", "פז צומת אשכול / מגן", 31.295, 34.425, "עוטף עזה", ""],
  ["s134", "פז צומת קמה", 31.4425, 34.761, "בית קמה", ""],
  ["s135", "פז להבים", 31.365, 34.815, "להבים", ""],
  ["s136", "פז רהט", 31.395, 34.755, "רהט", ""],
  ["s137", "פז מכתשים", 31.245, 34.79, "באר שבע", ""],
  ["s138", "פז נווה זאב", 31.235, 34.77, "באר שבע", ""],
  ["s139", 'פז עיר עתיקה ב"ש', 31.245, 34.795, "באר שבע", ""],
  ["s140", 'פז ביג (BIG) ב"ש', 31.24, 34.81, "באר שבע", ""],
  ["s141", "פז אצטדיון טרנר", 31.265, 34.78, "באר שבע", ""],
  ["s142", 'פז ב"ש צפון (בית החייל)', 31.255, 34.795, "באר שבע", ""],
  ["s143", "פז פארק עומר", 31.275, 34.835, "עומר", ""],
  ["s144", "פז דימונה", 31.07, 35.03, "דימונה", ""],
  ["s145", "פז ערד", 31.255, 35.215, "ערד", ""],
  ["s146", "פז ירוחם", 30.985, 34.935, "ירוחם", ""],
  ["s147", "פז עבדת", 30.795, 34.765, "עבדת", ""],
  ["s148", "פז מצפה רמון", 30.608, 34.803, "מצפה רמון", ""],
  ["s149", "פז צומת הערבה", 30.975, 35.31, "הערבה", ""],
  ["s150", "פז חצבה", 30.8, 35.25, "הערבה", ""],
  ["s151", "פז עין יהב", 30.63, 35.24, "עין יהב", ""],
  ["s152", "פז יטבתה", 29.8945, 35.0592, "יטבתה", ""],
  ["s153", "פז אילת (הערבה)", 29.56, 34.96, "אילת", ""],
  ["s154", "פז אילת (חוף צפוני)", 29.545, 34.965, "אילת", ""],
  ["s155", "פז אילת מרכז", 29.555, 34.95, "אילת", ""],
  ["s156", "פז אילת (אדום)", 29.565, 34.945, "אילת", ""],
  ["s157", 'פז מת"מ', 32.7938, 34.9575, "חיפה", ""],
  ["s158", "פז חורב", 32.78, 34.98, "חיפה", ""],
  ["s159", "פז צ'ק פוסט", 32.79, 35.035, "חיפה", ""],
  ["s160", "פז בת גלים", 32.83, 34.98, "חיפה", ""],
  ["s161", "פז נווה שאנן", 32.785, 35.01, "חיפה", ""],
  ["s162", "פז הדר", 32.805, 34.995, "חיפה", ""],
  ["s163", "פז רוממה (חיפה)", 32.788, 34.995, "חיפה", ""],
  ["s164", "פז חוף הכרמל", 32.795, 34.96, "חיפה", ""],
  ["s165", "פז אוניברסיטה חיפה", 32.76, 35.02, "חיפה", ""],
  ["s166", "פז יזרעאליה", 32.782, 35.005, "חיפה", ""],
  ["s167", "פז קרית אתא מרכז", 32.805, 35.1, "קרית אתא", ""],
  ["s168", 'פז קרית אתא אזה"ת', 32.815, 35.095, "קרית אתא", ""],
  ["s169", "פז קרית ביאליק", 32.835, 35.085, "קרית ביאליק", ""],
  ["s170", "פז צומת מוצקין", 32.825, 35.075, "קרית מוצקין", ""],
  ["s171", "פז קרית ים", 32.845, 35.07, "קרית ים", ""],
  ["s172", "פז קרית חיים (הדגן)", 32.82, 35.06, "קרית חיים", ""],
  ["s173", "פז נשר", 32.765, 35.04, "נשר", ""],
  ["s174", "פז טירת כרמל", 32.765, 34.975, "טירת כרמל", ""],
  ["s175", "פז עכו צפון", 32.93, 35.08, "עכו", ""],
  ["s176", "פז עכו דרום", 32.915, 35.085, "עכו", ""],
  ["s177", "פז עכו מזרח", 32.925, 35.095, "עכו", ""],
  ["s178", "פז נהריה דרום", 33.0, 35.095, "נהריה", ""],
  ["s179", "פז נהריה צפון", 33.015, 35.09, "נהריה", ""],
  ["s180", "פז שלומי", 33.075, 35.145, "שלומי", ""],
  ["s181", "פז כרמיאל מערב", 32.915, 35.29, "כרמיאל", ""],
  ["s182", "פז כרמיאל מזרח", 32.925, 35.315, "כרמיאל", ""],
  ["s183", "פז סכנין", 32.865, 35.3, "סכנין", ""],
  ["s184", "פז כפר יאסיף", 32.955, 35.165, "כפר יאסיף", ""],
  ["s185", "פז יקנעם (מתחם)", 32.65, 35.1, "יקנעם", ""],
  ["s186", "פז טבעון", 32.715, 35.125, "קרית טבעון", ""],
  ["s187", "פז רמת ישי", 32.705, 35.175, "רמת ישי", ""],
  ["s188", "פז צומת אלונים", 32.7308, 35.1538, "אלונים", ""],
  ["s189", "פז עפולה עילית", 32.6105, 35.3015, "עפולה", ""],
  ["s190", "פז עפולה מרכז", 32.605, 35.29, "עפולה", ""],
  ["s191", "פז און עפולה (כביש 71)", 32.595, 35.31, "עפולה", ""],
  ["s192", "פז צומת מגידו", 32.57, 35.185, "מגידו", ""],
  ["s193", "פז מגדל העמק", 32.665, 35.24, "מגדל העמק", ""],
  ["s194", "פז נצרת", 32.695, 35.3, "נצרת", ""],
  ["s195", "פז נוף הגליל", 32.705, 35.32, "נוף הגליל", ""],
  ["s196", "פז ריינה", 32.725, 35.305, "ריינה", ""],
  ["s197", "פז כפר כנא", 32.745, 35.34, "כפר כנא", ""],
  ["s198", "פז בית שאן", 32.495, 35.495, "בית שאן", ""],
  ["s199", "פז צומת גולני", 32.7753, 35.4058, "צומת גולני", ""],
  ["s200", "פז טבריה עלית", 32.795, 35.52, "טבריה", ""],
  ["s201", "פז טבריה מרכז", 32.785, 35.535, "טבריה", ""],
  ["s202", "פז טבריה מזרח", 32.7845, 35.5395, "טבריה", ""],
  ["s203", "פז צומת צמח", 32.705, 35.585, "עמק הירדן", ""],
  ["s204", "פז צפת", 32.965, 35.495, "צפת", ""],
  ["s205", "פז חצור הגלילית", 32.98, 35.55, "חצור הגלילית", ""],
  ["s206", "פז ראש פינה", 32.97, 35.54, "ראש פינה", ""],
  ["s207", "פז קרית שמונה (דרום)", 33.205, 35.57, "קרית שמונה", ""],
  ["s208", "פז קרית שמונה (צפון)", 33.215, 35.57, "קרית שמונה", ""],
  ["s209", "פז צומת הגומא", 33.165, 35.58, "גליל עליון", ""],
  ["s210", "פז קצרין", 32.99, 35.69, "רמת הגולן", ""],
  ["s211", "פז בני יהודה", 32.795, 35.68, "רמת הגולן", ""],
  ["s212", "פז מסעדה", 33.235, 35.76, "רמת הגולן", ""],
  ["s213", "פז מג'דל שמס", 33.265, 35.77, "רמת הגולן", ""],
  ["s214", "פז מעלות", 33.015, 35.275, "מעלות תרשיחא", ""],
  ["s215", "פז גרנות הגליל", 33.065, 35.25, "גורנות הגליל", ""],
  ["s216", "פז חורפיש", 33.015, 35.35, "חורפיש", ""],
  ["s217", "פז צומת רעננה מרכז", 32.18, 34.885, "רעננה", ""],
  ["s218", "פז הרצליה מרכז", 32.165, 34.835, "הרצליה", ""],
  ["s219", "פז כפר סבא דרום", 32.165, 34.915, "כפר סבא", ""],
  ["s220", "פז טייבה", 32.265, 35.005, "טייבה", ""],
  ["s221", "פז קלנסווה", 32.285, 35.0, "קלנסווה", ""],
  ["s222", "פז אריאל", 32.105, 35.185, "אריאל", ""],
  ["s223", "פז קרני שומרון", 32.165, 35.105, "קרני שומרון", ""],
  ["s224", "פז עלי", 32.065, 35.265, "עלי", ""],
  ["s225", "פז בית אל", 31.945, 35.22, "בית אל", ""],
  ["s226", "פז שער בנימין", 31.865, 35.26, "שער בנימין", ""],
  ["s227", "פז מישור אדומים", 31.785, 35.325, "מישור אדומים", ""],
  ["s228", "פז ים המלח", 31.195, 35.365, "עין בוקק", ""],
  ["s229", "פז אלמוג", 31.79, 35.46, "צומת אלמוג", ""],
  ["s230", "פז נתיב העשרה", 31.605, 34.545, "עוטף עזה", ""],
  ["s231", "פז יד מרדכי", 31.585, 34.555, "יד מרדכי", ""],
  ["s232", "פז שער הנגב", 31.495, 34.59, "שער הנגב", ""],
  ["s233", "פז גילת", 31.325, 34.645, "צומת גילת", ""],
  ["s234", "פז תל שבע", 31.245, 34.845, "תל שבע", ""],
  ["s235", "פז נאות חובב", 31.135, 34.795, "רמת חובב", ""],
  ["s236", "פז שגב שלום", 31.185, 34.835, "שגב שלום", ""],
  ["s237", 'פז מצפה אבי"ב', 32.835, 35.225, 'מצפה אבי"ב', ""],
  ["s238", "פז גיא עירון", 32.485, 35.035, "כפר קרע", ""],
  ["s239", "פז אלישמע", 32.145, 34.92, "אלישמע", ""],
  ["s240", "פז רמת גן עוז", 32.08, 34.81, "רמת גן", ""],
  ["s241", "פז פלורנטין", 32.055, 34.77, "תל אביב", ""],
  ["s242", "פז ככר דיזנגוף", 32.078, 34.775, "תל אביב", ""],
  ["s243", "פז בן יהודה", 32.085, 34.77, "תל אביב", ""],
  ["s244", "פז אילון צפון", 32.085, 34.795, "תל אביב", ""],
  ["s245", "פז אילון דרום", 32.08, 34.795, "תל אביב", ""],
  ["s246", "פז חולון מזרח", 32.015, 34.805, "חולון", ""],
  ["s247", 'פז ראשל"צ מערב חוף', 31.985, 34.75, "ראשון לציון", ""],
  ["s248", "פז רחובות צפון", 31.905, 34.815, "רחובות", ""],
  ["s249", "פז אשדוד עד הלום דרום", 31.76, 34.665, "אשדוד", ""],
  ["s250", "פז אשקלון תעשיה", 31.655, 34.58, "אשקלון", ""],
  ["s251", "פז קרית שמונה מרכז", 33.21, 35.57, "קרית שמונה", ""],
  ["s252", "פז נהריה מזרח", 33.005, 35.105, "נהריה", ""],
  ["s253", "פז עכו תעשיה", 32.91, 35.09, "עכו", ""],
  ["s254", "פז חיפה דרום", 32.785, 34.965, "חיפה", ""],
  ["s255", "פז חיפה טכניון", 32.775, 35.025, "חיפה", ""],
  ["s256", "פז מגידו דרום", 32.565, 35.18, "מגידו", ""],
  ["s257", "פז גלבוע", 32.55, 35.38, "הגלבוע", ""],
  ["s258", "פז חריש", 32.465, 35.035, "חריש", ""],
];

const STATIONS = rawStationsData.map((s) => ({
  id: s[0],
  name: s[1],
  lat: s[2],
  lon: s[3],
  city: s[4],
  address: s[5],
}));

// === TROPHIES SYSTEM ===
const TROPHIES = [
  {
    id: "t1",
    title: "הצעד הראשון",
    desc: "סמנו וי על התחנה הראשונה שלכם",
    type: "bronze",
    check: (visits) => visits.length >= 1,
  },
  {
    id: "t2",
    title: "מתחת לבית",
    desc: "בקרו בתחנת כצנלסון 121 (גבעתיים)",
    type: "bronze",
    check: (visits) =>
      visits.some((v) =>
        STATIONS.find((s) => s.id === v.sId)?.name.includes("כצנלסון")
      ),
  },
  {
    id: "t3",
    title: "קפיצה לשוכרים",
    desc: "בקרו בדרך עכו 217 (קריית מוצקין)",
    type: "bronze",
    check: (visits) =>
      visits.some((v) =>
        STATIONS.find((s) => s.id === v.sId)?.city.includes("מוצקין")
      ),
  },
  {
    id: "t4",
    title: "ביקור אצל ההורים",
    desc: "בקרו בתחנה בצומת השרון (ליד חרצית 16, פרדסיה)",
    type: "bronze",
    check: (visits) =>
      visits.some((v) => {
        const s = STATIONS.find((x) => x.id === v.sId);
        return s && (s.name.includes("פרדסיה") || s.name.includes("השרון"));
      }),
  },
  {
    id: "t5",
    title: "העיר ללא הפסקה",
    desc: "בקרו ב-5 תחנות שונות בתל אביב",
    type: "bronze",
    check: (visits) =>
      visits.filter((v) =>
        STATIONS.find((s) => s.id === v.sId)?.city?.includes("תל אביב")
      ).length >= 5,
  },
  {
    id: "t6",
    title: "מתחממים",
    desc: "סמנו וי על 25 תחנות",
    type: "silver",
    check: (visits) => visits.length >= 25,
  },
  {
    id: "t7",
    title: "עבודת צוות",
    desc: 'בקרו ב-20 תחנות יחד ("שנינו")',
    type: "silver",
    check: (visits) => visits.filter((v) => v.who === "שנינו").length >= 20,
  },
  {
    id: "t8",
    title: "יורדים לאילת",
    desc: "בקרו באחת מהתחנות באילת",
    type: "silver",
    check: (visits) =>
      visits.some((v) =>
        STATIONS.find((s) => s.id === v.sId)?.city?.includes("אילת")
      ),
  },
  {
    id: "t9",
    title: "מאה עגול",
    desc: "סמנו וי על 100 תחנות!",
    type: "gold",
    check: (visits) => visits.length >= 100,
  },
  {
    id: "t10",
    title: "אחים לנשק",
    desc: "בקרו ב-75 תחנות ביחד!",
    type: "gold",
    check: (visits) => visits.filter((v) => v.who === "שנינו").length >= 75,
  },
  {
    id: "t11",
    title: "מצפון ועד דרום",
    desc: "בקרו גם באילת וגם בקריית שמונה",
    type: "gold",
    check: (visits) => {
      const cities = visits.map(
        (v) => STATIONS.find((s) => s.id === v.sId)?.city || ""
      );
      return (
        cities.some((c) => c.includes("אילת")) &&
        cities.some((c) => c.includes("שמונה"))
      );
    },
  },
  {
    id: "t12",
    title: "The Golden Goat",
    desc: "סיימו את המשחק: בקרו בכל התחנות!",
    type: "platinum",
    check: (visits) => visits.length >= STATIONS.length,
  },
];

const loadLeaflet = () => {
  return new Promise((resolve) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
};

const fetchWithBackoff = async (url, options, retries = 5) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// === PWA Injection ===
const injectPWA = () => {
  if (document.getElementById("pwa-manifest")) return;
  const manifest = {
    name: "The Golden Goat Journey",
    short_name: "Golden Goat",
    start_url: window.location.href,
    display: "standalone",
    background_color: "#facc15",
    theme_color: "#facc15",
    icons: [
      {
        src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23facc15'/><text x='50' y='65' font-size='50' text-anchor='middle'>🐐</text></svg>",
        sizes: "192x192",
        type: "image/svg+xml",
      },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/json",
  });
  const manifestUrl = URL.createObjectURL(blob);

  const link = document.createElement("link");
  link.id = "pwa-manifest";
  link.rel = "manifest";
  link.href = manifestUrl;
  document.head.appendChild(link);

  const tags = [
    { name: "apple-mobile-web-app-capable", content: "yes" },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "black-translucent",
    },
    { name: "apple-mobile-web-app-title", content: "Golden Goat" },
  ];
  tags.forEach((tag) => {
    const meta = document.createElement("meta");
    meta.name = tag.name;
    meta.content = tag.content;
    document.head.appendChild(meta);
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [isCopied, setIsCopied] = useState(false);

  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState(() => {
    try {
      const saved = localStorage.getItem("goat_visits_data");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedStation, setSelectedStation] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [trophyModal, setTrophyModal] = useState(null);

  const [aiTriviaCache, setAiTriviaCache] = useState({});
  const [isAiLoading, setIsAiLoading] = useState({});

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersMapRef = useRef({});

  const fileInputRef = useRef(null);
  const prevUnlockedRef = useRef([]);

  // PWA Inject
  useEffect(() => {
    injectPWA();
  }, []);

  // Firebase Auth
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Firebase Sync
  useEffect(() => {
    if (!user || !db) return;
    const colRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "visits"
    );
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const visitsData = [];
        snapshot.forEach((docSnap) => {
          visitsData.push({
            id: docSnap.id,
            sId: docSnap.id,
            ...docSnap.data(),
          });
        });
        setVisits(visitsData);
        localStorage.setItem("goat_visits_data", JSON.stringify(visitsData));
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // === GEMINI AI FUNCTIONS ===
  const apiKey = MY_GEMINI_API_KEY || "";

  const fetchStationTrivia = async (city, stationId) => {
    if (!city) return;
    setIsAiLoading((prev) => ({ ...prev, [stationId]: "trivia" }));
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `ספר לי עובדה אחת קצרה, מצחיקה או מעניינת על העיר ${city} בישראל בהקשר של עצירת התרעננות בתחנת דלק. בערך 2-3 משפטים. תשלב אימוג'י של עז 🐐 בסוף.`,
              },
            ],
          },
        ],
      };
      const data = await fetchWithBackoff(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) setAiTriviaCache((prev) => ({ ...prev, [stationId]: text }));
    } catch (e) {
      setAiTriviaCache((prev) => ({
        ...prev,
        [stationId]:
          "העז שלנו הלכה לאיבוד ולא מצאה עובדה מעניינת... (בדקו שהכנסתם API Key תקין) 🐐",
      }));
    }
    setIsAiLoading((prev) => ({ ...prev, [stationId]: false }));
  };

  const fetchSelfieRoast = async (photoDataUrl, sId) => {
    setIsAiLoading((prev) => ({ ...prev, [sId]: "roast" }));
    try {
      const base64Data = photoDataUrl.split(",")[1];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "אתה עז הרים שנונה וחצופה ששופטת סלפי של אנשים בתחנות דלק במסע שלהם. תן ביקורת (רוסט) מצחיקה וקצרה על הסלפי הזה. בסוף, תן ציון מ-1 עד 10 עזים (🐐). כתוב בעברית, קצר ולעניין.",
              },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            ],
          },
        ],
      };
      const data = await fetchWithBackoff(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        if (db && user)
          await setDoc(
            doc(db, "artifacts", appId, "public", "data", "visits", sId),
            { aiRoast: text },
            { merge: true }
          );
        setVisits((prev) =>
          prev.map((v) => (v.sId === sId ? { ...v, aiRoast: text } : v))
        );
      }
    } catch (e) {
      const fallbackText =
        "אפילו אני לא יודעת מה להגיד על הסלפי הזה... (בדקו API Key) 🐐";
      if (db && user)
        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "visits", sId),
          { aiRoast: fallbackText },
          { merge: true }
        );
      setVisits((prev) =>
        prev.map((v) => (v.sId === sId ? { ...v, aiRoast: fallbackText } : v))
      );
    }
    setIsAiLoading((prev) => ({ ...prev, [sId]: false }));
  };

  const shareVisit = async (visit, station, stats) => {
    let text = `🐐 The Golden Goat Journey 🐐\n\nסמנו לנו V על *${station.name}*!\nמי הגיע: ${visit.who}\n`;
    if (visit.aiRoast) {
      text += `\nדבר העז: "${visit.aiRoast}"\n`;
    }
    text += `\nהספק ארצי: ${stats.progress}% 🥇`;

    // ניסיון לשתף עם מנגנון מובנה של המכשיר (עובד בעיקר באייפון/אנדרואיד)
    if (navigator.canShare && visit.img) {
      try {
        const file = dataURLtoFile(visit.img, "goat_selfie.jpg");
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "The Golden Goat Journey",
            text: text,
            files: [file],
          });
          return; // אם הצליח לשתף תמונה וטקסט, סיימנו
        }
      } catch (err) {}
    }

    // ניסיון שני לשתף רק טקסט במנגנון מובנה
    if (navigator.share) {
      try {
        await navigator.share({ title: "The Golden Goat Journey", text: text });
        return;
      } catch (err) {}
    }

    // גיבוי חסין תקלות: פותח ישירות את וואטסאפ בדפדפן או במחשב
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const shareTrophy = async (trophy, progress) => {
    let text = `🏆 הישג חדש ב-The Golden Goat Journey!\n\nהשגנו את הגביע: *${trophy.title}* 🐐\n(${trophy.desc})\n\nהספק ארצי: ${progress}%`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "The Golden Goat Journey", text: text });
        return;
      } catch (err) {}
    }
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const createCustomIcon = useCallback((isVisited) => {
    const L = window.L;
    if (!L) return null;
    const html = `<div class="relative w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-colors duration-200 ${
      isVisited ? "bg-green-500" : "bg-yellow-400"
    }">${
      isVisited
        ? '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>'
        : ""
    }</div>`;
    return L.divIcon({
      html,
      className: "custom-leaflet-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  // Map Init
  useEffect(() => {
    if (activeTab !== "map" || STATIONS.length === 0) return;

    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([31.9, 34.8], 8);
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        ).addTo(map);
        mapInstanceRef.current = map;
        markersLayerRef.current = L.featureGroup().addTo(map);
      }
      if (Object.keys(markersMapRef.current).length === 0) {
        markersLayerRef.current.clearLayers();
        STATIONS.forEach((station) => {
          const isVisited = visits.some((v) => v.sId === station.id);
          const icon = createCustomIcon(isVisited);
          const marker = L.marker([station.lat, station.lon], { icon });
          marker.on("click", () => setSelectedStation(station));
          markersLayerRef.current.addLayer(marker);
          markersMapRef.current[station.id] = marker;
        });
      }
    });
  }, [activeTab, createCustomIcon, visits]);

  // Update Icons ONLY
  useEffect(() => {
    if (Object.keys(markersMapRef.current).length === 0) return;
    STATIONS.forEach((station) => {
      const marker = markersMapRef.current[station.id];
      if (marker) {
        const isVisited = visits.some((v) => v.sId === station.id);
        marker.setIcon(createCustomIcon(isVisited));
      }
    });
  }, [visits, createCustomIcon]);

  // בדיקת גביעים חדשים
  useEffect(() => {
    const currentUnlocked = TROPHIES.filter((t) => t.check(visits));
    const currentUnlockedIds = currentUnlocked.map((t) => t.id);
    if (prevUnlockedRef.current.length > 0) {
      const newlyUnlocked = currentUnlocked.filter(
        (t) => !prevUnlockedRef.current.includes(t.id)
      );
      if (newlyUnlocked.length > 0) {
        setTrophyModal(newlyUnlocked[0]);
      }
    }
    prevUnlockedRef.current = currentUnlockedIds;
  }, [visits]);

  const handleVisit = async (who) => {
    if (!selectedStation) return;
    const sId = selectedStation.id;
    const cv = visits.find((v) => v.sId === sId);

    if (cv && cv.who === who) {
      // ביטול
      setVisits(visits.filter((v) => v.sId !== sId));
      if (db && user)
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "visits", sId)
        );
    } else {
      // הוספה/עדכון
      setVisits([
        ...visits.filter((v) => v.sId !== sId),
        { id: sId, sId, who, ts: Date.now() },
      ]);
      if (db && user)
        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "visits", sId),
          { sId, who, ts: Date.now() },
          { merge: true }
        );
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedStation) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        const sId = selectedStation.id;

        // עדכון UI ופיירבייס עם התמונה (ואיפוס ה-Roast הקודם אם היה)
        if (db && user)
          await setDoc(
            doc(db, "artifacts", appId, "public", "data", "visits", sId),
            { img: compressedBase64, aiRoast: null },
            { merge: true }
          );
        setVisits((prev) =>
          prev.map((v) =>
            v.sId === sId ? { ...v, img: compressedBase64, aiRoast: null } : v
          )
        );

        // הפעלה אוטומטית של הבינה המלאכותית
        fetchSelfieRoast(compressedBase64, sId);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const stats = useMemo(() => {
    const total = STATIONS.length;
    const visited = visits.length;
    return {
      total,
      visited,
      progress: Math.round((visited / (total || 1)) * 100) || 0,
      roi: visits.filter((v) => v.who === "רועי" || v.who === "שנינו").length,
      omer: visits.filter((v) => v.who === "עמר" || v.who === "שנינו").length,
      unlockedTrophies: TROPHIES.filter((t) => t.check(visits)).length,
    };
  }, [visits]);

  return (
    <div
      dir="rtl"
      className="flex flex-col h-[100dvh] w-full bg-gray-50 font-sans overflow-hidden text-slate-900"
    >
      <header className="bg-yellow-400 text-slate-900 shadow-md p-4 flex items-center justify-center z-10 shrink-0">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <MapIcon size={20} />
          The Golden Goat Journey
        </h1>
      </header>

      {/* חלונית השווצה לגביע חדש */}
      {trophyModal && (
        <div className="fixed inset-0 bg-black/80 z-[700] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center relative animate-in zoom-in-95 duration-500 delay-100">
            <button
              onClick={() => setTrophyModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-200 animate-bounce">
              <Trophy size={48} className="text-slate-900" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              גביע חדש נפתח!
            </h2>
            <h3 className="text-lg font-bold text-yellow-500 mb-2">
              {trophyModal.title}
            </h3>
            <p className="text-slate-500 mb-8">{trophyModal.desc}</p>

            <button
              onClick={() => shareTrophy(trophyModal, stats.progress)}
              className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 text-lg"
            >
              {isCopied ? <Check size={24} /> : <Share2 size={24} />}
              {isCopied ? "הועתק ללוח!" : "שתף"}
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* אזור תוכן ראשי שמנהל גלילה נפרדת לכל טאב */}
      <main className="flex-1 relative overflow-hidden bg-gray-50">
        {/* MAP VIEW */}
        <div
          className={`w-full h-full absolute inset-0 ${
            activeTab === "map"
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none -z-10"
          }`}
        >
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          {selectedStation && (
            <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 p-5 flex justify-between items-start text-white shrink-0">
                  <div>
                    <h3 className="font-bold text-lg text-yellow-400 leading-tight">
                      {selectedStation.name}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin size={12} />{" "}
                      {selectedStation.address
                        ? `${selectedStation.address}, `
                        : ""}
                      {selectedStation.city}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="p-1 hover:bg-slate-800 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto text-center bg-slate-50">
                  {/* Action Buttons Row: Golden Goat AI & Waze */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Right Button (RTL First): Golden Goat AI */}
                    <div className="flex flex-col items-center justify-end">
                      <span className="text-[8px] font-black uppercase text-yellow-600 mb-1.5 text-center leading-tight tracking-widest">
                        The Knowledge Of
                        <br />
                        The Golden Goat
                      </span>
                      <button
                        onClick={() =>
                          fetchStationTrivia(
                            selectedStation.city,
                            selectedStation.id
                          )
                        }
                        className="w-full h-14 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl flex items-center justify-center shadow-md shadow-yellow-200 active:scale-95 transition-all"
                      >
                        {isAiLoading[selectedStation.id] === "trivia" ? (
                          <Loader2
                            size={24}
                            className="animate-spin text-white"
                          />
                        ) : (
                          <span className="text-2xl drop-shadow-sm">🐐</span>
                        )}
                      </button>
                    </div>

                    {/* Left Button (RTL Second): Waze */}
                    <div className="flex flex-col items-center justify-end">
                      <span className="text-[8px] font-black uppercase text-blue-500 mb-1.5 text-center leading-tight tracking-widest">
                        Navigate With
                        <br />
                        Waze
                      </span>
                      <a
                        href={`https://www.waze.com/ul?ll=${selectedStation.lat},${selectedStation.lon}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-blue-100"
                      >
                        <Navigation
                          size={24}
                          className="text-blue-600"
                          fill="currentColor"
                        />
                      </a>
                    </div>
                  </div>

                  {/* AI Trivia Result Display */}
                  {aiTriviaCache[selectedStation.id] && (
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 text-right animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-[10px] font-black text-yellow-700 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={12} /> מורה נבוכים לעיר{" "}
                        {selectedStation.city}
                      </h4>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {aiTriviaCache[selectedStation.id]}
                      </p>
                    </div>
                  )}

                  <div className="h-px w-full bg-slate-200" />

                  {(() => {
                    const currentVisit = visits.find(
                      (v) => v.sId === selectedStation.id
                    );
                    return (
                      <div className="space-y-5 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                            {currentVisit ? "סטטוס ביקור" : "מי הגיע?"}
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {["רועי", "שנינו", "עמר"].map((name) => {
                              const isSelected = currentVisit?.who === name;
                              const Icon = name === "שנינו" ? Users : User;
                              const themeColor =
                                name === "שנינו" ? "green" : "yellow";
                              return (
                                <button
                                  key={name}
                                  onClick={() => handleVisit(name)}
                                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                                    isSelected
                                      ? `bg-${themeColor}-50 border-${themeColor}-500 shadow-sm scale-105`
                                      : "bg-white border-slate-100 active:bg-slate-50 text-slate-800 hover:border-slate-200"
                                  }`}
                                >
                                  <Icon
                                    size={24}
                                    className={
                                      isSelected
                                        ? `text-${themeColor}-600 mb-1`
                                        : "text-slate-400 mb-1"
                                    }
                                  />
                                  <span
                                    className={`text-xs ${
                                      isSelected
                                        ? "font-black text-slate-900"
                                        : "font-medium text-slate-500"
                                    }`}
                                  >
                                    {name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {currentVisit && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 pt-2 border-t border-slate-100">
                            {currentVisit.img ? (
                              <div className="space-y-4">
                                <div
                                  dir="ltr"
                                  className="relative w-full h-44 rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 group"
                                >
                                  <img
                                    src={currentVisit.img}
                                    alt="Selfie"
                                    className="w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                  />
                                  <div className="absolute top-3 left-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                                    <Check size={14} strokeWidth={4} />
                                  </div>
                                  <button
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    className="absolute bottom-3 left-3 bg-black/60 text-white p-2.5 rounded-full backdrop-blur-md active:scale-90 transition-transform flex items-center justify-center"
                                  >
                                    <Camera size={18} />
                                  </button>
                                </div>

                                {/* AI Roast Section */}
                                {isAiLoading[selectedStation.id] === "roast" ? (
                                  <div className="flex flex-col items-center justify-center py-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-600">
                                    <Loader2
                                      size={24}
                                      className="animate-spin mb-2"
                                    />
                                    <span className="text-xs font-bold">
                                      העז מנתחת את הסלפי שלכם...
                                    </span>
                                  </div>
                                ) : currentVisit.aiRoast ? (
                                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 text-right animate-in fade-in">
                                    <h4 className="text-[10px] font-black text-orange-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                                      <Sparkles size={12} /> ביקורת עז (רוסט)
                                    </h4>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed italic">
                                      "{currentVisit.aiRoast}"
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all flex flex-col items-center justify-center gap-2"
                              >
                                <Camera size={28} />
                                <span className="text-sm font-bold">
                                  הוסף סלפי הוכחה
                                </span>
                              </button>
                            )}

                            <button
                              onClick={() =>
                                shareVisit(currentVisit, selectedStation, stats)
                              }
                              className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                            >
                              {isCopied ? (
                                <Check size={18} />
                              ) : (
                                <Share2 size={18} />
                              )}
                              {isCopied ? "הועתק ללוח!" : "שתף צ'ק-אין"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STATS VIEW */}
        <div
          className={`w-full h-full absolute inset-0 overflow-y-auto pb-8 ${
            activeTab === "stats"
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none -z-10"
          }`}
        >
          <div className="p-6 space-y-6 max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                הספק ארצי
              </h2>
              <div className="text-6xl font-black text-slate-900 mb-6 drop-shadow-sm">
                {stats.progress}%
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.progress}%` }}
                ></div>
              </div>
              <p className="text-xs font-bold text-slate-500">
                בקרתם ב-{stats.visited} מתוך {stats.total} תחנות
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "רועי", val: stats.roi },
                { name: "עמר", val: stats.omer },
              ].map((user) => (
                <div
                  key={user.name}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-600 border border-slate-100">
                    <User size={24} />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {user.name}
                  </h3>
                  <p className="text-3xl font-black text-yellow-500 mt-1">
                    {user.val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TROPHIES VIEW */}
        <div
          className={`w-full h-full absolute inset-0 overflow-y-auto pb-8 ${
            activeTab === "trophies"
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none -z-10"
          }`}
        >
          <div className="p-6 max-w-md mx-auto">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase">
                trophies
              </h2>
              <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-full">
                {stats.unlockedTrophies} / {TROPHIES.length}
              </span>
            </div>
            <div className="space-y-3">
              {TROPHIES.map((t) => {
                const isUnlocked = t.check(visits);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-5 p-5 rounded-3xl border-2 transition-all ${
                      isUnlocked
                        ? "bg-white border-yellow-100 shadow-lg"
                        : "bg-slate-50 border-slate-100 opacity-60 grayscale"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`p-3 rounded-2xl ${
                          isUnlocked
                            ? "bg-yellow-400 text-slate-900"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        <Trophy size={28} />
                      </div>
                      {isUnlocked && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black text-sm uppercase">
                          {t.title}
                        </h4>
                        <span className="text-[9px] font-black uppercase text-slate-400">
                          {t.type}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 leading-tight">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* HISTORY VIEW */}
        <div
          className={`w-full h-full absolute inset-0 overflow-y-auto pb-8 ${
            activeTab === "history"
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none -z-10"
          }`}
        >
          <div className="p-6 max-w-md mx-auto relative text-right">
            <h2 className="text-2xl font-black text-slate-900 mb-8 italic uppercase">
              history
            </h2>
            {visits.length === 0 ? (
              <div className="text-center text-slate-300 py-16 flex flex-col items-center">
                <List size={64} className="mb-4 opacity-10" />
                <p className="font-bold">טרם תועדו ביקורים</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...visits]
                  .sort((a, b) => b.ts - a.ts)
                  .map((v) => {
                    const s = STATIONS.find((st) => st.id === v.sId);
                    return (
                      <div
                        key={v.id}
                        onClick={() => v.img && setViewingPhoto(v.img)}
                        className={`bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 ${
                          v.img ? "cursor-pointer active:scale-[0.98]" : ""
                        } transition-all`}
                      >
                        <div className="bg-green-50 text-green-600 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-green-100">
                          <Check size={24} strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-slate-900 text-sm tracking-tight">
                            {s?.name || "תחנה נמחקה"}
                          </h4>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-bold uppercase">
                            <span>
                              {new Date(v.ts).toLocaleDateString("he-IL")}
                            </span>
                            <span>•</span>
                            <span className="text-slate-900">{v.who}</span>
                          </div>
                        </div>
                        {v.img && (
                          <div
                            dir="ltr"
                            className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-md relative group"
                          >
                            <img
                              src={v.img}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                              style={{ transform: "scaleX(-1)" }}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Photo Modal */}
        {viewingPhoto && (
          <div className="fixed inset-0 bg-slate-950/98 z-[500] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full p-8 flex items-center justify-between z-[510]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingPhoto(null);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-xl active:scale-90 border border-white/5"
              >
                <X size={28} />
              </button>
              <div className="text-right">
                <p className="text-white text-xs font-black tracking-widest uppercase mb-1 italic">
                  GOAT PROOF
                </p>
                <div className="h-1 w-12 bg-yellow-400 rounded-full mr-auto"></div>
              </div>
            </div>
            <div
              dir="ltr"
              className="w-full max-w-sm aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/10"
            >
              <img
                src={viewingPhoto}
                alt="Full view"
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <div className="mt-12">
              <div className="flex items-center gap-3 bg-yellow-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl italic tracking-tighter">
                <Trophy size={18} fill="currentColor" /> STATUS: CONFIRMED GOAT
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Nav - Fixed bottom flush with perfect safe area and no ghost gaps */}
      <nav className="w-full bg-white border-t border-slate-100 flex justify-between items-end px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-50 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] relative">
        {[
          { id: "stats", label: "STATS", icon: BarChart3 },
          { id: "trophies", label: "trophies", icon: Trophy },
          { id: "map", label: "map", icon: MapIcon, center: true },
          { id: "history", label: "history", icon: List },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center min-w-[4rem] transition-all duration-300 ${
              item.center ? "-mt-10 pb-1 scale-110 relative z-20" : "pb-1"
            } ${activeTab === item.id ? "text-slate-900" : "text-slate-300"}`}
          >
            {item.center ? (
              <div
                className={`p-4 rounded-3xl shadow-2xl transition-all duration-500 ${
                  activeTab === "map"
                    ? "bg-yellow-400 text-slate-900 shadow-yellow-200"
                    : "bg-slate-900 text-white"
                }`}
              >
                <item.icon size={26} strokeWidth={2.5} />
              </div>
            ) : (
              <item.icon
                size={22}
                className={`${
                  activeTab === item.id ? "stroke-[3px]" : "stroke-[2px]"
                } mb-1`}
              />
            )}
            <span
              className={`text-[9px] font-black tracking-widest ${
                activeTab === item.id ? "opacity-100" : "opacity-0"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
