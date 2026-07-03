const axios = require('axios');

class TTSService {
    async generateSpeech(text, voiceId) {
        // Pon tu API key de ElevenLabs aquí
        const apiKey = process.env.ELEVENLABS_API_KEY || 'PON_TU_API_KEY_ELEVENLABS_AQUI';
        if (apiKey === 'PON_TU_API_KEY_ELEVENLABS_AQUI') {
            throw new Error('Falta la API Key de ElevenLabs');
        }

        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'pNInz6obpgDQGcFmaJgB'}`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            data: {
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                }
            },
            responseType: 'arraybuffer'
        });

        return response.data;
    }
}

module.exports = new TTSService();
