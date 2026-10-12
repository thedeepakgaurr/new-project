const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: '' },
    // Tokens issued before this moment are rejected (see middleware/auth.js)
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    profileImage: this.profileImage,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
