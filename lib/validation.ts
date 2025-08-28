import { z } from 'zod';

// Job Application validation schema
export const JobApplicationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  position: z.string().min(1, 'Position is required').max(100),
  company: z.string().min(1, 'Company is required').max(100),
  phone: z.string().optional(),
  resumeUrl: z.string().url().optional().or(z.literal('')),
  metadata: z.record(z.any()).optional(),
});

// Generate application validation schema
export const GenerateApplicationSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
});

// Stripe checkout validation schema
export const StripeCheckoutSchema = z.object({
  tier: z.string().min(1, 'Tier is required'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

// Webhook validation schema
export const WebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.any()),
  timestamp: z.number().optional(),
});

// Type exports
export type JobApplicationInput = z.infer<typeof JobApplicationSchema>;
export type GenerateApplicationInput = z.infer<typeof GenerateApplicationSchema>;
export type StripeCheckoutInput = z.infer<typeof StripeCheckoutSchema>;
export type WebhookInput = z.infer<typeof WebhookSchema>;
