// KYC Verification Types
export interface KYCFormData {
  // Personal Information
  fullName: string
  dateOfBirth: string
  nationality: string
  
  // Identity Document
  idType: "passport" | "ktp" | "drivers_license"
  idNumber: string
  
  // Address
  address: string
  city: string
  postalCode: string
  
  // Documents
  idPhoto?: File
  selfiePhoto?: File
}

export interface KYCSubmissionResponse {
  kycId: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  estimatedReviewTime?: string
}

export interface KYCStatusResponse {
  status: "none" | "pending" | "verified" | "rejected"
  kycId?: string
  rejectionReason?: string
  submittedAt?: string
}
