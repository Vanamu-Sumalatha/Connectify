import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        avatar: String,
        bio: String,
        interests: [String],
        skills: [String],
        education: [{
            institution: String,
            degree: String,
            fieldOfStudy: String,
            startDate: Date,
            endDate: Date
        }]
    },
    contact: {
        phone: String,
        address: String,
        socialMedia: {
            linkedin: String,
            github: String,
            twitter: String
        }
    },
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        default: 'student'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password - Renamed to match what's used in auth routes
userSchema.methods.matchPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update profile
userSchema.methods.updateProfile = async function(profileData) {
    this.profile = { ...this.profile, ...profileData };
    await this.save();
    return this.profile;
};

// Method to update preferences
userSchema.methods.updatePreferences = async function(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    await this.save();
    return this.preferences;
};

// Static method to find by email
userSchema.statics.findByEmail = async function(email) {
    return await this.findOne({ email });
};

// Static method to find by username
userSchema.statics.findByUsername = async function(username) {
    return await this.findOne({ username });
};

const User = mongoose.model('User', userSchema);

export default User; 