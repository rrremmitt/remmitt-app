"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { BrutalCard } from "@/components/ui/brutal-card"
import {
  FileText,
  Shield,
  Eye,
  Gavel,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react"

interface LegalSection {
  title: string
  icon: any
  content: string[]
  lastUpdated: string
}

const legalSections: LegalSection[] = [
  {
    title: "Terms of Service",
    icon: Gavel,
    lastUpdated: "November 15, 2024",
    content: [
      "Welcome to Remitt. By using our service, you agree to these terms.",
      "",
      "Eligibility: You must be 18+ and legally able to send money internationally.",
      "",
      "Account Responsibilities: You're responsible for keeping your account secure and for all activities under your account.",
      "",
      "Transfer Services: We provide money transfer services to Indonesia. All transfers are subject to our terms and applicable laws.",
      "",
      "Fees: We charge transparent fees as displayed before each transaction. No hidden charges.",
      "",
      "Prohibited Uses: You may not use Remitt for illegal activities, fraud, or sanctioned transactions.",
      "",
      "Account Termination: We may suspend or terminate accounts that violate these terms."
    ]
  },
  {
    title: "Privacy Policy",
    icon: Shield,
    lastUpdated: "November 15, 2024",
    content: [
      "Your privacy is important to us. Here's how we handle your data:",
      "",
      "Information We Collect:",
      "• Personal information (name, email, phone)",
      "• Financial information (bank details, transaction history)",
      "• Device and usage data",
      "• ID verification documents",
      "",
      "How We Use Your Information:",
      "• Provide and improve our services",
      "• Prevent fraud and ensure security",
      "• Comply with legal requirements",
      "• Communicate with you about your account",
      "",
      "Data Protection: We use bank-level encryption and security measures to protect your data.",
      "",
      "Data Sharing: We only share information when required by law or with your consent.",
      "",
      "Your Rights: You can access, update, or delete your personal information at any time."
    ]
  },
  {
    title: "Cookie Policy",
    icon: Eye,
    lastUpdated: "November 15, 2024",
    content: [
      "We use cookies and similar technologies to improve your experience:",
      "",
      "Essential Cookies: Required for our service to function properly.",
      "",
      "Analytics Cookies: Help us understand how you use our app to improve it.",
      "",
      "Security Cookies: Help protect against fraud and attacks.",
      "",
      "You can control cookies through your browser settings, but this may affect app functionality."
    ]
  },
  {
    title: "Data Processing Agreement",
    icon: FileText,
    lastUpdated: "November 15, 2024",
    content: [
      "As a data processor, we commit to:",
      "",
      "Processing data only according to your instructions",
      "",
      "Implementing appropriate security measures",
      "",
      "Not using data for unauthorized purposes",
      "",
      "Assisting with data subject requests",
      "",
      "Deleting data upon request or contract termination",
      "",
      "Providing documentation of our compliance practices"
    ]
  }
]

export default function TermsPage() {
  const [expandedSection, setExpandedSection] = useState<number | null>(null)

  const toggleExpanded = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index)
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Terms & Privacy" showBack={true} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-foreground">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">Legal Information</h1>
          <p className="text-muted-foreground">Our terms, privacy, and data policies</p>
        </div>

        {/* Last Updated Notice */}
        <BrutalCard className="p-4 bg-muted">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">Last Updated:</span>
            <span className="text-muted-foreground">November 15, 2024</span>
          </div>
        </BrutalCard>

        {/* Download All Documents */}
        <BrutalCard className="p-4 bg-accent text-center">
          <Download className="w-6 h-6 mx-auto mb-2" />
          <p className="font-bold text-sm mb-1">Download All Documents</p>
          <p className="text-xs">Get PDF versions of all legal documents</p>
        </BrutalCard>

        {/* Legal Sections */}
        <div className="space-y-4">
          {legalSections.map((section, index) => {
            const Icon = section.icon
            const isExpanded = expandedSection === index

            return (
              <BrutalCard key={index} className="overflow-hidden">
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 border-2 border-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{section.title}</p>
                    <p className="text-xs text-muted-foreground">Updated {section.lastUpdated}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="border-2 border-foreground p-4 bg-card">
                      <div className="space-y-3 text-sm">
                        {section.content.map((paragraph, pIndex) => (
                          <p key={pIndex} className="leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Action buttons for expanded section */}
                      <div className="mt-4 pt-4 border-2 border-foreground flex gap-2">
                        <button className="flex-1 bg-primary px-3 py-2 font-bold text-xs border-2 border-foreground brutal-hover">
                          Download PDF
                        </button>
                        <button className="flex-1 bg-card px-3 py-2 font-bold text-xs border-2 border-foreground brutal-hover">
                          Print
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </BrutalCard>
            )
          })}
        </div>

        {/* Contact Legal */}
        <BrutalCard className="p-4 bg-card">
          <h3 className="font-bold uppercase text-sm tracking-wide mb-3">Legal Questions?</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Gavel className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm">Legal Department</p>
                <p className="text-xs text-muted-foreground">legal@remitt.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm">Privacy Officer</p>
                <p className="text-xs text-muted-foreground">privacy@remitt.app</p>
              </div>
            </div>
          </div>
        </BrutalCard>

        {/* Regulatory Information */}
        <BrutalCard className="p-4 bg-muted">
          <h3 className="font-bold uppercase text-sm tracking-wide mb-3">Regulatory Compliance</h3>
          <div className="space-y-2 text-xs">
            <p className="font-bold">Registered with:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Financial Crimes Enforcement Network (FinCEN)</li>
              <li>• State regulatory authorities</li>
              <li>• Compliant with Bank Secrecy Act</li>
              <li>• Anti-Money Laundering (AML) certified</li>
              <li>• Know Your Customer (KYC) compliant</li>
            </ul>
          </div>
        </BrutalCard>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <BrutalCard className="p-3 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-bold">FAQs</p>
          </BrutalCard>
          <BrutalCard className="p-3 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-bold">Security</p>
          </BrutalCard>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}