const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'PON_TU_CORREO_AQUI@dominio.com',
                pass: process.env.EMAIL_PASS || 'PON_TU_CONTRASEÑA_DE_APLICACION_AQUI'
            }
        });
    }

    async enviarCitaPsicologia(datosCita) {
        const { nombre, dni, motivo, fecha } = datosCita;

        const mailOptions = {
            from: `"Nova.IA - Certus" <${process.env.EMAIL_USER || 'PON_TU_CORREO_AQUI@dominio.com'}>`,
            to: process.env.PSICOLOGO_EMAIL || 'PON_CORREO_PSICOLOGO_AQUI@dominio.com',
            subject: `🚨 Nueva Cita Psicológica Reservada - ${nombre}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">Nueva Solicitud de Cita</h2>
                    <p>Hola, se ha registrado una nueva cita a través de Nova.IA:</p>
                    <hr>
                    <p><strong>Nombre de la Alumna:</strong> ${nombre}</p>
                    <p><strong>DNI:</strong> ${dni}</p>
                    <p><strong>Fecha/Hora:</strong> ${fecha || 'Pendiente por coordinar'}</p>
                    <p><strong>Motivo/Nota:</strong> ${motivo || 'No especificado'}</p>
                    <hr>
                    <p style="font-size: 12px; color: #888;">Este es un mensaje automático generado por el asistente virtual Nova.IA.</p>
                </div>
            `
        };

        try {
            console.log('📬 Intentando enviar correo desde:', process.env.EMAIL_USER || 'PON_TU_CORREO_AQUI@dominio.com');
            if (process.env.EMAIL_USER || true) { // Se usará el fallback si no hay env
                console.log('🚀 Enviando correo real...');
                const info = await this.transporter.sendMail(mailOptions);
                console.log('✓ Correo enviado:', info.messageId);
                return { success: true, messageId: info.messageId };
            } else {
                console.log('⚠️ Email no enviado: Credenciales no configuradas. Simulando envío exitoso.');
                return { success: true, simulation: true };
            }
        } catch (error) {
            console.error('❌ Error enviando email:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();
