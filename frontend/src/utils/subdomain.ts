import { SubdomainPortal } from '../types';

export function detectPortalFromUrl(): SubdomainPortal {
  if (typeof window === 'undefined') return 'landing';

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  // 1. Check Subdomain on production or custom local hostnames
  // e.g. patient.mindora.app, patient.localhost
  if (hostname.startsWith('patient.')) {
    return 'patient';
  }
  if (hostname.startsWith('doctor.')) {
    return 'doctor';
  }
  if (hostname.startsWith('caretaker.') || hostname.startsWith('caregiver.')) {
    return 'caretaker';
  }
  if (hostname.startsWith('admin.')) {
    return 'admin';
  }

  // 2. Check Pathname fallback (ideal for localhost:3000/patient, preview environments)
  if (pathname.startsWith('/patient')) {
    return 'patient';
  }
  if (pathname.startsWith('/doctor')) {
    return 'doctor';
  }
  if (pathname.startsWith('/caretaker') || pathname.startsWith('/caregiver')) {
    return 'caretaker';
  }
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  // 3. Default to separate Landing Page
  return 'landing';
}

export function navigateToPortal(portal: SubdomainPortal, pathSuffix = ''): void {
  if (typeof window === 'undefined') return;

  const targetPath = portal === 'landing' ? `/${pathSuffix}` : `/${portal}${pathSuffix ? `/${pathSuffix}` : ''}`;
  
  window.history.pushState({ portal }, '', targetPath);
  window.dispatchEvent(new CustomEvent('mindora-portal-change', { detail: { portal } }));
}
