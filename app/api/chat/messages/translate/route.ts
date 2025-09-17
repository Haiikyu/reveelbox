// Fichier: app/api/chat/messages/translate/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const translateSchema = z.object({
  message_id: z.string().uuid(),
  target_language: z.string().min(2).max(5)
});

// Fonction simple de traduction (à remplacer par une vraie API)
const translateText = async (text: string, targetLang: string): Promise<string> => {
  // Pour la démo, on simule une traduction
  // En production, utiliser Google Translate API, DeepL, etc.
  const translations: Record<string, Record<string, string>> = {
    'hello': { 'fr': 'bonjour', 'es': 'hola', 'de': 'hallo' },
    'goodbye': { 'fr': 'au revoir', 'es': 'adiós', 'de': 'auf wiedersehen' },
    'thanks': { 'fr': 'merci', 'es': 'gracias', 'de': 'danke' }
  };

  // Traduction basique pour la démo
  const lowerText = text.toLowerCase();
  for (const [key, values] of Object.entries(translations)) {
    if (lowerText.includes(key)) {
      return text.replace(new RegExp(key, 'gi'), values[targetLang] || key);
    }
  }

  // Si pas de traduction trouvée, retourner le texte original avec un préfixe
  return `[${targetLang.toUpperCase()}] ${text}`;
};

// POST /api/chat/messages/translate - Traduire un message
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = translateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { message_id, target_language } = validationResult.data;

    // Récupérer le message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('content, translated_text')
      .eq('id', message_id)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
    }

    // Vérifier si la traduction existe déjà
    const existingTranslations = message.translated_text as Record<string, string> || {};
    if (existingTranslations[target_language]) {
      return NextResponse.json({
        success: true,
        data: { text: existingTranslations[target_language] }
      });
    }

    // Traduire le texte
    const translatedText = await translateText(message.content, target_language);

    // Sauvegarder la traduction
    const newTranslations = {
      ...existingTranslations,
      [target_language]: translatedText
    };

    await supabase
      .from('chat_messages')
      .update({ translated_text: newTranslations })
      .eq('id', message_id);

    return NextResponse.json({
      success: true,
      data: { text: translatedText }
    });

  } catch (error) {
    console.error('Erreur traduction:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}