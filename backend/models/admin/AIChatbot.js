const mongoose = require('mongoose');

const aiChatbotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        required: true,
        enum: ['gpt-3.5-turbo', 'gpt-4', 'claude-2', 'custom']
    },
    settings: {
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 1
        },
        maxTokens: {
            type: Number,
            default: 1000
        },
        contextWindow: {
            type: Number,
            default: 4000
        },
        responseFormat: {
            type: String,
            enum: ['text', 'json', 'markdown'],
            default: 'text'
        }
    },
    knowledgeBase: [{
        category: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        source: {
            type: String,
            required: true
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],
    conversationHistory: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser'
        },
        messages: [{
            role: {
                type: String,
                enum: ['user', 'assistant', 'system'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        context: {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            topic: String
        },
        feedback: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String
        }
    }],
    performanceMetrics: {
        totalConversations: {
            type: Number,
            default: 0
        },
        averageResponseTime: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        commonTopics: [{
            topic: String,
            count: Number
        }]
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'disabled'],
        default: 'active'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
aiChatbotSchema.index({ name: 1 });
aiChatbotSchema.index({ 'conversationHistory.userId': 1 });
aiChatbotSchema.index({ 'knowledgeBase.category': 1 });

// Methods
aiChatbotSchema.methods.addKnowledge = async function(knowledge) {
    this.knowledgeBase.push(knowledge);
    return this.save();
};

aiChatbotSchema.methods.updateKnowledge = async function(knowledgeId, update) {
    const knowledgeIndex = this.knowledgeBase.findIndex(k => k._id.equals(knowledgeId));
    if (knowledgeIndex !== -1) {
        this.knowledgeBase[knowledgeIndex] = { ...this.knowledgeBase[knowledgeIndex], ...update };
        return this.save();
    }
    return this;
};

aiChatbotSchema.methods.addConversation = async function(conversation) {
    this.conversationHistory.push(conversation);
    this.performanceMetrics.totalConversations += 1;
    return this.save();
};

aiChatbotSchema.methods.addFeedback = async function(conversationId, feedback) {
    const conversation = this.conversationHistory.id(conversationId);
    if (conversation) {
        conversation.feedback = feedback;
        this.performanceMetrics.averageRating = 
            (this.performanceMetrics.averageRating * (this.performanceMetrics.totalConversations - 1) + feedback.rating) / 
            this.performanceMetrics.totalConversations;
        return this.save();
    }
    return this;
};

// Static Methods
aiChatbotSchema.statics.getChatbotByName = async function(name) {
    return this.findOne({ name });
};

aiChatbotSchema.statics.getConversationHistory = async function(userId) {
    return this.findOne({ 'conversationHistory.userId': userId })
        .select('conversationHistory')
        .populate('conversationHistory.userId', 'firstName lastName')
        .populate('conversationHistory.context.courseId', 'title code');
};

const AIChatbot = mongoose.model('AIChatbot', aiChatbotSchema);

module.exports = AIChatbot; 