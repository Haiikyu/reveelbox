// utils/affiliate.ts - Utilitaires côté client
export const AffiliateClientUtils = {
  // Copier le lien d'affiliation dans le presse-papier
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      }
    } catch (error) {
      console.error('Erreur copie presse-papier:', error)
      return false
    }
  },

  // Partager sur les réseaux sociaux
  shareOnSocial(platform: string, link: string, message: string): void {
    const encodedLink = encodeURIComponent(link)
    const encodedMessage = encodeURIComponent(message)
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}&hashtags=ReveelBox,Unboxing,Gaming`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
      whatsapp: `https://wa.me/?text=${encodedMessage} ${encodedLink}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      reddit: `https://reddit.com/submit?url=${encodedLink}&title=${encodedMessage}`
    }
    
    const shareUrl = shareUrls[platform]
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  },

  // Formater les nombres pour l'affichage
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  },

  // Calculer la couleur basée sur le pourcentage
  getPercentageColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  },

  // Générer un QR code pour le lien d'affiliation (nécessite une bibliothèque)
  generateQRCodeUrl(affiliateLink: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateLink)}`
  }
}