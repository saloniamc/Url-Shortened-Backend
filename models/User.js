// models/User.js

const mongoose = require('mongoose');
const argon2 = require('argon2'); // Import argon2

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// Pre-save hook to hash the password before saving the user
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   this.password = await argon2.hash(this.password); // Use argon2 for hashing
//   next();
// });

// Compare the given password with the hashed password in the database
// userSchema.methods.comparePassword = async function (password) {
//   return await argon2.verify(this.password, password); // Use argon2 for comparison
// };

const User = mongoose.model('User', userSchema);
module.exports = User;
