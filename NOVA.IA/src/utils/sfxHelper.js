let audioCtx = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export const sfx = {
    playListening() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine'; 
            const now = ctx.currentTime;

            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02); 
            gain.gain.setValueAtTime(0.08, now + 0.10);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (error) {
            console.warn('No se pudo reproducir SFX (playListening):', error);
        }
    },

    playSuccess() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const playTone = (frequency, startTime, duration, volume) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'triangle'; 
                osc.frequency.setValueAtTime(frequency, startTime);

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
                gain.gain.setValueAtTime(volume, startTime + duration - 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            const now = ctx.currentTime;
            playTone(587.33, now, 0.06, 0.05); 
            playTone(880, now + 0.07, 0.09, 0.05); 
        } catch (error) {
            console.warn('No se pudo reproducir SFX (playSuccess):', error);
        }
    },

    playClosing() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            const now = ctx.currentTime;

            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.setValueAtTime(0.08, now + 0.11);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (error) {
            console.warn('No se pudo reproducir SFX (playClosing):', error);
        }
    }
};
