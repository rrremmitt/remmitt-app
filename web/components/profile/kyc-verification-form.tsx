"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BrutalInput } from "@/components/ui/brutal-input"
import { BrutalButton } from "@/components/ui/brutal-button"
import { BrutalCard } from "@/components/ui/brutal-card"
import { DocumentUpload } from "@/components/profile/document-upload"
import { ChevronDown, Check } from "lucide-react"
import { useState } from "react"
import type { KYCFormData } from "@/lib/types"

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "ktp", label: "KTP (Indonesian National ID)" },
  { value: "drivers_license", label: "Driver's License" },
] as const

const COUNTRIES = [
  "Indonesia",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "United States",
  "United Kingdom",
  "Australia",
  "Other",
]

// Zod schema for form validation
const kycSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Please select your nationality"),
  idType: z.enum(["passport", "ktp", "drivers_license"], {
    required_error: "Please select an ID type",
  }),
  idNumber: z.string().min(5, "ID number must be at least 5 characters"),
  address: z.string().min(10, "Please provide your complete address"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(4, "Please provide a valid postal code"),
  idPhoto: z.any().refine((file) => file !== null && file !== undefined, {
    message: "ID photo is required",
  }),
  selfiePhoto: z.any().refine((file) => file !== null && file !== undefined, {
    message: "Selfie photo is required",
  }),
})

type KYCFormValues = z.infer<typeof kycSchema>

interface KYCVerificationFormProps {
  onSubmit: (data: KYCFormData) => Promise<void>
  isLoading: boolean
}

export function KYCVerificationForm({ onSubmit, isLoading }: KYCVerificationFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showIdTypePicker, setShowIdTypePicker] = useState(false)
  const [showNationalityPicker, setShowNationalityPicker] = useState(false)
  const [idPhoto, setIdPhoto] = useState<File | null>(null)
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<KYCFormValues>({
    resolver: zodResolver(kycSchema),
    mode: "onChange",
  })

  const idType = watch("idType")
  const nationality = watch("nationality")

  const handleIdTypeSelect = (value: string) => {
    setValue("idType", value as any, { shouldValidate: true })
    setShowIdTypePicker(false)
  }

  const handleNationalitySelect = (value: string) => {
    setValue("nationality", value, { shouldValidate: true })
    setShowNationalityPicker(false)
  }

  const handleNext = async () => {
    let fieldsToValidate: (keyof KYCFormValues)[] = []

    if (step === 1) {
      fieldsToValidate = ["fullName", "dateOfBirth", "nationality"]
    } else if (step === 2) {
      fieldsToValidate = ["idType", "idNumber", "address", "city", "postalCode"]
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep((step + 1) as 1 | 2 | 3)
    }
  }

  const handleBack = () => {
    setStep((step - 1) as 1 | 2 | 3)
  }

  const onFormSubmit = async (data: KYCFormValues) => {
    await onSubmit({
      ...data,
      idPhoto,
      selfiePhoto,
    } as KYCFormData)
  }

  const selectedIdType = ID_TYPES.find((t) => t.value === idType)

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex-1 h-2 border-2 border-foreground ${
                s <= step ? "bg-primary" : "bg-card"
              }`}
            />
            {s < 3 && <div className="w-2" />}
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm font-bold uppercase text-muted-foreground">
          Step {step} of 3
        </p>
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <BrutalCard className="p-6 space-y-4">
          <div className="mb-4">
            <h3 className="text-xl font-bold uppercase mb-1">Personal Information</h3>
            <p className="text-sm text-muted-foreground">
              Please provide your legal name as it appears on your ID
            </p>
          </div>

          <BrutalInput
            label="Full Legal Name"
            placeholder="John Doe"
            {...register("fullName")}
            error={errors.fullName?.message}
          />

          <BrutalInput
            label="Date of Birth"
            type="date"
            {...register("dateOfBirth")}
            error={errors.dateOfBirth?.message}
          />

          {/* Nationality Picker */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide">Nationality</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNationalityPicker(!showNationalityPicker)}
                className={`w-full border-3 border-foreground bg-card px-4 py-3 text-left font-medium flex items-center justify-between brutal-shadow hover:brutal-hover transition-all ${
                  errors.nationality ? "border-destructive" : ""
                }`}
              >
                <span className={nationality ? "" : "text-muted-foreground"}>
                  {nationality || "Select your nationality"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showNationalityPicker && (
                <BrutalCard className="absolute z-10 w-full mt-2 max-h-60 overflow-y-auto">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => handleNationalitySelect(country)}
                      className="w-full px-4 py-3 text-left hover:bg-primary/20 flex items-center justify-between border-b-2 border-foreground last:border-b-0"
                    >
                      <span className="font-medium">{country}</span>
                      {nationality === country && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </BrutalCard>
              )}
            </div>
            {errors.nationality && (
              <p className="text-xs text-destructive font-medium">{errors.nationality.message}</p>
            )}
          </div>
        </BrutalCard>
      )}

      {/* Step 2: Identity Document & Address */}
      {step === 2 && (
        <BrutalCard className="p-6 space-y-4">
          <div className="mb-4">
            <h3 className="text-xl font-bold uppercase mb-1">Identity Document</h3>
            <p className="text-sm text-muted-foreground">
              Provide your government-issued ID details
            </p>
          </div>

          {/* ID Type Picker */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide">Document Type</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIdTypePicker(!showIdTypePicker)}
                className={`w-full border-3 border-foreground bg-card px-4 py-3 text-left font-medium flex items-center justify-between brutal-shadow hover:brutal-hover transition-all ${
                  errors.idType ? "border-destructive" : ""
                }`}
              >
                <span className={selectedIdType ? "" : "text-muted-foreground"}>
                  {selectedIdType?.label || "Select ID type"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showIdTypePicker && (
                <BrutalCard className="absolute z-10 w-full mt-2">
                  {ID_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleIdTypeSelect(type.value)}
                      className="w-full px-4 py-3 text-left hover:bg-primary/20 flex items-center justify-between border-b-2 border-foreground last:border-b-0"
                    >
                      <span className="font-medium">{type.label}</span>
                      {idType === type.value && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </BrutalCard>
              )}
            </div>
            {errors.idType && (
              <p className="text-xs text-destructive font-medium">{errors.idType.message}</p>
            )}
          </div>

          <BrutalInput
            label="ID Number"
            placeholder="Enter your ID number"
            {...register("idNumber")}
            error={errors.idNumber?.message}
          />

          <BrutalInput
            label="Street Address"
            placeholder="123 Main Street, Apt 4B"
            {...register("address")}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <BrutalInput
              label="City"
              placeholder="Jakarta"
              {...register("city")}
              error={errors.city?.message}
            />
            <BrutalInput
              label="Postal Code"
              placeholder="12345"
              {...register("postalCode")}
              error={errors.postalCode?.message}
            />
          </div>
        </BrutalCard>
      )}

      {/* Step 3: Document Upload */}
      {step === 3 && (
        <BrutalCard className="p-6 space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold uppercase mb-1">Upload Documents</h3>
            <p className="text-sm text-muted-foreground">
              Please upload clear photos of your ID and a selfie
            </p>
          </div>

          <DocumentUpload
            label="ID Photo"
            description="Take a clear photo of your ID document. Make sure all text is readable."
            file={idPhoto}
            onFileSelect={(file) => {
              setIdPhoto(file)
              setValue("idPhoto", file, { shouldValidate: true })
            }}
            error={errors.idPhoto?.message as string}
            icon="document"
          />

          <DocumentUpload
            label="Selfie Photo"
            description="Take a selfie holding your ID next to your face. Make sure both are clearly visible."
            file={selfiePhoto}
            onFileSelect={(file) => {
              setSelfiePhoto(file)
              setValue("selfiePhoto", file, { shouldValidate: true })
            }}
            error={errors.selfiePhoto?.message as string}
            icon="camera"
          />

          <div className="bg-primary/10 border-3 border-foreground p-4">
            <p className="text-xs font-medium">
              📝 <span className="font-bold">Tips for a good photo:</span>
              <br />
              • Ensure good lighting
              <br />
              • Keep the camera steady
              <br />
              • Make sure text is readable
              <br />• No glare or shadows
            </p>
          </div>
        </BrutalCard>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <BrutalButton type="button" variant="outline" onClick={handleBack} className="flex-1">
            Back
          </BrutalButton>
        )}

        {step < 3 ? (
          <BrutalButton type="button" onClick={handleNext} className="flex-1">
            Next
          </BrutalButton>
        ) : (
          <BrutalButton type="submit" className="flex-1" isLoading={isLoading}>
            Submit for Review
          </BrutalButton>
        )}
      </div>

      {/* Info Note */}
      {step === 3 && (
        <div className="bg-accent/10 border-3 border-foreground p-4">
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ <span className="font-bold">Note:</span> This is a mock submission. Xellar API
            integration is still in progress. Your KYC status will be set to "Pending Review".
          </p>
        </div>
      )}
    </form>
  )
}
