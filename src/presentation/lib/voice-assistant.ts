/**
 * 🟪 COUCHE PRÉSENTATION - Assistant vocal
 * Synthèse vocale pour les instructions de navigation en turc
 */

/**
 * Parle un texte donné en utilisant la synthèse vocale du navigateur
 * @param text - Le texte à prononcer
 * @param lang - La langue (par défaut: 'tr-TR' pour le turc)
 */
export function speak(text: string, lang: string = 'tr-TR'): void | Promise<void> {
  // Vérifier si la synthèse vocale est disponible
  if (!('speechSynthesis' in window)) {
    console.warn('⚠️ Synthèse vocale non disponible dans ce navigateur');
    return;
  }

  // Annuler toute synthèse en cours
  window.speechSynthesis.cancel();

  // Créer une nouvelle instance de SpeechSynthesisUtterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Légèrement plus lent pour une meilleure compréhension
  utterance.pitch = 1.0; // Hauteur normale
  utterance.volume = 1.0; // Volume maximum

  // Essayer de trouver une voix turque
  // Note: getVoices() peut retourner un tableau vide si appelé trop tôt
  // On essaie plusieurs fois si nécessaire
  let voices = window.speechSynthesis.getVoices();
  
  // Si aucune voix n'est disponible, attendre un peu et réessayer
  if (voices.length === 0) {
    // Attendre que les voix soient chargées (événement 'voiceschanged')
    return new Promise<void>((resolve) => {
      const onVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        setVoiceAndSpeak(voices, utterance, text);
        resolve();
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      
      // Timeout de sécurité
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        setVoiceAndSpeak(voices, utterance, text);
        resolve();
      }, 1000);
    });
  }
  
  setVoiceAndSpeak(voices, utterance, text);
}

/**
 * Configure la voix et prononce le texte
 */
function setVoiceAndSpeak(voices: SpeechSynthesisVoice[], utterance: SpeechSynthesisUtterance, text: string): void {
  const turkishVoice = voices.find(
    (voice) => voice.lang.startsWith('tr') || voice.lang === 'tr-TR'
  );

  if (turkishVoice) {
    utterance.voice = turkishVoice;
    console.log('🗣️ Voix turque trouvée:', turkishVoice.name);
  } else {
    console.warn('⚠️ Aucune voix turque trouvée, utilisation de la voix par défaut');
  }

  // Parler
  window.speechSynthesis.speak(utterance);

  // Log pour le débogage
  console.log('🗣️ Parole:', text);
}

/**
 * Arrête toute synthèse vocale en cours
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Vérifie si la synthèse vocale est disponible
 */
export function isSpeechSynthesisAvailable(): boolean {
  return 'speechSynthesis' in window;
}

