import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSignInWithEmailPass } from '../../../hooks/api'
import {
  fetchAgencyMe,
  persistAgencySession,
} from '@/lib/agency-session'

export function AgencyLoginView() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const { mutateAsync: signIn } = useSignInWithEmailPass()

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false

    const newCode = [...code]
    newCode[index] = element.value.slice(-1)
    setCode(newCode)

    // Focus next box automatically
    if (element.value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && e.currentTarget.previousSibling) {
      (e.currentTarget.previousSibling as HTMLInputElement).focus()
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      if (mode === 'password') {
        if (!email || !password) {
          throw new Error('Email and password are required.')
        }
        await signIn({ email, password })
        const me = await fetchAgencyMe(email)
        // Same rule as main /login: membership decides destination
        persistAgencySession(me)
        if (me.isAgency) {
          navigate('/agency/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
        return
      }

      const otpValue = code.join('')
      if (otpValue.length < 6) {
        throw new Error('Please enter all 6 digits of your authorization code.')
      }

      // Temp code path: limited store access (publisher + expiry enforced server-side)
      const { redeemTempCodeAndOpen } = await import(
        '@/lib/agency-store-session'
      )
      const redeemed = await redeemTempCodeAndOpen({
        email,
        accessCode: otpValue,
      })
      if (!redeemed.ok) {
        throw new Error(redeemed.error || 'Invalid or expired access code.')
      }
      // redeemTempCodeAndOpen navigates to merchant store with session
      return
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#000000] flex overflow-hidden font-sans text-white">
      <style>{`
        .panel-transition {
          transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.9s ease;
          will-change: transform;
        }
        
        .gradient-panel {
          position: absolute;
          inset: 0;
          z-index: 0;
          transition: clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: clip-path;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .gradient-panel.login-view {
          clip-path: inset(100% 0 0 0 round 0px);
        }
        
        @media (min-width: 1024px) {
          .gradient-panel.login-view {
            clip-path: inset(24px 24px 24px 45% round 24px);
          }
        }
      `}</style>

      {/* Left Sidebar Column - OTP login details */}
      <div className="absolute top-0 left-0 h-full w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 xl:px-24 z-10 bg-[#000000] panel-transition translate-x-0 opacity-100">
        <div className="w-full max-w-[360px] flex flex-col">
          <div className="border-b border-[#262626] pb-6 mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 11V13H16L10.5 18.5L11.92 19.92L19.84 12L11.92 4.08L10.5 5.5L16 11H4Z" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.2" />
              </svg>
              <span className="text-[1.1rem] font-semibold text-white tracking-tight">BentoCo Auth</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FF5A36]/10 border border-[#FF5A36]/20 rounded-full text-[9px] uppercase tracking-wider text-[#FF5A36] font-bold mb-2">
              Agent Gateway
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Agency sign in</h1>
            <p className="text-[#A3A3A3] text-sm">
              Use your Medusa agency credentials (or a temporary access code).
            </p>
            <div className="mt-3 flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setMode("password")}
                className={
                  mode === "password"
                    ? "text-[#FF5A36] font-semibold"
                    : "text-[#737373]"
                }
              >
                Email + password
              </button>
              <span className="text-[#404040]">·</span>
              <button
                type="button"
                onClick={() => setMode("otp")}
                className={
                  mode === "otp" ? "text-[#FF5A36] font-semibold" : "text-[#737373]"
                }
              >
                Access code
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Agent Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agcy@bentoco.com"
                className="w-full px-3 py-2 bg-black border border-[#262626] rounded-md focus:outline-none focus:border-[#FF5A36] text-white placeholder-[#525252] transition-colors text-sm"
              />
            </div>

            {mode === "password" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-black border border-[#262626] rounded-md focus:outline-none focus:border-[#FF5A36] text-white placeholder-[#525252] transition-colors text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-white">
                  6-Digit Access Code
                </label>
                <div className="flex gap-2 justify-between">
                  {code.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-12 h-12 bg-black border border-[#262626] rounded-lg text-center text-lg font-bold text-white focus:border-[#FF5A36] focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[#FF5A36] hover:bg-[#E04E2D] text-white text-sm font-medium rounded-md transition-colors flex justify-center items-center h-10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Signing in..."
                  : mode === "password"
                    ? "Enter agency portal"
                    : "Verify & Enter Portal"}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-transparent border border-[#262626] hover:bg-[#141414] text-[#A3A3A3] hover:text-white text-xs rounded-md transition-colors flex justify-center items-center h-10"
              >
                Merchant login
              </button>
              <p className="text-[11px] text-[#737373] text-center">
                Or use{" "}
                <Link to="/login" className="text-[#A3A3A3] underline">
                  shared login
                </Link>{" "}
                — agency members are routed automatically.
              </p>
            </div>
          </form>

          <div className="border-t border-[#262626] mt-8 pt-6">
            <p className="text-[11px] text-[#A3A3A3]">© 2026 BentoCo</p>
          </div>
        </div>
      </div>

      {/* Right Canvas Layout - Background Visual */}
      <div className="gradient-panel login-view">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/workspace-editorial.jpg')"
          }}
        />
      </div>
    </div>
  )
}

export default AgencyLoginView
