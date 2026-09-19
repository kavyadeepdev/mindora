import { pool, db } from "./index.js";
import { auth } from "../auth.js";
import {
  patientProfiles,
  caregiverProfiles,
  doctorProfiles,
  patientActivityPlans,
  devicePairings,
  adminAuditLogs,
} from "./schema/patients.js";
import {
  gameSessions,
  adaptiveDifficulty,
} from "./schema/games.js";
import {
  reminders,
  caregiverAlerts,
} from "./schema/care.js";
import {
  culturalMemories,
  familiarMemories,
  memoryCardItems,
  attentionPoolItems,
  patternSequences,
  performanceTrends,
} from "./schema/content.js";
import { user, session, account, verification } from "./schema/auth.js";
import { sql } from "drizzle-orm";

export async function seed() {
  console.log("🌱 Starting Mindora database reset and precision multi-cultural seed...");

  try {
    // 1. Clean out all existing records (in dependency order)
    console.log("🧹 Clearing all existing tables...");
    await db.delete(adminAuditLogs);
    await db.delete(devicePairings);
    await db.delete(patientActivityPlans);
    await db.delete(gameSessions);
    await db.delete(adaptiveDifficulty);
    await db.delete(reminders);
    await db.delete(caregiverAlerts);
    await db.delete(patientProfiles);
    await db.delete(caregiverProfiles);
    await db.delete(doctorProfiles);
    await db.delete(session);
    await db.delete(account);
    await db.delete(verification);
    await db.delete(user);
    await db.delete(culturalMemories);
    await db.delete(familiarMemories);
    await db.delete(memoryCardItems);
    await db.delete(attentionPoolItems);
    await db.delete(patternSequences);
    await db.delete(performanceTrends);
    console.log("✓ All tables cleared cleanly.");

    // Helper to create user with Better Auth credentials
    async function createUserWithAuth(name: string, email: string, password: string, role: string, status: string = "active") {
      try {
        const authUser = await auth.api.signUpEmail({
          body: {
            name,
            email,
            password,
          },
        });
        if (authUser?.user?.id) {
          await db
            .update(user)
            .set({ role, status, emailVerified: true })
            .where(sql`id = ${authUser.user.id}`);
          return authUser.user.id;
        }
      } catch (err: any) {
        console.warn(`[Seed Auth] signUpEmail notice for ${email}: ${err.message}`);
      }

      // Direct fallback if auth handler already created or offline
      const fallbackId = `usr-${email.replace(/[@.]/g, "-")}`;
      await db
        .insert(user)
        .values({
          id: fallbackId,
          name,
          email,
          emailVerified: true,
          role,
          status,
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        })
        .onConflictDoUpdate({
          target: user.email,
          set: { role, status, name },
        });
      return fallbackId;
    }

    // 2. Super Admin Account
    console.log("-> Seeding Super Admin account (admin@mindora.health)...");
    const adminUserId = await createUserWithAuth(
      "Mindora Super Admin",
      "admin@mindora.health",
      "MindoraAdmin2026!",
      "admin",
      "active"
    );

    // 3. Doctors (2 Active/Approved + 1 Pending verification)
    console.log("-> Seeding 2 verified doctors and 1 pending statutory application...");
    const docAnanyaUserId = await createUserWithAuth(
      "Dr. Ananya Mukherjee",
      "dr.ananya@mindora.health",
      "DoctorSecure123!",
      "doctor",
      "active"
    );

    const docRaghavendraUserId = await createUserWithAuth(
      "Dr. Raghavendra Rao",
      "dr.raghavendra@mindora.health",
      "DoctorSecure123!",
      "doctor",
      "active"
    );

    const docArvindUserId = await createUserWithAuth(
      "Dr. Arvind Swamy",
      "dr.arvind@mindora.health",
      "DoctorSecure123!",
      "doctor",
      "pending_approval"
    );

    await db.insert(doctorProfiles).values([
      {
        id: "doc-ananya-mukherjee",
        userId: docAnanyaUserId,
        name: "Dr. Ananya Mukherjee",
        specialty: "Neuro-Geriatrics & Cognitive Rehabilitation",
        hospital: "Apollo Multispeciality Hospitals, Kolkata",
        phone: "+91 98301 24890",
        email: "dr.ananya@mindora.health",
        medicalRegistrationNumber: "WBMC-68492",
        medicalCouncil: "West Bengal Medical Council / National Medical Commission",
        registrationYear: 2011,
        qualification: "MBBS, MD (Geriatric Medicine, AIIMS), Fellowship in Neuro-Cognitive Disorders",
        verificationStatus: "approved",
        approvedAt: new Date("2026-01-15T10:00:00Z"),
        approvedBy: "admin@mindora.health",
        linkedPatientIds: ["p-subir-banerjee", "p-bhaben-hazarika"],
      },
      {
        id: "doc-raghavendra-rao",
        userId: docRaghavendraUserId,
        name: "Dr. Raghavendra Rao",
        specialty: "Geriatric Psychiatry & Dementia Care",
        hospital: "NIMHANS & Manipal Hospital, Bengaluru",
        phone: "+91 94480 37192",
        email: "dr.raghavendra@mindora.health",
        medicalRegistrationNumber: "KMC-42918",
        medicalCouncil: "Karnataka Medical Council / National Medical Commission",
        registrationYear: 2007,
        qualification: "MBBS, MD (Psychiatry - NIMHANS), DNB",
        verificationStatus: "approved",
        approvedAt: new Date("2026-01-10T09:30:00Z"),
        approvedBy: "admin@mindora.health",
        linkedPatientIds: ["p-venkata-gowda", "p-ramesh-verma", "p-pratima-sharma"],
      },
      {
        id: "doc-arvind-swamy",
        userId: docArvindUserId,
        name: "Dr. Arvind Swamy",
        specialty: "Behavioral Neurology",
        hospital: "Fortis Healthcare, Chennai",
        phone: "+91 98401 55912",
        email: "dr.arvind@mindora.health",
        medicalRegistrationNumber: "TNMC-77401",
        medicalCouncil: "Tamil Nadu Medical Council / National Medical Commission",
        registrationYear: 2016,
        qualification: "MBBS, DM (Neurology)",
        verificationStatus: "pending_approval",
        rejectionReason: null,
        approvedAt: null,
        approvedBy: null,
        linkedPatientIds: [],
      },
    ]);

    // 4. Caretakers (3 Caretakers: two taking care of 1 each, one taking care of 3)
    console.log("-> Seeding 3 caregivers with strict patient assignments...");
    const cgDebojitUserId = await createUserWithAuth(
      "Debojit Banerjee",
      "debojit.care@mindora.health",
      "Caregiver123!",
      "caregiver",
      "active"
    );

    const cgMinotiUserId = await createUserWithAuth(
      "Minoti Hazarika",
      "minoti.care@mindora.health",
      "Caregiver123!",
      "caregiver",
      "active"
    );

    const cgSureshUserId = await createUserWithAuth(
      "Suresh Kumar",
      "suresh.care@mindora.health",
      "Caregiver123!",
      "caregiver",
      "active"
    );

    await db.insert(caregiverProfiles).values([
      {
        id: "cg-debojit-banerjee",
        userId: cgDebojitUserId,
        name: "Debojit Banerjee",
        email: "debojit.care@mindora.health",
        relation: "Son & Primary Family Caregiver",
        phone: "+91 98311 55210",
        status: "active",
        linkedPatientIds: ["p-subir-banerjee"],
      },
      {
        id: "cg-minoti-hazarika",
        userId: cgMinotiUserId,
        name: "Minoti Hazarika",
        email: "minoti.care@mindora.health",
        relation: "Daughter & Home Companion",
        phone: "+91 94350 88219",
        status: "active",
        linkedPatientIds: ["p-bhaben-hazarika"],
      },
      {
        id: "cg-suresh-kumar",
        userId: cgSureshUserId,
        name: "Suresh Kumar",
        email: "suresh.care@mindora.health",
        relation: "Senior Geriatric Care Specialist",
        phone: "+91 98801 44320",
        status: "active",
        linkedPatientIds: ["p-venkata-gowda", "p-ramesh-verma", "p-pratima-sharma"],
      },
    ]);

    // 5. Patients (5 Patients: Bengali, Assamese, Kannada, Hindi)
    console.log("-> Seeding 5 culturally localized patients segregated by doctor...");
    await db.insert(patientProfiles).values([
      {
        id: "p-subir-banerjee",
        doctorId: "doc-ananya-mukherjee",
        doctorName: "Dr. Ananya Mukherjee",
        caregiverUserId: cgDebojitUserId,
        caregiverId: "cg-debojit-banerjee",
        caregiverName: "Debojit Banerjee",
        name: "Subir Banerjee",
        age: 72,
        gender: "Male",
        location: "Salt Lake, Kolkata, West Bengal",
        language: "bn", // Bengali
        culturalTheme: "bengali-heritage",
        diagnosis: "Mild Cognitive Impairment (MCI)",
        stage: "Early Stage",
        accessStatus: "active",
        interests: ["Rabindra Sangeet", "Kolkata Tramways", "Durga Puja Dhak", "Darjeeling First Flush Tea", "Victoria Memorial"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        dailyRoutine: {
          morningWakeUp: "06:00 AM",
          morningHydration: "06:30 AM",
          morningMeds: "08:00 AM",
          breakfast: "08:30 AM",
          morningWalk: "09:30 AM",
          eveningTea: "04:30 PM",
          nightSleep: "09:30 PM",
        },
        accessibility: { largeText: true, highContrast: false, reduceMotion: false, audioFeedback: true },
      },
      {
        id: "p-bhaben-hazarika",
        doctorId: "doc-ananya-mukherjee",
        doctorName: "Dr. Ananya Mukherjee",
        caregiverUserId: cgMinotiUserId,
        caregiverId: "cg-minoti-hazarika",
        caregiverName: "Minoti Hazarika",
        name: "Bhaben Hazarika",
        age: 74,
        gender: "Male",
        location: "Guwahati, Assam",
        language: "as", // Assamese
        culturalTheme: "assam-brahmaputra",
        diagnosis: "Mild Cognitive Impairment (MCI)",
        stage: "Early Stage",
        accessStatus: "active",
        interests: ["Bihu Folk Songs", "Kaziranga Forest Walk", "Muga Silk Weaving", "Brahmaputra Ferry", "Assam Orthodox Tea"],
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        dailyRoutine: {
          morningWakeUp: "05:45 AM",
          morningHydration: "06:15 AM",
          morningMeds: "07:30 AM",
          breakfast: "08:00 AM",
          morningWalk: "09:00 AM",
          eveningTea: "04:00 PM",
          nightSleep: "09:00 PM",
        },
        accessibility: { largeText: true, highContrast: false, reduceMotion: false, audioFeedback: true },
      },
      {
        id: "p-venkata-gowda",
        doctorId: "doc-raghavendra-rao",
        doctorName: "Dr. Raghavendra Rao",
        caregiverUserId: cgSureshUserId,
        caregiverId: "cg-suresh-kumar",
        caregiverName: "Suresh Kumar",
        name: "Venkatasubbaiah Gowda",
        age: 78,
        gender: "Male",
        location: "Malleshwaram, Bengaluru, Karnataka",
        language: "kn", // Kannada
        culturalTheme: "kannada-heritage",
        diagnosis: "Mild Alzheimer's Disease",
        stage: "Mild Stage",
        accessStatus: "active",
        interests: ["Mysore Dasara Elephant Procession", "Carnatic Veena Melodies", "Hampi Stone Chariot", "Filter Coffee & Idli", "Lalbagh Flower Show"],
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        dailyRoutine: {
          morningWakeUp: "06:00 AM",
          morningHydration: "06:30 AM",
          morningMeds: "08:00 AM",
          breakfast: "08:45 AM",
          morningWalk: "09:30 AM",
          eveningTea: "04:30 PM",
          nightSleep: "09:30 PM",
        },
        accessibility: { largeText: true, highContrast: true, reduceMotion: false, audioFeedback: true },
      },
      {
        id: "p-ramesh-verma",
        doctorId: "doc-raghavendra-rao",
        doctorName: "Dr. Raghavendra Rao",
        caregiverUserId: cgSureshUserId,
        caregiverId: "cg-suresh-kumar",
        caregiverName: "Suresh Kumar",
        name: "Ramesh Chandra Verma",
        age: 76,
        gender: "Male",
        location: "Varanasi, Uttar Pradesh",
        language: "hi", // Hindi
        culturalTheme: "hindi-gangetic",
        diagnosis: "Early-Stage Vascular Dementia",
        stage: "Early Stage",
        accessStatus: "active",
        interests: ["Ganga Aarti at Dashashwamedh Ghat", "Bismillah Khan Shehnai", "Banarasi Paan & Chai", "Morning Bhajan", "Sarnath Stupa"],
        avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        dailyRoutine: {
          morningWakeUp: "05:30 AM",
          morningHydration: "06:00 AM",
          morningMeds: "07:30 AM",
          breakfast: "08:30 AM",
          morningWalk: "09:00 AM",
          eveningTea: "04:30 PM",
          nightSleep: "09:30 PM",
        },
        accessibility: { largeText: false, highContrast: false, reduceMotion: false, audioFeedback: true },
      },
      {
        id: "p-pratima-sharma",
        doctorId: "doc-raghavendra-rao",
        doctorName: "Dr. Raghavendra Rao",
        caregiverUserId: cgSureshUserId,
        caregiverId: "cg-suresh-kumar",
        caregiverName: "Suresh Kumar",
        name: "Pratima Devi Sharma",
        age: 71,
        gender: "Female",
        location: "Chittaranjan Park, New Delhi",
        language: "hi", // Hindi
        culturalTheme: "hindi-gangetic",
        diagnosis: "Mild Cognitive Impairment (Amnestic)",
        stage: "Mild Stage",
        accessStatus: "active",
        interests: ["Classical Sitar", "Tulsi Ramayana Verses", "Morning Garden Walk", "Folk Geets", "Heritage Sweets"],
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        dailyRoutine: {
          morningWakeUp: "06:15 AM",
          morningHydration: "06:45 AM",
          morningMeds: "08:15 AM",
          breakfast: "09:00 AM",
          morningWalk: "09:45 AM",
          eveningTea: "05:00 PM",
          nightSleep: "10:00 PM",
        },
        accessibility: { largeText: true, highContrast: false, reduceMotion: true, audioFeedback: true },
      },
    ]);

    // 6. Admin Audit Logs
    console.log("-> Seeding initial admin audit trail...");
    await db.insert(adminAuditLogs).values([
      {
        id: "log-001",
        actionType: "doctor_approval",
        actorEmail: "admin@mindora.health",
        actorRole: "super_admin",
        targetId: "doc-ananya-mukherjee",
        targetName: "Dr. Ananya Mukherjee",
        details: "Statutory medical credentials WBMC-68492 verified with West Bengal Medical Council database.",
        timestamp: new Date("2026-01-15T10:00:00Z"),
      },
      {
        id: "log-002",
        actionType: "doctor_approval",
        actorEmail: "admin@mindora.health",
        actorRole: "super_admin",
        targetId: "doc-raghavendra-rao",
        targetName: "Dr. Raghavendra Rao",
        details: "Karnataka Medical Council license KMC-42918 verified. Granted clinical authority.",
        timestamp: new Date("2026-01-10T09:30:00Z"),
      },
      {
        id: "log-003",
        actionType: "caregiver_assigned",
        actorEmail: "dr.ananya@mindora.health",
        actorRole: "doctor",
        targetId: "p-subir-banerjee",
        targetName: "Subir Banerjee",
        details: "Assigned Debojit Banerjee as primary family caregiver.",
        timestamp: new Date("2026-01-16T11:00:00Z"),
      },
      {
        id: "log-004",
        actionType: "caregiver_assigned",
        actorEmail: "dr.raghavendra@mindora.health",
        actorRole: "doctor",
        targetId: "p-venkata-gowda",
        targetName: "Venkatasubbaiah Gowda",
        details: "Assigned senior caregiver Suresh Kumar for 3-patient clinical cohort management.",
        timestamp: new Date("2026-01-17T14:30:00Z"),
      },
      {
        id: "log-005",
        actionType: "patient_signin_approved",
        actorEmail: "admin@mindora.health",
        actorRole: "super_admin",
        targetId: "p-bhaben-hazarika",
        targetName: "Bhaben Hazarika",
        details: "Device pairing token MND-842 approved for zero-password living room tablet.",
        timestamp: new Date("2026-01-18T08:00:00Z"),
      },
    ]);

    // 7. Culturally Diverse Familiar Memories (Bengali, Assamese, Kannada, Hindi)
    console.log("-> Seeding multi-cultural familiar memories (Bengali, Assamese, Kannada, Hindi)...");
    await db.insert(familiarMemories).values([
      // Bengali
      {
        id: "mem-bn-01",
        title: "Victoria Memorial & Maidan Tramways",
        titleBengali: "ভিক্টোরিয়া মেমোরিয়াল ও ট্রাম ভ্রমণ",
        titleAssamese: "ভিক্টোৰিয়া মেম’ৰিয়েল আৰু ট্ৰাম যাত্ৰা",
        titleKannada: "ವಿಕ್ಟೋರಿಯಾ ಸ್ಮಾರಕ ಮತ್ತು ಟ್ರಾಮ್ ಸವಾರಿ",
        titleHindi: "विक्टोरिया मेमोरियल और ट्राम की यात्रा",
        location: "Kolkata, West Bengal",
        emoji: "🏛️",
        story: "Riding the gentle wooden tram along the green Maidan, feeling the cool breeze of the morning and stopping for a hot cup of Darjeeling tea in a clay bhar.",
        storyBengali: "ময়দানের সবুজ ঘাসের পাশ দিয়ে শান্ত ট্রামে চড়া, মিষ্টি সকালের বাতাস অনুভব করা এবং মাটির ভাঁড়ে গরম দার্জিলিং চা পান করা।",
        storyAssamese: "ময়দানৰ সেউজীয়া কাষেৰে লাহে লাহে যোৱা ট্ৰামৰ যাত্ৰা, শীতল বতাহ আৰু মাটিৰ কাপত গৰম চাহৰ সোৱাদ।",
        storyKannada: "ಹಸಿರು ಮೈದಾನದ ಪಕ್ಕದಲ್ಲಿ ನಿಧಾನವಾಗಿ ಚಲಿಸುವ ಮರದ ಟ್ರಾಮ್, ತಂಪಾದ ಬೆಳಗಿನ ಗಾಳಿ ಮತ್ತು ಮಣ್ಣಿನ ಪಾತ್ರೆಯಲ್ಲಿ ಬಿಸಿ ಚಹಾ.",
        storyHindi: "मैदान की हरी घास के पास से गुजरती ट्राम, सुबह की ठंडी हवा और मिट्टी के कुल्हड़ में गर्म दार्जिलिंग चाय की चुस्की।",
        tags: ["Bengali", "Kolkata", "Maidan", "Tram", "Heritage"],
      },
      {
        id: "mem-bn-02",
        title: "Rabindra Sangeet by the Hooghly",
        titleBengali: "হুগলী নদীর তীরে রবীন্দ্রসঙ্গীত",
        titleAssamese: "হুগলী নদীৰ পাৰত ৰবীন্দ্ৰ সংগীত",
        titleKannada: "ಹೂಗ್ಲಿ ನದಿಯ ದಂಡೆಯಲ್ಲಿ ರವೀಂದ್ರ ಸಂಗೀತ",
        titleHindi: "हुगली नदी के किनारे रवींद्र संगीत",
        location: "Princep Ghat, Kolkata",
        emoji: "🎶",
        story: "Sitting on the steps of Princep Ghat as the twilight fades, listening to gentle strains of Rabindra Sangeet across the rippling waters.",
        storyBengali: "প্রিন্সেপ ঘাটের সিঁড়িতে বসে গোধূলিলগ্নে নদীর শান্ত ঢেউয়ের মাঝে সুরের মূর্ছনা উপভোগ করা।",
        storyAssamese: "নদীৰ ঘাটৰ খটখটিত বহি সন্ধিয়াৰ শান্ত পানীৰ ঢৌৰ মাজত ৰবীন্দ্ৰ সংগীতৰ সুৰ শুনাৰ আনন্দ।",
        storyKannada: "ಸಂಜೆಯ ಹೊತ್ತಿನಲ್ಲಿ ನದಿಯ ಮೆಟ್ಟಿಲುಗಳ ಮೇಲೆ ಕುಳಿತು ಶಾಂತ ತರಂಗಗಳ ನಡುವೆ ಸುಮಧುರ ರವೀಂದ್ರ ಸಂಗೀತವನ್ನು ಆಲಿಸುವುದು.",
        storyHindi: "प्रिंसप घाट की सीढ़ियों पर बैठकर शाम की ठंडी लहरों के बीच मधुर रवींद्र संगीत की धुनें सुनना।",
        tags: ["Bengali", "Music", "Princep Ghat", "Rabindranath", "Peaceful"],
      },
      // Assamese
      {
        id: "mem-as-01",
        title: "Rongali Bihu Rhythm & Dhol-Pepa",
        titleBengali: "রঙালী বিহু ও ঢোল-পেঁপার সুর",
        titleAssamese: "ৰঙালী বিহু আৰু ঢোল-পেঁপাৰ সুৰ",
        titleKannada: "ರಂಗಾಲಿ ಬಿಹು ಮತ್ತು ಡೋಲು-ಪೇಪಾ ವಾದನ",
        titleHindi: "रंगाली बिहू और ढोल-पेपा की धुन",
        location: "Brahmaputra Valley, Assam",
        emoji: "🪕",
        story: "The joyful rhythm of the wooden dhol and buffalo horn pepa echoing across the courtyard under blooming Kopou orchids in springtime.",
        storyBengali: "বসন্তে কোপৌ ফুলের গন্ধের সাথে উঠোনে কাঠের ঢোল এবং মোষের শিংয়ের পেঁপার আনন্দময় সুর।",
        storyAssamese: "বসন্তৰ বতাহত কপৌ ফুলৰ সুবাসৰ সৈতে চোতালত বাজি উঠা বিহু ঢোল আৰু ম’হৰ শিঙৰ পেঁপাৰ আনন্দময় মাত।",
        storyKannada: "ವಸಂತ ಋತುವಿನಲ್ಲಿ ಸುಂದರವಾದ ಆರ್ಕಿಡ್ ಹೂವುಗಳ ನಡುವೆ ಮೊಳಗುವ ಸಾಂಪ್ರದಾಯಿಕ ಬಿಹು ಡೋಲು ಮತ್ತು ಕೊಂಬಿನ ವಾದ್ಯದ ನಿನಾದ.",
        storyHindi: "वसंत ऋतु में कोपौ फूलों की महक के साथ आंगन में गूंजती बिहू ढोल और सींग की पेपा की मधुर तान।",
        tags: ["Assamese", "Bihu", "Folk", "Spring", "Celebration"],
      },
      {
        id: "mem-as-02",
        title: "Golden Muga Silk of Sualkuchi",
        titleBengali: "শুয়ালকুচির সোনালী মুগা সিল্ক",
        titleAssamese: "শুৱালকুছিৰ সোণালী মুগা কাপোৰ",
        titleKannada: "ಸುವಾಲ್ಕುಚಿಯ ಚಿನ್ನದ ಮೂಗಾ ರೇಷ್ಮೆ",
        titleHindi: "सुआलकुची का सुनहरा मूंगा सिल्क",
        location: "Sualkuchi, Assam",
        emoji: "✨",
        story: "The gentle rhythmic clacking of wooden looms weaving the lustrous golden Muga silk that shines brighter with every wash.",
        storyBengali: "কাঠের তাঁতে বোনা সোনালী মুগা সিল্কের মৃদু ছন্দময় শব্দ যা প্রতিটি ধোয়ার সাথে আরও উজ্জ্বল হয়ে ওঠে।",
        storyAssamese: "তাঁতশালৰ খটখট শব্দ আৰু অসমৰ গৌৰৱোজ্জ্বল সোণালী মুগা সুতাৰ অপূৰ্ব কাপোৰ বোৱাৰ চিনাকি অনুভৱ।",
        storyKannada: "ಪ್ರತಿ ತೊಳೆಯುವಿಕೆಯೊಂದಿಗೆ ಮತ್ತಷ್ಟು ಹೊಳೆಯುವ ಚಿನ್ನದ ಬಣ್ಣದ ಮೂಗಾ ರೇಷ್ಮೆಯನ್ನು ನೇಯ್ಯುವ ಮರದ ಮಗ್ಗದ ಲಯಬದ್ಧ ಸದ್ದು.",
        storyHindi: "लकड़ी के करघे की जानी-पहचानी खटखट और असम का गौरवशाली सुनहरा मूंगा रेशम।",
        tags: ["Assamese", "Craft", "Silk", "Heritage", "Tradition"],
      },
      // Kannada
      {
        id: "mem-kn-01",
        title: "Mysore Palace Dasara Illumination",
        titleBengali: "মহীশূর প্রাসাদের দশেরা আলোকসজ্জা",
        titleAssamese: "মহীশূৰ প্ৰাসাদৰ দশহৰাৰ আলোকসজ্জা",
        titleKannada: "ಮೈಸೂರು ಅರಮನೆ ಮತ್ತು ದಸರಾ ವೈಭವ",
        titleHindi: "मैसूर महल की जगमगाती दशहरा रोशनी",
        location: "Mysore, Karnataka",
        emoji: "👑",
        story: "One hundred thousand golden bulbs lighting up the majestic Mysore Palace as the decorated royal elephant carries the golden howdah in festive procession.",
        storyBengali: "উৎসবের দিনে সজ্জিত রাজকীয় হাতির পিঠে সোনার হাওদা এবং এক লক্ষ সোনালী আলোর মালায় সজ্জিত মহীশূর প্রাসাদ।",
        storyAssamese: "দহহেৰাৰ শুভ দিনত সোণৰ আম্বাৰী কঢ়িওৱা ৰাজকীয় হাতী আৰু হাজাৰ হাজাৰ সোণালী চাকিৰে উজলি উঠা মহীশূৰ প্ৰাসাদ।",
        storyKannada: "ಲಕ್ಷ ದೀಪಗಳಿಂದ ಕಂಗೊಳಿಸುವ ಭವ್ಯ ಮೈಸೂರು ಅರಮನೆ ಮತ್ತು ಚಿನ್ನದ ಅಂಬಾರಿಯನ್ನು ಹೊತ್ತ ರಾಜಗಾಂಭೀರ್ಯದ ಆನೆಯ ವೈಭವಯುತ ಮೆರವಣಿಗೆ.",
        storyHindi: "दशहरा के पावन अवसर पर एक लाख दीपों से जगमगाता भव्य मैसूर महल और स्वर्ण हौदा लिए शाही गजराज की शोभायात्रा।",
        tags: ["Kannada", "Mysore", "Dasara", "Royalty", "Tradition"],
      },
      {
        id: "mem-kn-02",
        title: "Morning Filter Coffee in Malleshwaram",
        titleBengali: "মল্লেশ্বরমের সকালের গরম ফিল্টার কফি",
        titleAssamese: "মল্লেশ্বৰমৰ পুৱাৰ ফিল্টাৰ কফি",
        titleKannada: "ಮಲ್ಲೇಶ್ವರಂನ ಬಿಸಿ ಫಿಲ್ಟರ್ ಕಾಫಿ",
        titleHindi: "मल्लेश्वरम की खुशबूदार सुबह की फ़िल्टर कॉफ़ी",
        location: "Bengaluru, Karnataka",
        emoji: "☕",
        story: "The rich, comforting aroma of freshly brewed chicory-infused filter coffee poured back and forth in a brass dabarah set on a dewy morning.",
        storyBengali: "পিতলের ডাবরা-সেটে ফেনা তোলা তাজা ফিল্টার কফির মনমাতানো সুবাস।",
        storyAssamese: "পুৱাৰ শীতল বতাহত কাঁহৰ বাটিত ঢালি দিয়া সোৱাদভৰা ফিল্টাৰ কফিৰ সুগন্ধ।",
        storyKannada: "ಮುಂಜಾನೆಯ ತಂಪಿನಲ್ಲಿ ಹಿತ್ತಾಳೆಯ ಲೋಟ-ಡಬರಾದಲ್ಲಿ ನೊರೆ ತುಂಬಿ ಬರುವ ಘಮಘಮಿಸುವ ಸಾಂಪ್ರದಾಯಿಕ ಫಿಲ್ಟರ್ ಕಾಫಿಯ ಅನುಭವ.",
        storyHindi: "सुबह की ओस भरी ठंड में पीतल के पात्र में झागदार ताज़ा पारंपरिक फ़िल्टर कॉफ़ी की दिलकश खुशबू।",
        tags: ["Kannada", "Bengaluru", "Coffee", "Morning", "Comfort"],
      },
      // Hindi
      {
        id: "mem-hi-01",
        title: "Varanasi Evening Ganga Aarti",
        titleBengali: "বারাণসীর সন্ধ্যার গঙ্গা আরতি",
        titleAssamese: "বাৰাণসীৰ সন্ধিয়াৰ গংগা আৰতি",
        titleKannada: "ವಾರಣಾಸಿಯ ಸಂಜೆಯ ಗಂಗಾ ಆರತಿ",
        titleHindi: "वाराणसी के दशाश्वमेध घाट पर गंगा आरती",
        location: "Dashashwamedh Ghat, Varanasi",
        emoji: "🪔",
        story: "The deep chime of brass temple bells, glowing tiered brass lamps raised toward the evening sky, and floral diyas gently floating down mother Ganga.",
        storyBengali: "মন্দিরের কাঁসর-ঘণ্টার ধ্বনি, প্রদীপের স্নিগ্ধ আলো এবং গঙ্গাবক্ষে ভেসে যাওয়া ফুলের প্রদীপ।",
        storyAssamese: "মন্দিৰৰ ঘণ্টাৰ গুৰু-গম্ভীৰ ধ্বনি, আকাশলৈ তুলি ধৰা আৰতিৰ শিখা আৰু গংগাৰ পানীত উটি যোৱা ফুলৰ চাকি।",
        storyKannada: "ದೇವಸ್ಥಾನದ ಘಂಟಾನಾದ, ಆಕಾಶದೆಡೆಗೆ ಎತ್ತಿ ಹಿಡಿಯಲಾದ ಮಹಾಮಂಗಳಾರತಿ ಮತ್ತು ಗಂಗೆಯ ನೀರಿನಲ್ಲಿ ತೇಲುವ ಹೂವಿನ ಹಣತೆಗಳು.",
        storyHindi: "मंदिर के घंटों की पावन गूंज, आकाश की ओर उठते भव्य पीतल के दीप और गंगा मैया की शांत लहरों पर तैरते फूलों के दीये।",
        tags: ["Hindi", "Varanasi", "Ganga", "Spiritual", "Peace"],
      },
      {
        id: "mem-hi-02",
        title: "Ustad Bismillah Khan's Shehnai",
        titleBengali: "ওস্তাদ বিসমিল্লাহ খানের প্রভাতী সানাই",
        titleAssamese: "ওস্তাদ বিছমিল্লা খানৰ পুৱাৰ সানাই",
        titleKannada: "ಉಸ್ತಾದ್ ಬಿಸ್ಮಿಲ್ಲಾ ಖಾನ್ ಅವರ ಮುಂಜಾನೆಯ ಶಹನಾಯಿ",
        titleHindi: "उस्ताद बिस्मिल्लाह खान की मंगल शहनाई",
        location: "Kashi Vishwanath, Varanasi",
        emoji: "🎺",
        story: "The soaring, sweet notes of the morning Shehnai playing Raag Bhairav, echoing along the riverbank and welcoming the day with grace and devotion.",
        storyBengali: "ভোরের শান্ত লগ্নে ভৈরব রাগে বেজে ওঠা সানাইয়ের সুর যা হৃদয়কে গভীর শান্তিতে ভরিয়ে তোলে।",
        storyAssamese: "ৰাগ ভৈৰৱৰ পুৱাৰ সানাইৰ অমৃতময় সুৰ যিয়ে পুৱাৰ আকাশক এক অনন্য শান্তিময় অনুভৱ দিয়ে।",
        storyKannada: "ಮುಂಜಾನೆಯ ರಾಗ ಭೈರವಿಯ ಸುಮಧುರ ಶಹನಾಯಿ ನಾದವು ನದಿಯ ತೀರದಲ್ಲಿ ಪ್ರತಿಧ್ವನಿಸುತ್ತಾ ದಿನವನ್ನು ಪಾವನಗೊಳಿಸುವುದು.",
        storyHindi: "राग भैरव में गूंजती शहनाई की पावन और मधुर तान जो सुबह की किरण के साथ मन को अलौकিক शांति से भर देती है।",
        tags: ["Hindi", "Music", "Shehnai", "Classical", "Morning"],
      },
    ]);

    // 8. Clinical Daily Reminders for Patients
    console.log("-> Seeding multi-cultural clinical reminders...");
    await db.insert(reminders).values([
      // Subir Banerjee (Bengali)
      {
        id: "rem-subir-01",
        patientId: "p-subir-banerjee",
        type: "hydration",
        title: "Morning Warm Water & Tulsi",
        titleBengali: "সকালের কুসুম কুসুম গরম জল ও তুলসী",
        titleAssamese: "পুৱাৰ কুহুমীয়া পানী আৰু তুলসী",
        titleKannada: "ಬೆಳಗಿನ ಬೆಚ್ಚಗಿನ ನೀರು ಮತ್ತು ತುಳಸಿ",
        titleHindi: "सुबह का गुनगुना पानी और तुलसी",
        time: "07:00 AM",
        status: "completed",
        notes: "Take 1 glass of lukewarm water before morning walk.",
      },
      {
        id: "rem-subir-02",
        patientId: "p-subir-banerjee",
        type: "medicine",
        title: "Morning Cognitive Neuro-Care Tablet",
        titleBengali: "সকালের স্মৃতিকল্যাণ ওষুধ",
        titleAssamese: "পুৱাৰ স্মৃতিবৰ্ধক ঔষধ",
        titleKannada: "ಬೆಳಗಿನ ನರ-ಆರೋಗ್ಯ ಔಷಧ",
        titleHindi: "सुबह की स्मृति सुरक्षा दवा",
        time: "08:00 AM",
        status: "completed",
        notes: "Prescribed by Dr. Ananya Mukherjee after light breakfast.",
      },
      {
        id: "rem-subir-03",
        patientId: "p-subir-banerjee",
        type: "activity",
        title: "10-Minute Bengali Familiar Memories Match",
        titleBengali: "১০ মিনিটের পরিচিত স্মৃতি মেলানো খেলা",
        titleAssamese: "১০ মিনিটৰ স্মৃতি খেল",
        titleKannada: "೧೦ ನಿಮಿಷದ ನೆನಪಿನ ಆಟ",
        titleHindi: "१० मिनट का स्मृति खेल",
        time: "10:30 AM",
        status: "pending",
        notes: "Gentle Level 2 memory cards on the tablet.",
      },
      // Bhaben Hazarika (Assamese)
      {
        id: "rem-bhaben-01",
        patientId: "p-bhaben-hazarika",
        type: "hydration",
        title: "Morning Lemon & Honey Water",
        titleBengali: "লেবু ও মধুর জল",
        titleAssamese: "পুৱাৰ নেমু আৰু মৌৰ পানী",
        titleKannada: "ಬೆಳಗಿನ ನಿಂಬೆ ಮತ್ತು ಜೇನುತುಪ್ಪದ ನೀರು",
        titleHindi: "सुबह का नींबू और शहद का पानी",
        time: "06:30 AM",
        status: "completed",
        notes: "Gentle hydration before garden walk.",
      },
      {
        id: "rem-bhaben-02",
        patientId: "p-bhaben-hazarika",
        type: "activity",
        title: "Bihu Rhythms Attention Challenge",
        titleBengali: "বিহু সুরের মনোযোগ বৃদ্ধির খেলা",
        titleAssamese: "বিহুৰ সুৰৰ মনোযোগ অনুশীলন",
        titleKannada: "ಬಿಹು ರಿದಮ್ಸ್ ಗಮನ ಸವಾಲು",
        titleHindi: "बिहू संगीत ध्यान अभ्यास",
        time: "11:00 AM",
        status: "pending",
        notes: "Find the matching instrument emoji.",
      },
      // Venkatasubbaiah Gowda (Kannada)
      {
        id: "rem-venkata-01",
        patientId: "p-venkata-gowda",
        type: "medicine",
        title: "Morning Blood Pressure & Memory Support",
        titleBengali: "রক্তচাপ ও স্মৃতি সহায়ক ওষুধ",
        titleAssamese: "ৰক্তচাপ আৰু স্মৃতিৰ ঔষধ",
        titleKannada: "ಬೆಳಗಿನ ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಸ್ಮರಣಶಕ್ತಿ ಔಷಧ",
        titleHindi: "सुबह की रक्तचाप और स्मृति दवा",
        time: "08:15 AM",
        status: "completed",
        notes: "Prescribed by Dr. Raghavendra Rao.",
      },
      {
        id: "rem-venkata-02",
        patientId: "p-venkata-gowda",
        type: "activity",
        title: "Carnatic Melody Pattern Sequencing",
        titleBengali: "সঙ্গীতের স্বরলিপি মেলানো খেলা",
        titleAssamese: "সংগীতৰ স্বৰলিপি অনুক্ৰম",
        titleKannada: "ಶಾಸ್ತ್ರೀಯ ಸಂಗೀತ ಶ್ರೇಣಿ ವಿನ್ಯಾಸ ಆಟ",
        titleHindi: "संगीत स्वर क्रमबद्धता अभ्यास",
        time: "04:00 PM",
        status: "pending",
        notes: "Pattern recognition with classical musical instruments.",
      },
      // Ramesh Chandra Verma (Hindi)
      {
        id: "rem-ramesh-01",
        patientId: "p-ramesh-verma",
        type: "hydration",
        title: "Morning Copper Vessel Water",
        titleBengali: "তামার পাত্রের জল",
        titleAssamese: "তামৰ পাত্ৰৰ পানী",
        titleKannada: "ತಾಮ್ರದ ಪಾತ್ರೆಯ ನೀರು",
        titleHindi: "सुबह का तांबे के बर्तन का पानी",
        time: "06:00 AM",
        status: "completed",
        notes: "Gentle morning routine for hydration.",
      },
      {
        id: "rem-ramesh-02",
        patientId: "p-ramesh-verma",
        type: "activity",
        title: "Varanasi Ghats Daily Recall Activity",
        titleBengali: "বারাণসীর ঘাট স্মরণ কার্যকলাপ",
        titleAssamese: "ঘাটৰ স্মৃতি অনুশীলন",
        titleKannada: "ಘಾಟ್‌ಗಳ ದೈನಂದಿನ ನೆನಪಿನ ಆಟ",
        titleHindi: "दशाश्वमेध घाट स्मृति अभ्यास",
        time: "10:00 AM",
        status: "pending",
        notes: "Engage with familiar sensory memory prompts.",
      },
      // Pratima Devi Sharma (Hindi)
      {
        id: "rem-pratima-01",
        patientId: "p-pratima-sharma",
        type: "medicine",
        title: "Daily Neuro-Protective Vitamin & Calcium",
        titleBengali: "দৈনিক ভিটামিন ও ক্যালসিয়াম",
        titleAssamese: "দৈনিক ভিটামিন আৰু কেলচিয়াম",
        titleKannada: "ದೈನಂದಿನ ಜೀವಸತ್ವ ಮತ್ತು ಕ್ಯಾಲ್ಸಿಯಂ",
        titleHindi: "दैनिक न्यूरो-विटामिन और कैल्शियम",
        time: "08:30 AM",
        status: "completed",
        notes: "Take with breakfast.",
      },
      {
        id: "rem-pratima-02",
        patientId: "p-pratima-sharma",
        type: "activity",
        title: "Afternoon Visual Recognition",
        titleBengali: "দুপুরের দৃশ্য মেলানোর খেলা",
        titleAssamese: "দুপৰীয়াৰ দৃশ্য চিনাক্তকৰণ",
        titleKannada: "ಮಧ್ಯಾಹ್ನದ ದೃಶ್ಯ ಗುರುತಿಸುವ ಆಟ",
        titleHindi: "दोपहर का दृश्य पहचान अभ्यास",
        time: "03:30 PM",
        status: "pending",
        notes: "3 gentle rounds on tablet.",
      },
    ]);

    // 9. Activity Plans prescribed by Doctors
    console.log("-> Seeding doctor-prescribed activity plans...");
    await db.insert(patientActivityPlans).values([
      {
        id: "plan-subir",
        patientId: "p-subir-banerjee",
        prescribedByDoctorId: "doc-ananya-mukherjee",
        doctorName: "Dr. Ananya Mukherjee",
        lastUpdated: "2026-01-20",
        clinicalGoal: "Strengthen working memory and visual recall through culturally familiar Kolkata anchors.",
        activities: [
          { gameType: "memory", title: "Bengali Heritage Memory Match", enabled: true, order: 1, rounds: 4, targetFocus: "Visual Recall", doctorNotes: "Use familiar cultural cards." },
          { gameType: "attention", title: "Selective Attention Focus", enabled: true, order: 2, rounds: 3, targetFocus: "Selective Attention" },
          { gameType: "pattern", title: "Sequential Association", enabled: true, order: 3, rounds: 3, targetFocus: "Sequencing" },
          { gameType: "routine", title: "Daily Morning Routine Recall", enabled: true, order: 4, rounds: 2, targetFocus: "Procedural Memory" },
        ],
      },
      {
        id: "plan-venkata",
        patientId: "p-venkata-gowda",
        prescribedByDoctorId: "doc-raghavendra-rao",
        doctorName: "Dr. Raghavendra Rao",
        lastUpdated: "2026-01-22",
        clinicalGoal: "Mitigate anxiety and preserve cognitive orientation via Carnatic musical structures.",
        activities: [
          { gameType: "memory", title: "Mysore Heritage Memory Cards", enabled: true, order: 1, rounds: 3, targetFocus: "Episodic Memory", doctorNotes: "Short unhurried sessions." },
          { gameType: "pattern", title: "Classical Music Sequences", enabled: true, order: 2, rounds: 3, targetFocus: "Working Memory" },
          { gameType: "routine", title: "Daily Pacing Routine", enabled: true, order: 3, rounds: 2, targetFocus: "Temporal Orientation" },
        ],
      },
    ]);

    // 10. Realistic Cognitive Game Sessions for ML and Graphs
    console.log("-> Seeding calibrated game sessions for telemetry and ML analysis...");
    const sampleSessions = [
      { id: "sess-01", patientId: "p-subir-banerjee", gameType: "memory", gameTitle: "Memory Match", score: 85, accuracy: 88.0, responseTime: 3.8, attempts: 6, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), dateFormatted: "4 days ago", completed: true, synced: true },
      { id: "sess-02", patientId: "p-subir-banerjee", gameType: "attention", gameTitle: "Attention Challenge", score: 90, accuracy: 92.0, responseTime: 3.2, attempts: 8, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), dateFormatted: "3 days ago", completed: true, synced: true },
      { id: "sess-03", patientId: "p-subir-banerjee", gameType: "pattern", gameTitle: "Pattern Sequencing", score: 80, accuracy: 84.0, responseTime: 4.1, attempts: 5, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), dateFormatted: "2 days ago", completed: true, synced: true },
      { id: "sess-04", patientId: "p-subir-banerjee", gameType: "memory", gameTitle: "Memory Match", score: 95, accuracy: 94.0, responseTime: 3.0, attempts: 5, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), dateFormatted: "Yesterday", completed: true, synced: true },

      { id: "sess-05", patientId: "p-bhaben-hazarika", gameType: "memory", gameTitle: "Memory Match", score: 82, accuracy: 80.0, responseTime: 4.5, attempts: 7, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), dateFormatted: "3 days ago", completed: true, synced: true },
      { id: "sess-06", patientId: "p-bhaben-hazarika", gameType: "attention", gameTitle: "Attention Challenge", score: 88, accuracy: 86.0, responseTime: 4.0, attempts: 6, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), dateFormatted: "Yesterday", completed: true, synced: true },

      { id: "sess-07", patientId: "p-venkata-gowda", gameType: "memory", gameTitle: "Memory Match", score: 76, accuracy: 78.0, responseTime: 5.2, attempts: 8, difficulty: 1, timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), dateFormatted: "2 days ago", completed: true, synced: true },
      { id: "sess-08", patientId: "p-venkata-gowda", gameType: "pattern", gameTitle: "Pattern Sequencing", score: 72, accuracy: 74.0, responseTime: 5.8, attempts: 7, difficulty: 1, timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), dateFormatted: "Yesterday", completed: true, synced: true },

      { id: "sess-09", patientId: "p-ramesh-verma", gameType: "memory", gameTitle: "Memory Match", score: 84, accuracy: 85.0, responseTime: 4.2, attempts: 6, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), dateFormatted: "2 days ago", completed: true, synced: true },
      { id: "sess-10", patientId: "p-pratima-sharma", gameType: "memory", gameTitle: "Memory Match", score: 88, accuracy: 90.0, responseTime: 3.9, attempts: 5, difficulty: 2, timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), dateFormatted: "Yesterday", completed: true, synced: true },
    ];
    await db.insert(gameSessions).values(sampleSessions as any);

    // 11. Multi-Cultural Memory Card Items for Cognitive Games
    console.log("-> Seeding multi-cultural memory card items...");
    await db.insert(memoryCardItems).values([
      { id: "card-01", name: "Darjeeling Tea / Cha", nameHindi: "दार्जिलिंग चाय", nameAssamese: "অসম চাহ", emoji: "🍵", color: "#10b981" },
      { id: "card-02", name: "Royal Sitar / Veena", nameHindi: "भारतीय सितार / वीणा", nameAssamese: "বীণা", emoji: "🪕", color: "#f59e0b" },
      { id: "card-03", name: "Heritage Temple / Palace", nameHindi: "भव्य मंदिर / महल", nameAssamese: "মন্দিৰ / সত্ৰ", emoji: "🏛️", color: "#6366f1" },
      { id: "card-04", name: "Sacred Lotus Flower", nameHindi: "कमल का फूल", nameAssamese: "পদ্ম ফুল", emoji: "🪷", color: "#ec4899" },
      { id: "card-05", name: "Clay Diya / Lamp", nameHindi: "माटी का दीया", nameAssamese: "মাটিৰ চাকি", emoji: "🪔", color: "#eab308" },
      { id: "card-06", name: "Sacred Peepal Leaf", nameHindi: "पीपल का पत्ता", nameAssamese: "পিপল পাত", emoji: "🍃", color: "#14b8a6" },
      { id: "card-07", name: "Royal Elephant", nameHindi: "राजसी हाथी", nameAssamese: "হাতী", emoji: "🐘", color: "#8b5cf6" },
      { id: "card-08", name: "Sweet Sandesh / Laddu", nameHindi: "पारंपरिक मिठाई", nameAssamese: "লাৰু / পিঠা", emoji: "🍯", color: "#d97706" },
    ]);

    // 12. Device Pairings for WhatsApp Web Style Quick Login
    console.log("-> Seeding device pairing authorization records...");
    await db.insert(devicePairings).values([
      {
        id: "pair-001",
        pairCode: "MND-842",
        deviceName: "Living Room Tablet (iPad Air)",
        browserInfo: "Mobile Safari 17.2",
        ipAddress: "192.168.1.45",
        status: "approved",
        patientId: "p-subir-banerjee",
        patientName: "Subir Banerjee",
        approvedBy: "Debojit Banerjee",
        requestedAt: "2026-01-20T08:30:00Z",
        approvedAt: "2026-01-20T08:32:00Z",
        token: "tok_pair_subir_live",
      },
      {
        id: "pair-002",
        pairCode: "MND-291",
        deviceName: "Bedroom Samsung Galaxy Tab",
        browserInfo: "Chrome Mobile 121",
        ipAddress: "192.168.1.52",
        status: "approved",
        patientId: "p-venkata-gowda",
        patientName: "Venkatasubbaiah Gowda",
        approvedBy: "Suresh Kumar",
        requestedAt: "2026-01-21T09:00:00Z",
        approvedAt: "2026-01-21T09:05:00Z",
        token: "tok_pair_venkata_live",
      },
      {
        id: "pair-003",
        pairCode: "MND-773",
        deviceName: "New Hallway Lenovo Screen",
        browserInfo: "Firefox 122",
        ipAddress: "192.168.1.88",
        status: "pending",
        patientId: "p-ramesh-verma",
        patientName: "Ramesh Chandra Verma",
        approvedBy: null,
        requestedAt: "2026-01-23T11:20:00Z",
        approvedAt: null,
        token: null,
      },
    ]);

    console.log("==================================================================");
    console.log("🎉 Mindora Seed Complete! Configured Accounts:");
    console.log("------------------------------------------------------------------");
    console.log("👑 SUPER ADMIN:");
    console.log("   Email:    admin@mindora.health");
    console.log("   Password: MindoraAdmin2026!");
    console.log("------------------------------------------------------------------");
    console.log("🩺 DOCTORS (2 Approved, 1 Pending):");
    console.log("   1. Dr. Ananya Mukherjee (WBMC-68492) - Bengali & Assamese Cohort");
    console.log("      Email: dr.ananya@mindora.health | Password: DoctorSecure123!");
    console.log("      Patients: Subir Banerjee (bn), Bhaben Hazarika (as)");
    console.log("   2. Dr. Raghavendra Rao (KMC-42918) - Kannada & Hindi Cohort");
    console.log("      Email: dr.raghavendra@mindora.health | Password: DoctorSecure123!");
    console.log("      Patients: Venkatasubbaiah Gowda (kn), Ramesh Verma (hi), Pratima Sharma (hi)");
    console.log("   3. Dr. Arvind Swamy (TNMC-77401) - Status: PENDING ADMIN APPROVAL");
    console.log("      Email: dr.arvind@mindora.health | Password: DoctorSecure123!");
    console.log("------------------------------------------------------------------");
    console.log("🤝 CAREGIVERS (3 Caretakers):");
    console.log("   1. Debojit Banerjee -> Takes care of 1 patient (Subir Banerjee)");
    console.log("      Email: debojit.care@mindora.health | Password: Caregiver123!");
    console.log("   2. Minoti Hazarika -> Takes care of 1 patient (Bhaben Hazarika)");
    console.log("      Email: minoti.care@mindora.health | Password: Caregiver123!");
    console.log("   3. Suresh Kumar -> Takes care of 3 patients (Venkatasubbaiah, Ramesh, Pratima)");
    console.log("      Email: suresh.care@mindora.health | Password: Caregiver123!");
    console.log("==================================================================");

  } catch (err) {
    console.error("❌ Seeding failed with error:", err);
    throw err;
  }
}

// Execute directly if run as CLI script
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("seed")) {
  seed()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
