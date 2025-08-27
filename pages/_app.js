import '../styles/globals.css'
import { CurrencyProvider } from '../contexts/CurrencyContext'
import { LanguageProvider } from '../contexts/LanguageContext'

export default function App({ Component, pageProps }) {
  return (
    <CurrencyProvider>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </CurrencyProvider>
  )
} 