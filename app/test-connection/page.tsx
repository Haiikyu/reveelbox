// app/test-connection/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function TestConnection() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const testSignUp = async () => {
    setLoading(true)
    setResult('Tentative d\'inscription...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: 'testuser'
          }
        }
      })

      if (error) {
        setResult(`❌ Erreur inscription: ${error.message}`)
      } else {
        setResult(`✅ Inscription réussie! User ID: ${data.user?.id}`)
      }
    } catch (error) {
      setResult(`💥 Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    setResult('Tentative de connexion...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`❌ Erreur connexion: ${error.message}`)
      } else {
        setResult(`✅ Connexion réussie! User ID: ${data.user?.id}`)
      }
    } catch (error) {
      setResult(`💥 Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    setLoading(true)
    setResult('Vérification session...')
    
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setResult(`❌ Erreur session: ${error.message}`)
      } else if (data.session) {
        setResult(`✅ Session active! User: ${data.session.user.email}`)
      } else {
        setResult(`⚠️ Aucune session active`)
      }
    } catch (error) {
      setResult(`💥 Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testDatabase = async () => {
    setLoading(true)
    setResult('Test base de données...')
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        setResult(`❌ Erreur DB: ${error.message}`)
      } else {
        setResult(`✅ Base de données accessible!`)
      }
    } catch (error) {
      setResult(`💥 Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Test Connexion Supabase</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="password123"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={testSignUp}
            disabled={loading}
            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            S'inscrire
          </button>
          
          <button
            onClick={testSignIn}
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Se connecter
          </button>
          
          <button
            onClick={testSession}
            disabled={loading}
            className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            Test Session
          </button>
          
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            Test DB
          </button>
        </div>

        {result && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  )
}