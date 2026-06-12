import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable. Check your .env file.')
}

// Connect once at startup. Mongoose buffers commands until the connection is
// ready, so routes can import models and query immediately -- no need to await
// the connection in index.ts.
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

const userSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, unique: true, index: true },
    email: { type: String, unique: true, sparse: true },
    name: { type: String },
  },
  { timestamps: true },
)

// Guard against model recompilation in dev (ts-node-dev re-imports modules).
export const User = mongoose.models.User || mongoose.model('User', userSchema)
