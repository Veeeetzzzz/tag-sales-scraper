import '../styles/globals.css'
import { CurrencyProvider } from '../contexts/CurrencyContext'

export default function App({ Component, pageProps }) {
  return (
    <CurrencyProvider>
      <Component {...pageProps} />
    </CurrencyProvider>
  )
} 