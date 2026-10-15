import { model, Schema } from 'mongoose'
import { ADMIN_ROLES } from '../application/adminView.js'

/** Named admins of the dashboard. Created with scripts/create-admin.ts; there is no public sign-up. */
const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    /** argon2id hash. Never selected unless asked for explicitly, never sent to the client. */
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: 'editor' },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, strict: 'throw' },
)

export const AdminModel = model('Admin', adminSchema)
