// components/Chat/CaptchaVerification.jsx
import React, { useRef, useEffect } from 'react'

interface CaptchaVerificationProps {
  onVerify: (token: string) => void
  onError: (message: string) => void
}

const CaptchaVerification = ({ onVerify, onError }: CaptchaVerificationProps) => {
  const recaptchaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Charger reCAPTCHA
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      window.grecaptcha.ready(() => {
        console.log('reCAPTCHA ready')
      })
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleCaptcha = (token: string | null) => {
    if (token) {
      onVerify(token)
    } else {
      onError('Captcha verification failed')
    }
  }

  return (
    <div className="text-center p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Vérification anti-bot requise :
      </p>
      <div
        ref={recaptchaRef}
        className="g-recaptcha inline-block"
        data-sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
        data-callback="onCaptchaSuccess"
        data-expired-callback="onCaptchaExpired"
      />
    </div>
  )
}

// Callbacks globaux pour reCAPTCHA
declare global {
  interface Window {
    onCaptchaSuccess: (token: string) => void
    onCaptchaExpired: () => void
    grecaptcha: any
  }
}

window.onCaptchaSuccess = (token: string) => {
  window.dispatchEvent(new CustomEvent('captcha-success', { detail: token }))
}

window.onCaptchaExpired = () => {
  window.dispatchEvent(new CustomEvent('captcha-expired'))
}

export default CaptchaVerification