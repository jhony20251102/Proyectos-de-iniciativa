const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/dbService');

const JWT_SECRET = process.env.JWT_SECRET || 'nova_ia_secret_token_12345';

class AuthController {
    async register(req, res) {
        try {
            const { email, password, nombre, carrera, ciclo, sede } = req.body;
            if (!email || !password || !nombre) {
                return res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
            }

            const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
            if (existingUser) {
                return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const result = await db.run(
                `INSERT INTO users (email, password_hash, nombre, carrera, ciclo, sede) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [email.toLowerCase(), passwordHash, nombre, carrera || '', ciclo || '', sede || '']
            );

            const token = jwt.sign({ userId: result.id }, JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: result.id,
                    email: email.toLowerCase(),
                    nombre,
                    carrera,
                    ciclo,
                    sede
                }
            });
        } catch (error) {
            console.error('Error en el registro:', error);
            res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }

            const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
            if (!user) {
                return res.status(400).json({ error: 'Credenciales inválidas (usuario no encontrado)' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ error: 'Credenciales inválidas (contraseña incorrecta)' });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    carrera: user.carrera,
                    ciclo: user.ciclo,
                    sede: user.sede
                }
            });
        } catch (error) {
            console.error('Error en el login:', error);
            res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await db.get(
                'SELECT id, email, nombre, carrera, ciclo, sede, created_at FROM users WHERE id = ?', 
                [req.userId]
            );
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json({ success: true, user });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ error: 'Error obteniendo perfil' });
        }
    }

    async getHistory(req, res) {
        try {
            const conversations = await db.all(
                'SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC', 
                [req.userId]
            );

            const conversationsWithMessages = await Promise.all(
                conversations.map(async (conv) => {
                    const messages = await db.all(
                        'SELECT role, text, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
                        [conv.id]
                    );
                    return {
                        id: conv.id,
                        title: conv.title,
                        createdAt: conv.created_at,
                        messages
                    };
                })
            );

            res.json({ success: true, conversations: conversationsWithMessages });
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            res.status(500).json({ error: 'Error obteniendo historial' });
        }
    }

    async createConversation(req, res) {
        try {
            const { title } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'Título requerido' });
            }
            const result = await db.run(
                'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
                [req.userId, title]
            );
            res.json({ success: true, conversationId: result.id, title });
        } catch (error) {
            console.error('Error creando conversación:', error);
            res.status(500).json({ error: 'Error creando conversación' });
        }
    }

    async saveMessage(req, res) {
        try {
            const { conversationId, role, text } = req.body;
            if (!conversationId || !role || !text) {
                return res.status(400).json({ error: 'conversationId, role y text son requeridos' });
            }

            const conversation = await db.get(
                'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
                [conversationId, req.userId]
            );
            if (!conversation) {
                return res.status(403).json({ error: 'Acceso denegado a esta conversación' });
            }

            await db.run(
                'INSERT INTO messages (conversation_id, role, text) VALUES (?, ?, ?)',
                [conversationId, role, text]
            );
            res.json({ success: true });
        } catch (error) {
            console.error('Error guardando mensaje:', error);
            res.status(500).json({ error: 'Error guardando mensaje' });
        }
    }

    async deleteConversation(req, res) {
        try {
            const { conversationId } = req.params;

            const conversation = await db.get(
                'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
                [conversationId, req.userId]
            );
            if (!conversation) {
                return res.status(403).json({ error: 'Acceso denegado o conversación inexistente' });
            }

            await db.run('DELETE FROM conversations WHERE id = ?', [conversationId]);
            res.json({ success: true, message: 'Conversación eliminada' });
        } catch (error) {
            console.error('Error eliminando conversación:', error);
            res.status(500).json({ error: 'Error eliminando conversación' });
        }
    }
}

module.exports = new AuthController();
