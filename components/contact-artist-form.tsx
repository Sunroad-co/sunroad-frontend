'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TurnstileCaptcha, TurnstileCaptchaHandle } from '@/components/auth/TurnstileCaptcha'

interface ContactArtistFormProps {
  artistHandle: string
  displayName: string
  onSuccess: () => void
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
  general?: string
}

export default function ContactArtistForm({
  artistHandle,
  displayName,
  onSuccess,
}: ContactArtistFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const turnstileRef = useRef<TurnstileCaptchaHandle>(null)

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      return false
    }
    if (email.length > 320) {
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate name
    const nameTrimmed = name.trim()
    if (!nameTrimmed) {
      newErrors.name = 'Name is required'
    } else if (nameTrimmed.length < 1) {
      newErrors.name = 'Name is required'
    } else if (nameTrimmed.length > 120) {
      newErrors.name = 'Name must be 120 characters or less'
    } else if (name.includes('\n') || name.includes('\r')) {
      newErrors.name = 'Name cannot contain line breaks'
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    } else if (email.length > 320) {
      newErrors.email = 'Email must be 320 characters or less'
    }

    // Validate subject
    const subjectTrimmed = subject.trim()
    if (!subjectTrimmed) {
      newErrors.subject = 'Subject is required'
    } else if (subjectTrimmed.length < 1) {
      newErrors.subject = 'Subject is required'
    } else if (subjectTrimmed.length > 160) {
      newErrors.subject = 'Subject must be 160 characters or less'
    } else if (subject.includes('\n') || subject.includes('\r')) {
      newErrors.subject = 'Subject cannot contain line breaks'
    }

    // Validate message
    const messageTrimmed = message.trim()
    if (!messageTrimmed) {
      newErrors.message = 'Message is required'
    } else if (messageTrimmed.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    } else if (message.length > 2000) {
      newErrors.message = 'Message must be 2000 characters or less'
    }

    // Validate Turnstile token
    if (!turnstileToken) {
      newErrors.general = 'Please complete the verification'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL is not configured')
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/contact-artist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist_handle: artistHandle,
          from_name: name.trim(),
          from_email: email.trim(),
          subject: subject.trim().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, ''),
          message: message.trim(),
          turnstile_token: turnstileToken,
        }),
      })

      const data = await response.json().catch(() => ({}))

      // The Edge Function may return ok:true even on rejection (anti-abuse)
      // Always show generic success message
      if (response.ok && (data.ok === true || !data.error)) {
        setIsSuccess(true)
        // Clear form
        setName('')
        setEmail('')
        setSubject('')
        setMessage('')
        setTurnstileToken(null)
        turnstileRef.current?.reset()
      } else {
        // Handle error response
        setErrors({
          general: 'Failed to send message. Please try again later.',
        })
      }
    } catch (error) {
      console.error('Error sending contact message:', error)
      setErrors({
        general: 'Failed to send message. Please check your connection and try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Message sent</h3>
        <p className="text-sm text-gray-600 mb-6">
         { `Message sent. If ${displayName} replies, you'll receive an email.`}
        </p>
        <Button
          onClick={onSuccess}
          className="bg-gradient-to-b from-sunroad-amber-500 to-sunroad-amber-600 hover:from-sunroad-amber-600 hover:to-sunroad-amber-700 text-white font-medium"
        >
          Close
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700 mb-2 block">
          Your Name
        </Label>
        <Input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: undefined }))
            }
          }}
          disabled={isLoading}
          placeholder="eg. Rick Rubin"
          className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
          aria-describedby={errors.name ? 'name-error' : undefined}
          maxLength={120}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">{name.length}/120 characters</p>
      </div>

      {/* Email Field */}
      <div>
        <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700 mb-2 block">
          Your Email
        </Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: undefined }))
            }
          }}
          disabled={isLoading}
          className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
          aria-describedby={errors.email ? 'email-error' : undefined}
          maxLength={320}
          placeholder="realrickrubin@gmail.com"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">{email.length}/320 characters</p>
      </div>

      {/* Subject Field */}
      <div>
        <Label htmlFor="contact-subject" className="text-sm font-medium text-gray-700 mb-2 block">
          Subject
        </Label>
        <Input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value)
            if (errors.subject) {
              setErrors((prev) => ({ ...prev, subject: undefined }))
            }
          }}
          disabled={isLoading}
          className={errors.subject ? 'border-red-500 focus:ring-red-500' : ''}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          maxLength={160}
          placeholder="What do you want to talk about?"
        />
        {errors.subject && (
          <p id="subject-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.subject}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">{subject.length}/160 characters</p>
      </div>

      {/* Message Field */}
      <div>
        <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 mb-2 block">
          Message
        </Label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (errors.message) {
              setErrors((prev) => ({ ...prev, message: undefined }))
            }
          }}
          disabled={isLoading}
          rows={6}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent resize-none ${
            errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          aria-describedby={errors.message ? 'message-error' : undefined}
          maxLength={2000}
          placeholder="Write your message here..."
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">{message.length}/2000 characters</p>
      </div>

      {/* Turnstile Captcha */}
      <div>
        <TurnstileCaptcha
          ref={turnstileRef}
          onToken={(token) => {
            setTurnstileToken(token)
            if (errors.general && token) {
              setErrors((prev) => ({ ...prev, general: undefined }))
            }
          }}
          onExpire={() => {
            setTurnstileToken(null)
          }}
          onError={() => {
            setTurnstileToken(null)
          }}
          className="my-2"
          size="normal"
        />
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600" role="alert">
            {errors.general}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={
            isLoading ||
            !turnstileToken ||
            !name.trim() ||
            !email.trim() ||
            !validateEmail(email) ||
            !subject.trim() ||
            !message.trim() ||
            message.trim().length < 10
          }
          className="bg-gradient-to-b from-sunroad-amber-500 to-sunroad-amber-600 hover:from-sunroad-amber-600 hover:to-sunroad-amber-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}
