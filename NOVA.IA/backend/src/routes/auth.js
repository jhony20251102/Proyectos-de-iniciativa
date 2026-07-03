const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authMiddleware, authController.getProfile);
router.get('/history', authMiddleware, authController.getHistory);
router.post('/conversations', authMiddleware, authController.createConversation);
router.post('/messages', authMiddleware, authController.saveMessage);
router.delete('/conversations/:conversationId', authMiddleware, authController.deleteConversation);

module.exports = router;
