/**
 * 🟪 COUCHE PRÉSENTATION - Wake Lock API
 * Empêche l'écran de s'éteindre pendant la navigation
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Demande le verrouillage de l'écran pour empêcher la mise en veille
 * @returns Promise<boolean> - true si le verrouillage a été activé, false sinon
 */
export async function requestWakeLock(): Promise<boolean> {
  // Vérifier si l'API Wake Lock est disponible
  if (!('wakeLock' in navigator)) {
    console.warn('⚠️ Wake Lock API non disponible dans ce navigateur');
    return false;
  }

  try {
    // Demander le verrouillage de l'écran
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('✅ Wake Lock activé - L\'écran restera allumé');

    // Écouter les événements de libération (ex: changement d'onglet)
    wakeLock.addEventListener('release', () => {
      console.log('⚠️ Wake Lock libéré');
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la demande de Wake Lock:', error);
    return false;
  }
}

/**
 * Libère le verrouillage de l'écran
 */
export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('✅ Wake Lock libéré manuellement');
    } catch (error) {
      console.error('❌ Erreur lors de la libération du Wake Lock:', error);
    }
  }
}

/**
 * Vérifie si le Wake Lock est actif
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null;
}

