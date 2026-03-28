import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  blockType?: string
}

interface State {
  hasError: boolean
}

export default class BlockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[BlockErrorBoundary] Erro no bloco "${this.props.blockType}":`, error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6.5v4" />
              <circle cx="10" cy="13.5" r="0.5" fill="#EF4444" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            Erro ao renderizar este bloco
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
