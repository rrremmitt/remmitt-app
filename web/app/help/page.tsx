"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { BrutalCard } from "@/components/ui/brutal-card"
import {
  HelpCircle,
  Send,
  DollarSign,
  Clock,
  Shield,
  Users,
  CreditCard,
  Smartphone,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
  icon: any
}

const faqData: FAQItem[] = [
  {
    question: "How do I send money to Indonesia?",
    answer: "Simply add your recipient's bank details, enter the amount, and confirm. Your money will arrive within 15 minutes to most Indonesian banks.",
    category: "Sending Money",
    icon: Send
  },
  {
    question: "What are the transfer fees?",
    answer: "We charge near-zero fees! Most transfers under $1,000 cost just 1.4% + $0.25. No hidden fees or surprise charges.",
    category: "Fees & Limits",
    icon: DollarSign
  },
  {
    question: "How long do transfers take?",
    answer: "Most transfers to Indonesian banks arrive within 15 minutes. Sometimes it can take up to 2 hours depending on the recipient's bank.",
    category: "Sending Money",
    icon: Clock
  },
  {
    question: "Is my money safe with Remitt?",
    answer: "Yes! We use bank-level encryption, 2FA, and are regulated by financial authorities. Your funds are protected and insured.",
    category: "Security",
    icon: Shield
  },
  {
    question: "Which Indonesian banks do you support?",
    answer: "We support all major Indonesian banks including BCA, BNI, BRI, Mandiri, CIMB Niaga, and over 150 others.",
    category: "Sending Money",
    icon: CreditCard
  },
  {
    question: "What are my transfer limits?",
    answer: "Initial limit is $500/day. After verification, you can send up to $10,000/day. Limits vary by country and verification status.",
    category: "Fees & Limits",
    icon: DollarSign
  },
  {
    question: "How do I verify my identity?",
    answer: "Go to Profile → Verify Identity and upload your ID and a selfie. Verification usually takes 5-10 minutes during business hours.",
    category: "Account",
    icon: Users
  },
  {
    question: "What currencies do you support?",
    answer: "Currently we support sending USD to IDR. We're constantly adding more currencies and countries.",
    category: "Sending Money",
    icon: DollarSign
  }
]

const categories = ["All", "Sending Money", "Fees & Limits", "Security", "Account"]

export default function HelpCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  const filteredFAQs = selectedCategory === "All"
    ? faqData
    : faqData.filter(item => item.category === selectedCategory)

  const toggleExpanded = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index)
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Help Center" showBack={true} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-foreground">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">How Can We Help?</h1>
          <p className="text-muted-foreground">Find answers to common questions</p>
        </div>

        {/* Quick Contact */}
        <BrutalCard className="p-4 bg-accent text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-bold mb-1">Still Need Help?</p>
          <p className="text-sm">Chat with our support team 24/7</p>
        </BrutalCard>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase text-sm tracking-wide">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 font-bold text-xs uppercase border-3 transition-all ${
                  selectedCategory === category
                    ? "bg-primary border-foreground"
                    : "bg-card border-foreground hover:bg-muted"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase text-sm tracking-wide">
            {selectedCategory === "All" ? "All Questions" : selectedCategory}
          </h3>

          {filteredFAQs.map((item, index) => {
            const Icon = item.icon
            const isExpanded = expandedItem === index

            return (
              <BrutalCard key={index} className="overflow-hidden">
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 border-2 border-foreground">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.question}</p>
                    {item.category !== "All" && (
                      <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="ml-11 p-3 bg-muted border-2 border-foreground">
                      <p className="text-sm leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                )}
              </BrutalCard>
            )
          })}
        </div>

        {/* Popular Topics */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase text-sm tracking-wide">Popular Topics</h3>
          <div className="grid grid-cols-2 gap-3">
            <BrutalCard className="p-3 text-center">
              <Smartphone className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-bold">Mobile App</p>
            </BrutalCard>
            <BrutalCard className="p-3 text-center">
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-bold">Payment Methods</p>
            </BrutalCard>
            <BrutalCard className="p-3 text-center">
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-bold">Security</p>
            </BrutalCard>
            <BrutalCard className="p-3 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-bold">Transfer Times</p>
            </BrutalCard>
          </div>
        </div>

        {/* Contact Support */}
        <BrutalCard className="p-4 bg-card">
          <h3 className="font-bold uppercase text-sm tracking-wide mb-3">Contact Support</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm">Live Chat</p>
                <p className="text-xs text-muted-foreground">Available 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm">WhatsApp</p>
                <p className="text-xs text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm">Email</p>
                <p className="text-xs text-muted-foreground">support@remitt.app</p>
              </div>
            </div>
          </div>
        </BrutalCard>
      </div>

      <BottomNav />
    </main>
  )
}