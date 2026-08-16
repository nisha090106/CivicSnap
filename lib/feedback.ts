/**
 * Accessibility & Feedback Utility
 * Provides haptic/visual feedback triggers and Text-to-Speech audio hooks
 * allowing regional voice cues to plug in without component redesigns.
 */

export function playFeedback(
  type: 'click' | 'success' | 'warning' | 'alert',
  speechText?: string
) {
  if (typeof window === 'undefined') return;

  // 1. Trigger Vibration Haptic Feedback if supported
  if ('vibrate' in navigator) {
    try {
      if (type === 'click') navigator.vibrate(20);
      else if (type === 'success') navigator.vibrate([40, 60, 40]);
      else if (type === 'warning') navigator.vibrate([100, 50, 100]);
    } catch (e) {
      // Ignore vibration errors
    }
  }

  // 2. Text-to-Speech Audio Hook (Web Speech API fallback)
  if (speechText && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop active audio
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('[Feedback Hook] Speech synthesis error:', e);
    }
  }
}
