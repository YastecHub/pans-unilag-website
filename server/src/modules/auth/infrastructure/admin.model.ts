import { model, Schema } from 'mongoose'
import { ADMIN_ROLES } from '../application/adminView.js'

/**
 * Named admins of the dashboard. Created by the developer (the Accounts page or
 * scripts/create-admin.ts), or by the person themselves on the request-access page, in which
 * case the account is `pending` and can't sign in until the developer approves it.
 */
const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    /** argon2id hash. Never selected unless asked for explicitly, never sent to the client. */
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: 'editor' },
    /** True while a self-registered account waits for the developer's approval. */
    pending: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, strict: 'throw' },
)

export const AdminModel = model('Admin', adminSchema)
