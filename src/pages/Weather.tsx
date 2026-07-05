import { Component, type ReactNode, useState, useEffect } from 'react'
import { CloudSun, Search, Droplets, Wind, Eye, Umbrella, Sunrise, Sunset, Loader2, AlertCircle } from 'lucide-react'

class WeatherBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
  componentDidCatch(e: unknown) {
    console.error('[Weather] error:', e)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFAFA]">
          <AlertCircle size={32} className="text-[#D97706] mb-4" />
          <p className="text-sm text-[#6B7280]">Something went wrong. Refresh the page.</p>
          <p className="text-xs text-[#9CA3AF] mt-2 font-mono">{this.state.error}</p>
        </div>
      )
    }
    return this.props.children
  }
}

type WeatherData = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    visibility: number
    precipitation: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    sunrise: string[]
    sunset: string[]
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    precipitation_probability: number[]
  }
}

type GeoResult = {
  latitude: number
  longitude: number
  timezone: string
  name: string
  country: string
}

const WMO_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear Sky', icon: '☀️' },
  1: { label: 'Mostly Clear', icon: '🌤' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫' },
  48: { label: 'Rime Fog', icon: '🌫' },
  51: { label: 'Light Drizzle', icon: '🌦' },
  53: { label: 'Drizzle', icon: '🌦' },
  55: { label: 'Heavy Drizzle', icon: '🌧' },
  61: { label: 'Light Rain', icon: '🌧' },
  63: { label: 'Rain', icon: '🌧' },
  65: { label: 'Heavy Rain', icon: '🌧' },
  71: { label: 'Light Snow', icon: '🌨' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy Snow', icon: '❄️' },
  80: { label: 'Light Showers', icon: '🌦' },
  81: { label: 'Showers', icon: '🌧' },
  82: { label: 'Heavy Showers', icon: '⛈' },
  85: { label: 'Snow Showers', icon: '🌨' },
  86: { label: 'Heavy Snow Showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈' },
  96: { label: 'Thunderstorm + Hail', icon: '⛈' },
  99: { label: 'Thunderstorm + Hail', icon: '⛈' },
}

function getWMO(code: number) {
  return WMO_MAP[code] || { label: 'Unknown', icon: '🌡' }
}

function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtHour(h: number) {
  if (h === 0) return '12AM'
  if (h < 12) return h + 'AM'
  if (h === 12) return '12PM'
  return (h - 12) + 'PM'
}

function shortDay(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

async function geocode(city: string): Promise<GeoResult | null> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)
  const data = await res.json()
  if (!data.results?.length) return null
  const r = data.results[0]
  return { latitude: r.latitude, longitude: r.longitude, timezone: r.timezone || 'auto', name: r.name, country: r.country || '' }
}

async function fetchWeather(lat: number, lon: number, tz: string): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: tz,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,visibility,precipitation',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.current || !data.daily || !data.hourly) return null
  return data as WeatherData
}

type Status = 'idle' | 'loading' | 'error' | 'ready'

export default function WeatherPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [input, setInput] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [geo, setGeo] = useState<GeoResult | null>(null)

  const HYDERABAD = { latitude: 17.385, longitude: 78.4867, timezone: 'Asia/Kolkata', name: 'Hyderabad', country: 'IN' }

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const w = await fetchWeather(HYDERABAD.latitude, HYDERABAD.longitude, HYDERABAD.timezone)
      if (cancelled || !w) return
      setInput(HYDERABAD.name)
      setWeather(w)
      setGeo(HYDERABAD)
      setStatus('ready')
    })()
    return () => { cancelled = true }
  }, [])

  async function search(name: string) {
    setStatus('loading')
    setErrorMsg('')
    try {
      const g = await geocode(name)
      if (!g) {
        setErrorMsg(`City "${name}" not found. Try another name.`)
        setStatus('error')
        return
      }
      const w = await fetchWeather(g.latitude, g.longitude, g.timezone)
      if (!w) {
        setErrorMsg('Could not fetch weather data. Try again.')
        setStatus('error')
        return
      }
      setWeather(w)
      setGeo(g)
      setStatus('ready')
    } catch {
      setErrorMsg('Network error. Please check your connection.')
      setStatus('error')
    }
  }

  const wmo = weather && geo ? getWMO(weather.current.weather_code) : null

  let hourlySlice: { time: string; temp: number; code: number; rain: number }[] = []
  if (weather) {
    const now = new Date()
    const startIdx = weather.hourly.time.findIndex(t => new Date(t) >= now)
    const slice = weather.hourly.time.slice(startIdx, startIdx + 24)
    hourlySlice = slice.map((t, i) => ({
      time: t,
      temp: weather.hourly.temperature_2m[startIdx + i],
      code: weather.hourly.weather_code[startIdx + i],
      rain: weather.hourly.precipitation_probability[startIdx + i],
    }))
  }

  function glowStyle() {
    if (!weather) return {}
    const code = weather.current.weather_code
    if (code === 0 || code === 1) return { background: 'radial-gradient(circle at 50% -20%, rgba(255,200,50,0.06) 0%, transparent 60%)' }
    if (code <= 3) return { background: 'radial-gradient(circle at 50% -20%, rgba(150,180,220,0.05) 0%, transparent 60%)' }
    if (code >= 95) return { background: 'radial-gradient(circle at 50% -20%, rgba(180,80,80,0.06) 0%, transparent 60%)' }
    return {}
  }

  return (
    <WeatherBoundary><div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto" style={glowStyle()}>
      {/* HEADER */}
      <div className="flex items-center gap-3 px-8 py-4 border-b border-[#E5E7EB] bg-white">
        <CloudSun size={22} className="text-[#2878D9]" />
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Weather</h1>
        <div className="flex-1" />
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Enter city..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) search(input.trim()) }}
            className="w-full pl-3 pr-10 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#FAFAFA] text-[#111827] outline-none focus:border-[#2878D9] transition-colors"
          />
          <button
            onClick={() => { if (input.trim()) search(input.trim()) }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-[#2878D9] transition-colors"
          >
            <Search size={14} />
          </button>
        </div>
        <button
          onClick={() => search(HYDERABAD.name)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#2878D9] hover:bg-[#2878D9] hover:text-white transition-colors"
        >
          <CloudSun size={13} />Hyderabad
        </button>
      </div>

      <div className="flex-1 px-8 py-8">
        {/* IDLE STATE */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <CloudSun size={48} className="text-[#D1D5DB] mb-4" />
            <p className="text-sm text-[#9CA3AF]">Type a city or click <span className="text-[#2878D9] font-semibold">Hyderabad</span> above.</p>
          </div>
        )}

        {/* LOADING */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 size={28} className="text-[#9CA3AF] animate-spin mb-4" />
            <p className="text-xs text-[#9CA3AF] font-mono tracking-wider">Fetching weather data...</p>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <AlertCircle size={32} className="text-[#D97706] mb-4" />
            <p className="text-sm text-[#6B7280]">{errorMsg}</p>
          </div>
        )}

        {/* WEATHER DATA */}
        {status === 'ready' && weather && geo && wmo && (
          <div className="space-y-6">
            {/* City & Time */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-[#111827] tracking-tight">{geo.name}</h2>
                {geo.country && <p className="text-xs text-[#9CA3AF] font-mono tracking-wider mt-1 uppercase">{geo.country}</p>}
              </div>
              <p className="text-xs text-[#6B7280] font-mono">
                {new Date().toLocaleTimeString('en-US', { timeZone: geo.timezone, hour: '2-digit', minute: '2-digit', hour12: true, weekday: 'short' })}
              </p>
            </div>

            {/* Hero */}
            <div className="flex items-center justify-between py-4 border-b border-[#E5E7EB]">
              <div className="flex items-start">
                <span className="text-7xl sm:text-8xl font-bold text-[#111827] tracking-tighter leading-none">
                  {Math.round(weather.current.temperature_2m)}
                </span>
                <span className="text-2xl font-medium text-[#9CA3AF] mt-2 ml-1">°C</span>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-5xl sm:text-6xl">{wmo.icon}</span>
                <p className="text-sm font-medium text-[#111827]">{wmo.label}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">Feels like {Math.round(weather.current.apparent_temperature)}°</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden">
              {[
                { icon: Droplets, label: 'Humidity', value: weather.current.relative_humidity_2m + '%' },
                { icon: Wind, label: 'Wind', value: Math.round(weather.current.wind_speed_10m) + ' km/h' },
                { icon: Eye, label: 'Visibility', value: weather.current.visibility >= 1000 ? (weather.current.visibility / 1000).toFixed(1) + ' km' : weather.current.visibility + ' m' },
                { icon: Umbrella, label: 'Rain', value: weather.current.precipitation + ' mm' },
                { icon: Sunrise, label: 'Sunrise', value: fmtTime(weather.daily.sunrise[0]) },
                { icon: Sunset, label: 'Sunset', value: fmtTime(weather.daily.sunset[0]) },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 flex flex-col gap-1.5 hover:bg-[#FAFAFA] transition-colors">
                  <s.icon size={16} className="text-[#D1D5DB]" />
                  <span className="text-lg font-semibold text-[#111827]">{s.value}</span>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#9CA3AF]">{s.label}</span>
                </div>
              ))}
            </div>

            {/* 7-Day Forecast */}
            <div>
              <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#9CA3AF] mb-3">7-DAY FORECAST</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-px bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden">
                {weather.daily.time.map((date, i) => {
                  const dwmo = getWMO(weather.daily.weather_code[i])
                  const isToday = i === 0
                  return (
                    <div key={date} className={`bg-white p-4 text-center flex flex-col items-center gap-1.5 hover:bg-[#FAFAFA] transition-colors ${isToday ? 'relative' : ''}`}>
                      {isToday && <div className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-[#2878D9] rounded-b" />}
                      <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${isToday ? 'text-[#2878D9]' : 'text-[#9CA3AF]'}`}>
                        {isToday ? 'TODAY' : shortDay(date)}
                      </span>
                      <span className="text-xl">{dwmo.icon}</span>
                      <span className="text-sm font-semibold text-[#111827]">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                      <span className="text-[11px] text-[#9CA3AF]">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 24-Hour View */}
            <div>
              <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#9CA3AF] mb-3">24-HOUR VIEW</p>
              <div className="flex gap-px bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                {hourlySlice.map((h, i) => {
                  const hwmo = getWMO(h.code)
                  const isNow = i === 0
                  return (
                    <div key={h.time} className={`bg-white p-3 text-center flex-shrink-0 min-w-[60px] flex flex-col items-center gap-1.5 hover:bg-[#FAFAFA] transition-colors ${isNow ? 'relative' : ''}`}>
                      {isNow && <div className="absolute top-0 left-[30%] right-[30%] h-0.5 bg-[#2878D9] rounded-b" />}
                      <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${isNow ? 'text-[#2878D9]' : 'text-[#9CA3AF]'}`}>
                        {isNow ? 'NOW' : fmtHour(new Date(h.time).getHours())}
                      </span>
                      <span className="text-lg">{hwmo.icon}</span>
                      <span className="text-sm font-semibold text-[#111827]">{Math.round(h.temp)}°</span>
                      {h.rain > 0 && <span className="text-[10px] text-[#2878D9] font-mono">💧{h.rain}%</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div></WeatherBoundary>
  )
}
