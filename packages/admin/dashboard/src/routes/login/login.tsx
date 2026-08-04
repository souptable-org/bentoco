import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useSignInWithEmailPass } from "../../hooks/api"
import { isFetchError } from "../../lib/is-fetch-error"
import GlassSurface from "./GlassSurface"

// WebGL Canvas component for high-fidelity glass refraction & chromatic aberrations
const WebGLGlassBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const gl = canvas.getContext('webgl')
    if (!gl) return

    // Simple vertex shader
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `

    // Fragment shader creating glass distortion & color noise
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;

      float noise(vec2 p) {
        return sin(p.x * 10.0 + sin(p.y * 10.0 + uTime)) * 0.5 + 0.5;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec2 mouseDist = uv - uMouse;
        
        // Refraction vector based on mouse hover coordinates
        float refractFactor = 0.04 / (length(mouseDist) + 0.2);
        vec2 offset = normalize(mouseDist) * refractFactor * noise(uv * 5.0);
        
        // Chromatic aberration splits
        float r = sin((uv.x + offset.x) * 4.0 + uTime * 0.2) * 0.2 + 0.4;
        float g = sin((uv.y + offset.y) * 5.0 + uTime * 0.3) * 0.15 + 0.3;
        float b = sin((uv.x - offset.x) * 6.0 + uTime * 0.1) * 0.3 + 0.5;

        // Dark overlays to match brutalist design theme
        vec3 col = vec3(r, g, b) * 0.25;
        gl_FragColor = vec4(col, 0.85);
      }
    `

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    const program = gl.createProgram()
    if (!program || !vs || !fs) return

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const posAttr = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'uTime')
    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uMouse = gl.getUniformLocation(program, 'uMouse')

    let mouse = { x: 0.5, y: 0.5 }
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth
      mouse.y = 1.0 - (e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', handleMouseMove)

    const resize = () => {
      if (!canvas) return
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize)
    resize()

    let animationFrameId: number
    const render = (time: number) => {
      gl.uniform1f(uTime, time * 0.001)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform2f(uMouse, mouse.x, mouse.y)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }
    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none -z-10" />
}

export const Login = () => {
  const navigate = useNavigate()
  const [view, setView] = useState<'login' | 'signup' | 'onboarding'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<'merchant' | 'agency' | null>(null)

  const { mutateAsync: signIn } = useSignInWithEmailPass()

  // Onboarding Step management state
  const [onboardingStep, setOnboardingStep] = useState<number>(0) // 0 = role select, 1+ = custom role steps
  
  // Onboarding data collectors
  const [storeName, setStoreName] = useState('')
  const [storeDomain, setStoreDomain] = useState('')
  const [targetStates, setTargetStates] = useState<string[]>([])
  const [selectedGateway, setSelectedGateway] = useState('')
  const [importSource, setImportSource] = useState('')

  // Agency data collectors
  const [agencyName, setAgencyName] = useState('')
  const [agencyWebsite, setAgencyWebsite] = useState('')

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setErrorMsg('')

    try {
      if (view === 'login') {
        // Real Medusa email/password auth (session or JWT via SDK)
        await signIn({ email, password })

        // Resolve agency membership from Bentoco tables (Stage 5)
        const { fetchAgencyMe, persistAgencySession } = await import(
          "../../lib/agency-session"
        )
        const me = await fetchAgencyMe(email)
        persistAgencySession(me)

        if (me.isAgency) {
          navigate("/agency/dashboard", { replace: true })
        } else {
          navigate("/orders", { replace: true })
        }
      } else {
        // Sign-up flow simulation
        setView('onboarding')
        setOnboardingStep(0)
      }
    } catch (err: any) {
      const message =
        err?.message ||
        (typeof err === "string" ? err : null) ||
        "Sign-in failed. Check email/password and that the API is running."
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingSubmit = async () => {
    setIsLoading(true)
    try {
      const selectedRole = accountType === 'agency' ? 'AGENCY' : 'MERCHANT'
      
      // Post role selection
      await fetch('http://localhost:9000/api/auth/register-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: selectedRole })
      })

      // If Merchant onboarding, hit store creation api logic
      if (selectedRole === 'MERCHANT') {
        await fetch('http://localhost:9000/api/agency/transfer-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: storeDomain || 'store_live_01',
            name: storeName,
            metadata: {
              states: targetStates,
              gateway: selectedGateway,
              importSource: importSource
            }
          })
        })
      }

      if (selectedRole === 'AGENCY') {
        navigate('/agency/dashboard', { replace: true })
      } else {
        navigate('/orders', { replace: true })
      }
    } catch (err: any) {
      setErrorMsg('Failed to initialize workspace. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = () => {
    if (accountType === 'merchant') {
      if (onboardingStep < 4) {
        setOnboardingStep(prev => prev + 1)
      } else {
        handleOnboardingSubmit()
      }
    } else if (accountType === 'agency') {
      if (onboardingStep < 1) {
        setOnboardingStep(prev => prev + 1)
      } else {
        handleOnboardingSubmit()
      }
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
        
        .gradient-panel.onboarding-view {
          clip-path: inset(0 0 0 0 round 0px);
        }
      `}</style>

      {/* Auth Left Sidebar Column */}
      <div 
        className={`
          absolute top-0 left-0 h-full w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 xl:px-24 z-10
          bg-[#000000] panel-transition
          ${view === 'onboarding' ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}
        `}
      >
        <div className="w-full max-w-[360px] flex flex-col">
          <div className="border-b border-[#262626] pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <img 
                  src={storeDomain ? `https://img.logo.dev/${storeDomain}.com?token=pk_Bjn7L1_iS0iXo6xAZWoyDA` : `https://img.logo.dev/bentoco.com?token=pk_Bjn7L1_iS0iXo6xAZWoyDA`}
                  onError={(e) => {
                    e.currentTarget.src = storeDomain ? `https://unavatar.io/${storeDomain}.com` : `https://unavatar.io/bentoco.com`
                  }}
                  className="w-6 h-6 object-contain"
                  alt="Logo"
                />
              </div>
              <span className="text-[1.1rem] font-semibold text-white tracking-tight">
                {storeName || 'BentoCo'} Auth
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-white mb-1">
              {view === 'login' ? 'Login' : 'Sign Up'}
            </h1>
            <p className="text-[#A3A3A3] text-sm">
              {view === 'login' ? 'Enter your details below to login' : 'Enter your details to create an account'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="team@mynaui.com"
                className="w-full px-3 py-2 bg-black border border-[#262626] rounded-md focus:outline-none focus:border-[#FF5A36] text-white placeholder-[#525252] transition-colors text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••"
                className="w-full px-3 py-2 bg-black border border-[#262626] rounded-md focus:outline-none focus:border-[#FF5A36] text-white placeholder-[#525252] transition-colors text-sm font-mono tracking-widest"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[#FF5A36] hover:bg-[#E04E2D] text-white text-sm font-medium rounded-md transition-colors flex justify-center items-center h-10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : view === 'login' ? 'Login' : 'Sign Up'}
              </button>

              <button
                type="button"
                className="w-full py-2 bg-transparent border border-[#262626] hover:bg-[#141414] text-white text-sm font-medium rounded-md transition-colors flex justify-center items-center h-10"
              >
                {view === 'login' ? 'Login with Google' : 'Sign up with Google'}
              </button>
            </div>
          </form>

          <div className="mt-8 space-y-3">
            <p className="text-xs text-[#A3A3A3]">
              {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                className="text-white hover:text-[#FF5A36] transition-colors"
              >
                {view === 'login' ? 'Sign up' : 'Login'}
              </button>
            </p>
            {view === 'login' && (
              <p className="text-xs text-[#A3A3A3]">
                Are you an agent?{' '}
                <button 
                  onClick={() => navigate('/agency/login')}
                  className="text-white hover:text-[#FF5A36] transition-colors"
                >
                  Log in as Agency
                </button>
              </p>
            )}
          </div>
          
          <div className="border-t border-[#262626] mt-8 pt-6">
            <p className="text-[11px] text-[#A3A3A3]">© 2026 BentoCo</p>
          </div>
        </div>
      </div>

      {/* Right Canvas / Fullscreen Gradient and Onboarding choice */}
      <div className={`gradient-panel ${view === 'onboarding' ? 'onboarding-view' : 'login-view'}`}>
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/workspace-editorial.jpg')"
          }}
        />

        {/* Onboarding Dialog Modal */}
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={24}
          blur={1}
          displace={0.5}
          distortionScale={-25}
          redOffset={1}
          greenOffset={2}
          blueOffset={4}
          backgroundOpacity={0.05}
          saturation={1.2}
          className={`
            relative z-10 w-full max-w-[460px] border border-white/10 p-8
            transition-all duration-700 delay-300 ease-out shadow-[0_0_50px_rgba(0,0,0,0.8)]
            ${view === 'onboarding' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none absolute'}
          `}
        >
          {/* STEP 0: Role Selection */}
          {onboardingStep === 0 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-[#FF5A36] font-bold mb-3">
                  Role Setup
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Configure Your Workspace</h2>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                  Select how you plan to use BentoCo. This determines your default control panel.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {/* Merchant Card */}
                <label 
                  className={`group relative flex items-start gap-4 p-5 rounded-xl cursor-pointer border transition-all duration-300 overflow-hidden ${
                    accountType === 'merchant' 
                      ? 'border-[#FF5A36] shadow-lg scale-[1.01]' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div 
                    className={`absolute inset-0 transition-opacity duration-300 -z-10 opacity-0 group-hover:opacity-100 ${
                      accountType === 'merchant' ? 'opacity-100' : ''
                    }`}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(217, 197, 207, 0.1) 0%, rgba(241, 210, 215, 0.1) 25%, rgba(255, 138, 76, 0.1) 50%, rgba(255, 90, 54, 0.1) 75%, rgba(243, 27, 72, 0.1) 100%)'
                    }}
                  />
                  <div className="absolute inset-0 border border-transparent rounded-xl pointer-events-none -z-10">
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                      padding: '1px',
                      background: 'linear-gradient(135deg, #D9C5CF, #F1D2D7, #FF8A4C, #FF5A36, #F31B48)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude'
                    }}/>
                  </div>

                  <div className="flex items-center h-5 mt-0.5 z-10">
                    <input 
                      type="radio" 
                      name="accountType" 
                      value="merchant"
                      checked={accountType === 'merchant'}
                      onChange={() => setAccountType('merchant')}
                      className="sr-only" 
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      accountType === 'merchant' ? 'border-[#FF5A36] bg-[#FF5A36]' : 'border-[#404040]'
                    }`}>
                      {accountType === 'merchant' && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 z-10">
                    <h3 className={`text-base font-bold transition-colors ${accountType === 'merchant' ? 'text-white' : 'text-[#E5E5E5]'}`}>
                      Merchant Account
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed mt-1 transition-colors group-hover:text-white">
                      Own and manage your individual e-commerce brand storefront, products, checkout, and inventory setup.
                    </p>
                  </div>
                </label>

                {/* Agency Card */}
                <label 
                  className={`group relative flex items-start gap-4 p-5 rounded-xl cursor-pointer border transition-all duration-300 overflow-hidden ${
                    accountType === 'agency' 
                      ? 'border-[#FF5A36] shadow-lg scale-[1.01]' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div 
                    className={`absolute inset-0 transition-opacity duration-300 -z-10 opacity-0 group-hover:opacity-100 ${
                      accountType === 'agency' ? 'opacity-100' : ''
                    }`}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(217, 197, 207, 0.1) 0%, rgba(241, 210, 215, 0.1) 25%, rgba(255, 138, 76, 0.1) 50%, rgba(255, 90, 54, 0.1) 75%, rgba(243, 27, 72, 0.1) 100%)'
                    }}
                  />
                  <div className="absolute inset-0 border border-transparent rounded-xl pointer-events-none -z-10">
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                      padding: '1px',
                      background: 'linear-gradient(135deg, #D9C5CF, #F1D2D7, #FF8A4C, #FF5A36, #F31B48)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude'
                    }}/>
                  </div>

                  <div className="flex items-center h-5 mt-0.5 z-10">
                    <input 
                      type="radio" 
                      name="accountType" 
                      value="agency"
                      checked={accountType === 'agency'}
                      onChange={() => setAccountType('agency')}
                      className="sr-only" 
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      accountType === 'agency' ? 'border-[#FF5A36] bg-[#FF5A36]' : 'border-[#404040]'
                    }`}>
                      {accountType === 'agency' && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 z-10">
                    <h3 className={`text-base font-bold transition-colors ${accountType === 'agency' ? 'text-white' : 'text-[#E5E5E5]'}`}>
                      Agency Account
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed mt-1 transition-colors group-hover:text-white">
                      Manage multiple stores, coordinate client transfers, allocate staff permissions, and review audit logs.
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleNextStep}
                disabled={!accountType || isLoading}
                className="w-full py-3 bg-[#FF5A36] hover:bg-[#E04E2D] text-white font-bold rounded-lg shadow-lg transition-colors flex justify-center items-center h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed Setup
              </button>
            </>
          )}

          {/* MERCHANT FLOW */}
          {accountType === 'merchant' && onboardingStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-xs text-[#FF5A36] font-mono tracking-widest uppercase mb-1">Step 1 of 4</div>
                <h3 className="text-xl font-bold text-white">Store Metadata Setup</h3>
                <p className="text-xs text-[#A3A3A3] mt-1">This setup configuration is mandatory for your storefront instance.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Store Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urban Threads"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Subdomain Prefix</label>
                  <div className="flex items-center bg-black/60 border border-white/10 rounded-lg overflow-hidden focus-within:border-[#FF5A36]">
                    <input
                      type="text"
                      required
                      placeholder="urbanthreads"
                      value={storeDomain}
                      onChange={(e) => setStoreDomain(e.target.value)}
                      className="flex-1 px-3 py-2 bg-transparent text-white text-sm focus:outline-none"
                    />
                    <span className="px-3 py-2 bg-white/5 border-l border-white/10 text-xs text-neutral-400 font-mono">.bentoco.in</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleNextStep}
                disabled={!storeName || !storeDomain}
                className="w-full py-3 bg-[#FF5A36] hover:bg-[#E04E2D] text-white font-bold rounded-lg shadow-lg"
              >
                Next Step
              </button>
            </div>
          )}

          {accountType === 'merchant' && onboardingStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="text-xs text-[#FF5A36] font-mono tracking-widest uppercase mb-1">Step 2 of 4</div>
                <h3 className="text-xl font-bold text-white">Shipping Regions</h3>
                <p className="text-xs text-[#A3A3A3] mt-1">Select the priority states inside India you plan to deliver orders to.</p>
              </div>

              {/* State Suggestion Autocomplete Wrapper */}
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-neutral-400">Choose States</label>
                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="autocomplete-state-input"
                        placeholder="Type state name (e.g. Maha, Goa)..."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF5A36] h-10"
                        onInput={(e) => {
                          const val = e.currentTarget.value.trim();
                          const listContainer = document.getElementById('suggestions-dropdown');
                          if (!listContainer) return;
                          
                          if (!val) {
                            listContainer.style.display = 'none';
                            return;
                          }

                          const validStates = [
                            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
                            'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
                            'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
                            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
                            'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli', 
                            'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
                          ];

                          const filtered = validStates.filter(s => 
                            s.toLowerCase().includes(val.toLowerCase()) && !targetStates.includes(s)
                          );

                          if (filtered.length > 0) {
                            listContainer.innerHTML = filtered.map(s => `
                              <button type="button" class="suggestion-item w-full px-3 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-[#FF5A36]/20 transition-colors" data-state="${s}">
                                ${s}
                              </button>
                            `).join('');
                            listContainer.style.display = 'block';

                            // Bind events to new HTML nodes
                            listContainer.querySelectorAll('.suggestion-item').forEach(item => {
                              item.addEventListener('click', (ev) => {
                                const target = ev.currentTarget as HTMLElement;
                                const stateToAdd = target.getAttribute('data-state');
                                if (stateToAdd && !targetStates.includes(stateToAdd)) {
                                  setTargetStates(prev => [...prev, stateToAdd]);
                                }
                                const inputEl = document.getElementById('autocomplete-state-input') as HTMLInputElement;
                                if (inputEl) inputEl.value = '';
                                listContainer.style.display = 'none';
                                setErrorMsg('');
                              });
                            });
                          } else {
                            listContainer.style.display = 'none';
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            const validStates = [
                              'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
                              'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
                              'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
                              'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
                              'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli', 
                              'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
                            ];
                            
                            // Check if a dropdown suggestion exists first to extract top match
                            const dropdown = document.getElementById('suggestions-dropdown');
                            const topItem = dropdown?.querySelector('.suggestion-item') as HTMLElement;
                            const suggestedState = topItem?.getAttribute('data-state');

                            if (suggestedState) {
                              if (!targetStates.includes(suggestedState)) {
                                setTargetStates(prev => [...prev, suggestedState]);
                              }
                              setErrorMsg('');
                              e.currentTarget.value = '';
                              if (dropdown) dropdown.style.display = 'none';
                              return;
                            }

                            // Direct match fallback
                            const matched = validStates.find(s => s.toLowerCase() === val.toLowerCase());
                            if (matched) {
                              if (!targetStates.includes(matched)) {
                                setTargetStates(prev => [...prev, matched]);
                              }
                              setErrorMsg('');
                              e.currentTarget.value = '';
                              if (dropdown) dropdown.style.display = 'none';
                            } else {
                              setErrorMsg(`"${val}" is not a valid Indian state or Union Territory name. Please verify spelling.`);
                            }
                          }
                        }}
                      />
                      
                      {/* Suggestion Dropdown Panel */}
                      <div 
                        id="suggestions-dropdown" 
                        className="absolute left-0 right-0 mt-1 max-h-[160px] overflow-y-auto bg-[#141414] border border-white/10 rounded-lg shadow-2xl z-50 divide-y divide-white/5"
                        style={{ display: 'none' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('autocomplete-state-input') as HTMLInputElement;
                        if (input) {
                          const val = input.value.trim();
                          const validStates = [
                            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
                            'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
                            'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
                            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
                            'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli', 
                            'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
                          ];
                          const matched = validStates.find(s => s.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            if (!targetStates.includes(matched)) {
                              setTargetStates(prev => [...prev, matched]);
                            }
                            setErrorMsg('');
                            input.value = '';
                            const dropdown = document.getElementById('suggestions-dropdown');
                            if (dropdown) dropdown.style.display = 'none';
                          } else {
                            setErrorMsg(`"${val}" is not a valid Indian state or Union Territory name. Please verify spelling.`);
                          }
                        }
                      }}
                      className="px-4 bg-[#FF5A36]/10 border border-[#FF5A36]/30 hover:bg-[#FF5A36]/20 text-[#FF5A36] text-xs font-bold rounded-lg h-10 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  {errorMsg && (
                    <p className="text-[11px] text-red-400 font-medium mt-1">{errorMsg}</p>
                  )}
                </div>

                {/* Tags display container */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                    <span>Active Delivery Regions ({targetStates.length})</span>
                    {targetStates.length > 0 && (
                      <button onClick={() => setTargetStates([])} className="text-red-400 hover:text-red-300">
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 bg-black/40 border border-white/5 p-2 rounded-lg min-h-[48px]">
                    {targetStates.length === 0 ? (
                      <span className="text-xs text-neutral-600 italic m-auto">No states added yet. All regions will be inactive.</span>
                    ) : (
                      targetStates.map(state => (
                        <div 
                          key={state}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-white text-[10px] rounded-full font-medium"
                        >
                          <span>{state}</span>
                          <button
                            type="button"
                            onClick={() => setTargetStates(prev => prev.filter(s => s !== state))}
                            className="text-[#FF5A36] hover:text-white font-bold ml-1 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setOnboardingStep(1)}
                  className="flex-1 py-3 border border-white/10 text-neutral-400 hover:text-white rounded-lg text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-3 bg-[#FF5A36] hover:bg-[#E04E2D] text-white font-bold rounded-lg shadow-lg text-sm"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {accountType === 'merchant' && onboardingStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-xs text-[#FF5A36] font-mono tracking-widest uppercase mb-1">Step 3 of 4</div>
                <h3 className="text-xl font-bold text-white">Payment Gateway</h3>
                <p className="text-xs text-[#A3A3A3] mt-1">Choose your Indian UPI payment processor gateway to register.</p>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Razorpay', domain: 'razorpay.com' },
                  { name: 'PhonePe PG', domain: 'phonepe.com' },
                  { name: 'Cashfree Payments', domain: 'cashfree.com' }
                ].map(gw => {
                  const isSelected = selectedGateway === gw.name
                  return (
                    <button
                      key={gw.name}
                      onClick={() => setSelectedGateway(gw.name)}
                      className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                        isSelected ? 'border-[#FF5A36] bg-[#FF5A36]/10 text-white' : 'border-white/10 bg-black/40 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <img 
                            src={`https://img.logo.dev/${gw.domain}?token=pk_Bjn7L1_iS0iXo6xAZWoyDA`}
                            onError={(e) => {
                              e.currentTarget.src = `https://unavatar.io/${gw.domain}`
                            }}
                            className="w-6 h-6 object-contain"
                            alt={gw.name}
                          />
                        </div>
                        <span className="text-sm font-bold text-white">{gw.name}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF5A36]' : 'border-neutral-600'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF5A36]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setOnboardingStep(2)}
                  className="flex-1 py-3 border border-white/10 text-neutral-400 hover:text-white rounded-lg text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-3 bg-[#FF5A36] hover:bg-[#E04E2D] text-white font-bold rounded-lg shadow-lg text-sm"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {accountType === 'merchant' && onboardingStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-xs text-[#FF5A36] font-mono tracking-widest uppercase mb-1">Step 4 of 4</div>
                <h3 className="text-xl font-bold text-white">Catalog Import</h3>
                <p className="text-xs text-[#A3A3A3] mt-1">Select how you want to seed your initial product catalog.</p>
              </div>

              <div className="space-y-3">
                {[
                  { 
                    id: 'shopify', 
                    label: 'Shopify Catalog Importer', 
                    desc: 'Upload your shopify export CSV. We will map titles, options, variants, and auto-compress imagery.', 
                    logo: 'shopify.com'
                  },
                  { 
                    id: 'woo', 
                    label: 'WooCommerce XML Feed', 
                    desc: 'Provide your WordPress store product endpoint to sync items and variations automatically.', 
                    logo: 'woocommerce.com'
                  },
                  { 
                    id: 'manual', 
                    label: 'Build Store Catalog from Scratch', 
                    desc: 'Skip imports. Start fresh inside our high-density 1-Screen catalog manager tool.', 
                    logo: 'stripe.com'
                  }
                ].map(src => {
                  const isSelected = importSource === src.id
                  return (
                    <button
                      key={src.id}
                      onClick={() => setImportSource(src.id)}
                      className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300 relative overflow-hidden ${
                        isSelected 
                          ? 'border-[#FF5A36] bg-[#FF5A36]/10 text-white' 
                          : 'border-white/10 bg-black/40 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img 
                          src={`https://img.logo.dev/${src.logo}?token=pk_Bjn7L1_iS0iXo6xAZWoyDA`}
                          onError={(e) => {
                            e.currentTarget.src = `https://unavatar.io/${src.logo}`
                          }}
                          className="w-8 h-8 object-contain"
                          alt={src.label}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-white">{src.label}</h4>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full border border-[#FF5A36] flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{src.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setOnboardingStep(3)}
                  className="flex-1 py-3 border border-white/10 text-neutral-400 hover:text-white rounded-lg text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleOnboardingSubmit}
                  className="flex-1 py-3 bg-[#FF5A36] hover:bg-[#E04E2D] text-white font-bold rounded-lg shadow-lg text-sm"
                >
                  Finish & Launch
                </button>
              </div>
            </div>
          )}

          {/* AGENCY FLOW */}
          {accountType === 'agency' && onboardingStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-xs text-[#FF5A36] font-mono tracking-widest uppercase mb-1">Workspace Configuration</div>
                <h3 className="text-xl font-bold text-white">Agency Details</h3>
                <p className="text-xs text-[#A3A3A3] mt-1">Configure your developer agency profile to map store roster permissions.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Agency Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Dev Labs"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Primary Website</label>
                  <input
                    type="url"
                    required
                    placeholder="https://apexlabs.com"
                    value={agencyWebsite}
                    onChange={(e) => setAgencyWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setOnboardingStep(0)}
                  className="flex-1 py-3 border border-white/10 text-neutral-400 hover:text-white rounded-lg text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleOnboardingSubmit}
                  disabled={!agencyName || !agencyWebsite}
                  className="flex-1 py-3 bg-[#FF5A36] hover:bg-[#E04E2D] text-white font-bold rounded-lg shadow-lg text-sm"
                >
                  Proceed to Dashboard
                </button>
              </div>
            </div>
          )}

        </GlassSurface>
      </div>
    </div>
  )
}

export default Login

