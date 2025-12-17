"use client"

import { useState } from "react"
import { BrutalCard } from "@/components/ui/brutal-card"
import { Upload, X, CheckCircle2, Camera, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentUploadProps {
  label: string
  description: string
  file: File | null
  onFileSelect: (file: File | null) => void
  error?: string
  icon?: "camera" | "document"
}

export function DocumentUpload({ 
  label, 
  description, 
  file, 
  onFileSelect, 
  error,
  icon = "document" 
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        onFileSelect(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    onFileSelect(null)
  }

  const IconComponent = icon === "camera" ? Camera : FileImage

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold uppercase tracking-wide">
        {label}
      </label>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      
      {!file ? (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "block border-3 border-dashed border-foreground bg-card p-6 brutal-shadow cursor-pointer transition-all hover:brutal-hover",
            dragActive && "bg-primary/20 scale-[0.98]",
            error && "border-destructive"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <IconComponent className="w-8 h-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-bold uppercase">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
          </div>
        </label>
      ) : (
        <BrutalCard className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="flex-shrink-0 p-1 hover:bg-destructive/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </BrutalCard>
      )}
      
      {error && (
        <p className="text-xs text-destructive font-medium mt-1">{error}</p>
      )}
    </div>
  )
}
