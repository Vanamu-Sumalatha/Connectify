const express = require('express');
const router = express.Router();
const ChatRoom = require('../../models/common/ChatRoom');
const { auth } = require('../../middleware/auth');

// Get all chat rooms for a user
router.get('/', auth, async (req, res) => {
    try {
        const chatRooms = await ChatRoom.getUserChatRooms(req.user.id, req.user.role);
        res.json(chatRooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific chat room
router.get('/:id', auth, async (req, res) => {
    try {
        const chatRoom = await ChatRoom.getChatRoomById(req.params.id, req.user.id, req.user.role);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        res.json(chatRoom);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new chat room (admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const chatRoom = new ChatRoom({
        ...req.body,
        createdBy: req.user.id
    });

    try {
        const newChatRoom = await chatRoom.save();
        res.status(201).json(newChatRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add a message to a chat room
router.post('/:id/messages', auth, async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        const message = {
            senderId: req.user.id,
            senderType: req.user.role,
            content: req.body.content,
            type: req.body.type || 'text',
            fileUrl: req.body.fileUrl,
            metadata: req.body.metadata
        };

        await chatRoom.addMessage(message);
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a participant to a chat room (admin only)
router.post('/:id/participants', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        await chatRoom.addParticipant(req.body.userId, req.body.userType, req.body.role);
        res.json({ message: 'Participant added successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove a participant from a chat room (admin only)
router.delete('/:id/participants/:userId', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        await chatRoom.removeParticipant(req.params.userId);
        res.json({ message: 'Participant removed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Pin a message (admin only)
router.post('/:id/messages/:messageId/pin', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        await chatRoom.pinMessage(req.params.messageId);
        res.json({ message: 'Message pinned successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Unpin a message (admin only)
router.post('/:id/messages/:messageId/unpin', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        await chatRoom.unpinMessage(req.params.messageId);
        res.json({ message: 'Message unpinned successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 