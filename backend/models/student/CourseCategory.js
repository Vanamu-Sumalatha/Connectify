import mongoose from 'mongoose';

const courseCategorySchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    allCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentCourse'
    }],
    inProgress: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentCourse'
    }],
    completed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentCourse'
    }],
    notStarted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentCourse'
    }],
    wishlist: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to add course to a category
courseCategorySchema.methods.addToCategory = async function(category, courseId) {
    if (this[category]) {
        if (!this[category].includes(courseId)) {
            this[category].push(courseId);
            await this.save();
        }
    }
};

// Method to remove course from a category
courseCategorySchema.methods.removeFromCategory = async function(category, courseId) {
    if (this[category]) {
        this[category] = this[category].filter(id => !id.equals(courseId));
        await this.save();
    }
};

// Method to add course to wishlist
courseCategorySchema.methods.addToWishlist = async function(courseId, notes = '') {
    const existingWishlistItem = this.wishlist.find(item => item.courseId.equals(courseId));
    if (!existingWishlistItem) {
        this.wishlist.push({
            courseId,
            addedAt: new Date(),
            notes
        });
        await this.save();
    }
};

// Method to remove course from wishlist
courseCategorySchema.methods.removeFromWishlist = async function(courseId) {
    this.wishlist = this.wishlist.filter(item => !item.courseId.equals(courseId));
    await this.save();
};

const CourseCategory = mongoose.model('CourseCategory', courseCategorySchema);

export default CourseCategory; 