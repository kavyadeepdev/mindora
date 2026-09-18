import React, { useState, useEffect } from 'react';
import { QrCode, Sparkles, Smartphone, ShieldCheck, Volume2, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language, DevicePairingRequest } from '../../types';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { getTranslation } from '../../utils/translations';

interface PatientDevicePairingProps {
  language: Language;
  onPaired: (device: DevicePairingRequest) => void;
}

export const PatientDevicePairing: React.FC<PatientDevicePairingProps> = ({
  language,
  onPaired
}) => {
  const [pairingRequest, setPairingRequest] = useState<DevicePairingRequest | null>(null);
  const [checking, setChecking] = useState(false);
  const [approvedState, setApprovedState] = useState<DevicePairingRequest | null>(null);

  // Initialize or get pending pairing request
  useEffect(() => {
    // Check if we already have a pending request for this browser session
    const existing = StorageService.getPairingRequests().find(r => r.status === 'pending');
    if (existing) {
      setPairingRequest(existing);
    } else {
      const newReq = StorageService.createDevicePairingRequest(
        typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
          ? 'Patient Tablet Display'
          : 'Patient Living Room Screen'
      );
      setPairingRequest(newReq);
    }
  }, []);

  // Poll for approval like WhatsApp Web
  useEffect(() => {
    if (!pairingRequest || approvedState) return;

    const interval = setInterval(() => {
      setChecking(true);
      const linked = StorageService.getLinkedDevices();
      const match = linked.find(d => d.id === pairingRequest.id && d.status === 'approved');

      if (match) {
        setApprovedState(match);
        AudioSpeechService.playChime('success');
        setTimeout(() => {
          onPaired(match);
        }, 1200);
      } else {
        setChecking(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pairingRequest, approvedState, onPaired]);

  const speakInstructions = () => {
    const text = language === 'as'
      ? 'আপোনাৰ ডাক্তৰ বা যত্নলোৱা ব্যক্তিয়ে নিজৰ ডেচব’ৰ্ডৰ পৰা এই স্ক্ৰীনখন সংযোগ কৰি দিব। কোনো পাছৱৰ্ড মনত ৰখাৰ প্ৰয়োজন নাই।'
      : language === 'hi'
      ? 'आपके डॉक्टर या देखभालकर्ता अपने डैशबोर्ड से इस स्क्रीन को जोड़ देंगे। आपको कोई पासवर्ड याद रखने की जरूरत नहीं है।'
      : language === 'bn'
      ? 'আপনার ডাক্তার বা তত্ত্বাবধায়ক তাদের ড্যাশবোর্ড থেকে এই স্ক্রিনটি যুক্ত করে দেবেন। কোনো পাসওয়ার্ড মনে রাখার প্রয়োজন নেই।'
      : language === 'kn'
      ? 'ನಿಮ್ಮ ವೈದ್ಯರು ಅಥವಾ ಆರೈಕೆದಾರರು ತಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಈ ಪರದೆಯನ್ನು ಲಿಂಕ್ ಮಾಡುತ್ತಾರೆ. ಯಾವುದೇ ಪಾಸ್‌ವರ್ಡ್ ನೆನಪಿಟ್ಟುಕೊಳ್ಳುವ ಅಗತ್ಯವಿಲ್ಲ.'
      : 'Your doctor or family caretaker will connect this screen from their dashboard. You never need to remember any passwords.';

    AudioSpeechService.speak(text, language);
  };

  const handleSimulateInstantApproval = () => {
    if (!pairingRequest) return;
    const approved = StorageService.approveDevicePairingRequest(
      pairingRequest.id,
      'patient-anima-01',
      'Dr. Debojit Sarma & Meera Devi'
    );
    if (approved) {
      setApprovedState(approved);
      AudioSpeechService.playChime('success');
      setTimeout(() => {
        onPaired(approved);
      }, 900);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-amber-200/90 shadow-xl p-6 sm:p-10 text-center relative overflow-hidden">
        
        {/* Decorative ambient background */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-6">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Caregiver & Doctor Authorized Pairing</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
          {language === 'as' ? 'আপোনাৰ যন্ত্ৰ সংযোগ কৰক' :
           language === 'hi' ? 'अपना उपकरण जोड़ें' :
           language === 'bn' ? 'আপনার ডিভাইস সংযুক্ত করুন' :
           language === 'kn' ? 'ನಿಮ್ಮ ಸಾಧನವನ್ನು ಸಂಪರ್ಕಿಸಿ' :
           'Connect Patient Screen'}
        </h1>

        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-8 font-medium">
          {language === 'as'
            ? 'আপোনাৰ কোনো পাছৱৰ্ড বা নম্বৰ মনত ৰখাৰ প্ৰয়োজন নাই। আপোনাৰ যত্নলোৱা ব্যক্তিয়ে নিজৰ মোবাইলৰ পৰা অনুমোদন কৰিব।'
            : language === 'hi'
            ? 'आपको कोई पासवर्ड याद रखने की आवश्यकता नहीं है। आपके देखभालकर्ता या डॉक्टर इसे अपने डैशबोर्ड से स्वीकृत करेंगे।'
            : language === 'bn'
            ? 'আপনাকে কোনো পাসওয়ার্ড মনে রাখতে হবে না। আপনার ডাক্তার বা যত্নকারী তাদের ড্যাশবোর্ড থেকে এটি অনুমোদন করবেন।'
            : language === 'kn'
            ? 'ನೀವು ಯಾವುದೇ ಪಾಸ್‌ವರ್ಡ್ ನೆನಪಿಡುವ ಅಗತ್ಯವಿಲ್ಲ. ನಿಮ್ಮ ಆರೈಕೆದಾರರು ತಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಇದನ್ನು ಅನುಮೋದಿಸುತ್ತಾರೆ.'
            : 'Zero passwords needed. Your doctor or family caregiver approves this device directly from their dashboard.'}
        </p>

        {/* QR Code & Pairing Code Card */}
        <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-6 sm:p-8 mb-6 relative">
          {approvedState ? (
            <div className="py-8 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-300">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-900">
                Device Approved & Connected!
              </h3>
              <p className="text-sm text-emerald-700 mt-1">
                Linked to {approvedState.patientName || 'Anima Devi'}. Loading daily space...
              </p>
            </div>
          ) : (
            <div>
              {/* QR Code Graphic Simulation */}
              <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-4 rounded-2xl shadow-inner border border-stone-300 flex flex-col items-center justify-center relative mb-4">
                <div className="grid grid-cols-6 gap-2 opacity-85">
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-200 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />

                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-100 rounded-md" />
                  <div className="w-7 h-7 bg-amber-600 rounded-md" />
                  <div className="w-7 h-7 bg-stone-100 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-200 rounded-md" />

                  <div className="w-7 h-7 bg-stone-200 rounded-md" />
                  <div className="w-7 h-7 bg-amber-600 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-amber-600 rounded-md" />
                  <div className="w-7 h-7 bg-stone-100 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />

                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-100 rounded-md" />
                  <div className="w-7 h-7 bg-amber-600 rounded-md" />
                  <div className="w-7 h-7 bg-stone-100 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />

                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-100 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                  <div className="w-7 h-7 bg-stone-200 rounded-md" />
                  <div className="w-7 h-7 bg-stone-900 rounded-md" />
                </div>

                {/* Center Mindora Flower Badge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white text-2xl font-bold">
                    🌸
                  </div>
                </div>
              </div>

              {/* Bold 6-character Pairing Code */}
              <div className="mt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Device Pairing Code
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-900 tracking-widest mt-1 font-mono">
                  {pairingRequest?.pairCode || 'MND-842'}
                </div>
              </div>

              {/* Live Status Pulse */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-amber-800 bg-amber-100/70 py-2 px-4 rounded-xl max-w-xs mx-auto">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>Awaiting approval from dashboard...</span>
              </div>
            </div>
          )}
        </div>

        {/* Audio Assistance and Demo Quick Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={speakInstructions}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Listen to Instructions</span>
          </button>

          <button
            id="demo-approve-device-btn"
            onClick={handleSimulateInstantApproval}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            <span>Simulate Doctor / Caretaker Approval</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

      </div>
    </div>
  );
};
