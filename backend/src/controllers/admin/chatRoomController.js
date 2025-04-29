import ChatRoom from '../../models/ChatRoom.js';
import { validationResult } from 'express-validator';

// Get all chat rooms with optional type filter
export const getChatRooms = async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};
        
        // Different query for admin vs student
        if (req.user.role === 'student') {
            // Students only see active rooms with appropriate types
            query.isActive = true;
            if (type) {
                query.type = type;
            } else {
                query.type = { $in: ['support', 'discussion', 'course', 'study-group'] };
            }
            console.log('Student access - filtered query:', query);
        } else {
            // Admins can see all rooms with optional type filter
            if (type) {
                query.type = type;
            }
        }
        
        const chatRooms = await ChatRoom.find(query)
            .populate('createdBy', 'name profilePicture')
            .populate('courseId', 'title')
            .populate('studyGroupId', 'name')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${chatRooms.length} chat rooms for ${req.user.role}`);    
        res.json(chatRooms);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a single chat room by ID
export const getChatRoom = async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.id)
            .populate('createdBy', 'name profilePicture')
            .populate('courseId', 'title')
            .populate('studyGroupId', 'name');
            
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        
        // Students can only access active rooms of appropriate types
        if (req.user.role === 'student') {
            if (!chatRoom.isActive) {
                return res.status(403).json({ message: 'This chat room is not available' });
            }
            
            const allowedTypes = ['support', 'discussion', 'course', 'study-group'];
            if (!allowedTypes.includes(chatRoom.type)) {
                return res.status(403).json({ message: 'Access denied for this chat room type' });
            }
        }
        
        res.json(chatRoom);
    } catch (error) {
        console.error('Error fetching chat room:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new chat room
export const createChatRoom = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, type, description, courseId, studyGroupId, isActive } = req.body;
        
        const chatRoom = new ChatRoom({
            name,
            type,
            description,
            courseId,
            studyGroupId,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id
        });

        await chatRoom.save();
        await chatRoom.populate('createdBy', 'name profilePicture');
        
        res.status(201).json(chatRoom);
    } catch (error) {
        console.error('Error creating chat room:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a chat room
export const updateChatRoom = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, type, description, isActive } = req.body;
        
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Update fields
        chatRoom.name = name || chatRoom.name;
        chatRoom.type = type || chatRoom.type;
        chatRoom.description = description || chatRoom.description;
        chatRoom.isActive = isActive !== undefined ? isActive : chatRoom.isActive;

        await chatRoom.save();
        await chatRoom.populate('createdBy', 'name profilePicture');
        
        res.json(chatRoom);
    } catch (error) {
        console.error('Error updating chat room:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a chat room (soft delete by setting isActive to false)
export const deleteChatRoom = async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Soft delete by setting isActive to false
        chatRoom.isActive = false;
        await chatRoom.save();
        
        res.json({ message: 'Chat room deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat room:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 