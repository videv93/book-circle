import { z } from 'zod';

export const verificationMethodEnum = z.enum(['AMAZON', 'WEBSITE', 'MANUAL']);

export const submitClaimSchema = z
  .object({
    bookId: z.string().min(1, 'Book ID is required'),
    verificationMethod: verificationMethodEnum,
    verificationUrl: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
    verificationText: z
      .string()
      .min(10, 'Please provide at least 10 characters of explanation')
      .max(1000, 'Explanation must be 1000 characters or less')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.verificationMethod === 'AMAZON' || data.verificationMethod === 'WEBSITE') {
        return !!data.verificationUrl && data.verificationUrl.length > 0;
      }
      return true;
    },
    {
      message: 'URL is required for Amazon and Website verification',
      path: ['verificationUrl'],
    }
  )
  .refine(
    (data) => {
      if (data.verificationMethod === 'MANUAL') {
        return !!data.verificationText && data.verificationText.length >= 10;
      }
      return true;
    },
    {
      message: 'Explanation is required for manual verification',
      path: ['verificationText'],
    }
  );

export type SubmitClaimInput = z.infer<typeof submitClaimSchema>;

export const reviewClaimSchema = z.object({
  claimId: z.string().min(1, 'Claim ID is required'),
  decision: z.enum(['approve', 'reject']),
});

export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
