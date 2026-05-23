"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface CurrencyContextType {
  currency: string
  symbol: string
  rate: number
  loading: boolean
  supportedCurrencies: { code: string; symbol: string; name: string }[]
  setCurrency: (code: string) => void
  formatPrice: (priceInINR: number, maximumFractionDigits?: number) => string
  convertPrice: (priceInINR: number) => number
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "INR",
  symbol: "₹",
  rate: 1.0,
  loading: true,
  supportedCurrencies: [],
  setCurrency: () => {},
  formatPrice: (p) => `₹${p}`,
  convertPrice: (p) => p,
})

export const useCurrency = () => useContext(CurrencyContext)

// Whitelist of currencies supported by Razorpay for order creation
const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R ", name: "South African Rand" },
]

const SYMBOL_MAP: Record<string, string> = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr.symbol
  return acc
}, {} as Record<string, string>)

const DEFAULT_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  CAD: 0.016,
  AUD: 0.018,
  AED: 0.044,
  SGD: 0.016,
  JPY: 1.86,
  HKD: 0.093,
  MYR: 0.056,
  NZD: 0.020,
  ZAR: 0.22,
}

interface CurrencyProviderProps {
  children?: ReactNode
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrencyState] = useState<string>("INR")
  const [symbol, setSymbol] = useState<string>("₹")
  const [rate, setRate] = useState<number>(1.0)
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES)
  const [loading, setLoading] = useState<boolean>(true)

  // 1. Set currency manually or automatically
  const setCurrency = (code: string) => {
    const upperCode = code.toUpperCase()
    const target = SUPPORTED_CURRENCIES.find((c) => c.code === upperCode) ? upperCode : "USD"
    setCurrencyState(target)
    setSymbol(SYMBOL_MAP[target] || "$")
    setRate(rates[target] || DEFAULT_RATES[target] || 0.012)
    localStorage.setItem("grabnext-user-currency", target)
  }

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // Load cached/stored currency choice first
        const savedCurrency = localStorage.getItem("grabnext-user-currency")
        
        // 2. Fetch Exchange Rates (Cached for 12 hours)
        let activeRates = DEFAULT_RATES
        const cachedRatesStr = localStorage.getItem("grabnext-exchange-rates")
        const cachedRatesTimeStr = localStorage.getItem("grabnext-exchange-rates-time")
        const now = Date.now()

        if (cachedRatesStr && cachedRatesTimeStr && now - Number(cachedRatesTimeStr) < 12 * 60 * 60 * 1000) {
          try {
            activeRates = JSON.parse(cachedRatesStr)
          } catch (e) {
            console.error("Failed to parse cached rates, using default", e)
          }
        } else {
          try {
            const res = await fetch("https://open.er-api.com/v6/latest/INR")
            if (res.ok) {
              const data = await res.json()
              if (data && data.rates) {
                activeRates = data.rates
                localStorage.setItem("grabnext-exchange-rates", JSON.stringify(data.rates))
                localStorage.setItem("grabnext-exchange-rates-time", String(now))
              }
            }
          } catch (err) {
            console.warn("Failed to fetch live exchange rates, using fallback rates:", err)
          }
        }
        setRates(activeRates)

        // 3. Geolocation IP Lookup if no manual preference saved (Cached for 24 hours)
        let userCurrency = savedCurrency || "INR"

        if (!savedCurrency) {
          const cachedGeoCurrency = localStorage.getItem("grabnext-geo-currency")
          const cachedGeoTime = localStorage.getItem("grabnext-geo-currency-time")

          if (cachedGeoCurrency && cachedGeoTime && now - Number(cachedGeoTime) < 24 * 60 * 60 * 1000) {
            userCurrency = cachedGeoCurrency
          } else {
            try {
              const res = await fetch("https://ipapi.co/json/")
              if (res.ok) {
                const data = await res.json()
                if (data && data.currency) {
                  const detected = data.currency.toUpperCase()
                  // Check if detected currency is supported, else fallback to USD for international
                  userCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === detected)
                    ? detected
                    : data.country_code === "IN" ? "INR" : "USD"
                  
                  localStorage.setItem("grabnext-geo-currency", userCurrency)
                  localStorage.setItem("grabnext-geo-currency-time", String(now))
                }
              }
            } catch (err) {
              console.warn("IP geolocation failed, defaulting to INR:", err)
            }
          }
        }

        // Apply initialized currency
        const validatedCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === userCurrency) ? userCurrency : "USD"
        setCurrencyState(validatedCurrency)
        setSymbol(SYMBOL_MAP[validatedCurrency] || "$")
        setRate(activeRates[validatedCurrency] || DEFAULT_RATES[validatedCurrency] || 0.012)
      } catch (err) {
        console.error("Error initializing currency context:", err)
      } finally {
        setLoading(false)
      }
    }

    initializeCurrency()
  }, [])

  // Update conversion rate if currency or rates change
  useEffect(() => {
    if (rates && currency) {
      setRate(rates[currency] || DEFAULT_RATES[currency] || 0.012)
    }
  }, [currency, rates])

  // Convert numerical price from INR to selected currency
  const convertPrice = (priceInINR: number): number => {
    if (currency === "INR") return priceInINR
    return Number((priceInINR * rate).toFixed(2))
  }

  // Format price from INR to formatted string (e.g. ₹299 -> $3.59)
  const formatPrice = (priceInINR: number, maximumFractionDigits?: number): string => {
    const converted = convertPrice(priceInINR)
    
    // Formatting options
    const maxDigits = maximumFractionDigits !== undefined 
      ? maximumFractionDigits 
      : (currency === "INR" || currency === "JPY" ? 0 : 2)

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: maxDigits,
      }).format(converted)
    } catch (e) {
      const sym = symbol || SYMBOL_MAP[currency] || "$"
      return `${sym}${converted.toFixed(maxDigits)}`
    }
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol,
        rate,
        loading,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        setCurrency,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}
