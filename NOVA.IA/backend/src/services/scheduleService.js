const axios = require('axios');

class ScheduleService {
    constructor() {
        this.spreadsheetId = '1i00ezJti99BTx3I4ldb5eOz276MlkBG4urVth1bM6WA';
        this.baseUrl = 'https://opensheet.elk.sh';
    }

    async getScheduleForToday() {
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        const today = new Date();
        const dayName = days[today.getDay()];

        if (dayName === 'DOMINGO') return [];

        try {
            console.log(`📅 Consultando horario para el día: ${dayName}...`);
            const response = await axios.get(`${this.baseUrl}/${this.spreadsheetId}/${dayName}`);
            return response.data || [];
        } catch (error) {
            console.error('❌ Error fetching schedule:', error.message);
            return [];
        }
    }

    parseTime(timeStr) {
        if (!timeStr) return null;

        try {
            const now = new Date();
            let hours = 0;
            let minutes = 0;

            const cleanStr = timeStr.toLowerCase().replace(/\./g, '').trim();
            const isPM = cleanStr.includes('p');
            const isAM = cleanStr.includes('a');

            const match = cleanStr.match(/(\d+):(\d+)/);
            if (!match) return null;

            hours = parseInt(match[1]);
            minutes = parseInt(match[2]);

            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
            return date.getTime();
        } catch (e) {
            return null;
        }
    }

    formatNaturalTime(timeStr) {
        if (!timeStr) return "";
        let cleanTime = timeStr.toLowerCase().replace(/\./g, '').trim();

        const match = cleanTime.match(/(\d+):(\d+)/);
        if (!match) return timeStr;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const isPM = cleanTime.includes('p') || hours >= 12;
        const isAM = cleanTime.includes('a') || (hours < 12 && !isPM);

        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;

        let suffix = "";
        if (isPM) {
            if (hours >= 1 && hours < 6) suffix = "de la tarde";
            else if (hours >= 6 && hours <= 11) suffix = "de la noche";
            else if (hours === 12) suffix = "del mediodía";
            else suffix = "de la tarde";
        } else {
            if (hours >= 1 && hours < 12) suffix = "de la mañana";
            else if (hours === 12) suffix = "de la madrugada";
            else suffix = "de la mañana";
        }

        const minutesStr = minutes > 0 ? ` con ${minutes} minutos` : "";
        return `${hours}${minutesStr} ${suffix}`;
    }

    async checkClassInRoom(roomNumber) {
        const schedule = await this.getScheduleForToday();
        if (!schedule.length) return null;

        const now = new Date().getTime();

        const activeClass = schedule.find(item => {
            const ambiente = item['Ambiente'] || '';
            const normalizedAmbiente = ambiente.toLowerCase().replace(/\s/g, '');
            const normalizedRoom = roomNumber.toLowerCase().replace(/\s/g, '');
            if (!normalizedAmbiente.includes(normalizedRoom)) return false;

            const startTime = this.parseTime(item['Hr Ini Cls']);
            const endTime = this.parseTime(item['Hr Fin Cls']);

            if (!startTime || !endTime) return false;

            return now >= startTime && now <= endTime;
        });

        if (activeClass) {
            return {
                curso: activeClass['Curso'],
                ambiente: activeClass['Ambiente'],
                docente: activeClass['Docente'],
                fin: this.formatNaturalTime(activeClass['Hr Fin Cls']),
                inicio: this.formatNaturalTime(activeClass['Hr Ini Cls'])
            };
        }

        return null;
    }
}

module.exports = new ScheduleService();
