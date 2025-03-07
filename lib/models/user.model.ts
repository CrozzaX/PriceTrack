import mongoose from 'mongoose';

// Define the user schema
export const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    minlength: [5, 'Email must be at least 5 characters long'],
    maxlength: [255, 'Email cannot exceed 255 characters'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    maxlength: [1024, 'Password cannot exceed 1024 characters']
  },
  profileImage: {
    type: String,
    default: ''
  },
  savedProducts: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      source: {
        type: String,
        enum: ['Amazon', 'Flipkart', 'Myntra', 'ProductCard', 'ProductDetail', 'Other'],
        default: 'Other'
      },
      dateAdded: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// For the default connection (products database)
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User; 