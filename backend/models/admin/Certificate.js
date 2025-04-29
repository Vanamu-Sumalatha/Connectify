const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['course', 'skill', 'achievement', 'certification'],
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    achievementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    },
    template: {
        design: {
            type: String,
            required: true
        },
        logo: {
            type: String,
            required: true
        },
        signature: {
            type: String,
            required: true
        },
        watermark: String,
        colors: {
            primary: String,
            secondary: String,
            accent: String
        },
        fonts: {
            title: String,
            body: String
        }
    },
    requirements: {
        minScore: {
            type: Number,
            required: true
        },
        completionCriteria: {
            type: String,
            required: true
        },
        validityPeriod: {
            type: Number, // in months
            default: 0 // 0 means no expiry
        }
    },
    issuedCertificates: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser',
            required: true
        },
        certificateId: {
            type: String,
            required: true,
            unique: true
        },
        issueDate: {
            type: Date,
            default: Date.now
        },
        expiryDate: Date,
        score: {
            type: Number,
            required: true
        },
        verificationCode: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'revoked'],
            default: 'active'
        },
        metadata: {
            completionDate: Date,
            instructor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AdminUser'
            },
            additionalInfo: mongoose.Schema.Types.Mixed
        }
    }],
    settings: {
        allowDownload: {
            type: Boolean,
            default: true
        },
        allowSharing: {
            type: Boolean,
            default: true
        },
        requireVerification: {
            type: Boolean,
            default: true
        },
        autoIssue: {
            type: Boolean,
            default: false
        },
        notificationSettings: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
certificateSchema.index({ courseId: 1 });
certificateSchema.index({ achievementId: 1 });
certificateSchema.index({ 'issuedCertificates.studentId': 1 });
certificateSchema.index({ 'issuedCertificates.certificateId': 1 });
certificateSchema.index({ 'issuedCertificates.verificationCode': 1 });

// Methods
certificateSchema.methods.issueCertificate = async function(certificateData) {
    this.issuedCertificates.push(certificateData);
    return this.save();
};

certificateSchema.methods.revokeCertificate = async function(certificateId) {
    const certificate = this.issuedCertificates.find(c => c.certificateId === certificateId);
    if (certificate) {
        certificate.status = 'revoked';
        return this.save();
    }
    return this;
};

certificateSchema.methods.updateTemplate = async function(template) {
    this.template = { ...this.template, ...template };
    return this.save();
};

// Static Methods
certificateSchema.statics.getCertificatesByCourse = async function(courseId) {
    return this.find({ courseId, status: 'active' })
        .populate('courseId', 'title code')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
};

certificateSchema.statics.getStudentCertificates = async function(studentId) {
    return this.find({ 'issuedCertificates.studentId': studentId })
        .select('issuedCertificates')
        .populate('issuedCertificates.studentId', 'firstName lastName')
        .populate('issuedCertificates.metadata.instructor', 'firstName lastName')
        .sort({ 'issuedCertificates.issueDate': -1 });
};

certificateSchema.statics.verifyCertificate = async function(verificationCode) {
    return this.findOne({ 'issuedCertificates.verificationCode': verificationCode })
        .select('issuedCertificates')
        .populate('issuedCertificates.studentId', 'firstName lastName')
        .populate('issuedCertificates.metadata.instructor', 'firstName lastName');
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate; 