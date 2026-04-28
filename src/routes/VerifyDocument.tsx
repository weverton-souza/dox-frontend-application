import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { verifyDocument, formatVerificationCode, type PublicVerifyResponse } from '@/lib/api/public-verify-api'

type LoadState =
  | { state: 'loading' }
  | { state: 'ready'; data: PublicVerifyResponse }
  | { state: 'error'; message: string }

export default function VerifyDocument() {
  const { code } = useParams<{ code: string }>()
  const [load, setLoad] = useState<LoadState>({ state: 'loading' })

  useEffect(() => {
    if (!code) {
      setLoad({ state: 'error', message: 'Código não informado' })
      return
    }

    let cancelled = false
    verifyDocument(code)
      .then((data) => {
        if (!cancelled) setLoad({ state: 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setLoad({ state: 'error', message: 'Não foi possível validar o documento. Tente novamente.' })
      })
    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {load.state === 'loading' && <Loading />}
        {load.state === 'error' && <ErrorPanel message={load.message} />}
        {load.state === 'ready' && load.data.valid && <ValidPanel data={load.data} />}
        {load.state === 'ready' && !load.data.valid && <InvalidPanel reason={load.data.reason} />}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        DoxHub · Verificação de autenticidade de documentos
      </p>
    </div>
  )
}

function Loading() {
  return (
    <div className="px-8 py-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
        <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-4 text-sm text-gray-500">Validando documento...</p>
    </div>
  )
}

function ValidPanel({ data }: { data: PublicVerifyResponse }) {
  return (
    <>
      <div className="px-8 pt-10 pb-8 text-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
          <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Documento autêntico</h1>
        <p className="mt-1 text-sm text-gray-500">Este relatório foi emitido oficialmente pela DoxHub.</p>
      </div>

      {data.verificationCode && (
        <div className="px-8 pb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Código</p>
          <p className="font-mono text-base text-gray-900">{formatVerificationCode(data.verificationCode)}</p>
        </div>
      )}
    </>
  )
}

function InvalidPanel({ reason }: { reason: string | undefined }) {
  const message =
    reason === 'not_found'
      ? 'Não encontramos nenhum documento com esse código. Confira se digitou corretamente.'
      : 'Este documento não pode ser validado.'

  return (
    <div className="px-8 pt-10 pb-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
        <svg className="w-9 h-9 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-gray-900">Documento não validado</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="px-8 pt-10 pb-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100">
        <svg className="w-9 h-9 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-gray-900">Erro ao validar</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
    </div>
  )
}

