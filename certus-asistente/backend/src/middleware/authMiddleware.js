const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'nova_ia_secret_token_12345';

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token mal formateado' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Error de autenticación JWT:', error.message);
        return res.status(401).json({ error: 'Token de autenticación inválido o expirado' });
    }
};
