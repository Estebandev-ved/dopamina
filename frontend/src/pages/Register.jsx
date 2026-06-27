import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Register() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombreError, setNombreError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!nombre) { setNombreError(''); return; }
    if (nombre.length < 2 || nombre.length > 50) setNombreError('El nombre debe tener entre 2 y 50 caracteres.');
    else setNombreError('');
  }, [nombre]);

  useEffect(() => {
    if (!email) { setEmailError(''); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) setEmailError('Proporcione una dirección de email válida.');
    else setEmailError('');
  }, [email]);

  useEffect(() => {
    if (!telefono) { setTelefonoError(''); return; }
    const phoneRegex = /^[0-9+\s-]{7,20}$/;
    if (!phoneRegex.test(telefono)) setTelefonoError('El teléfono debe ser numérico y tener entre 7 y 20 dígitos.');
    else setTelefonoError('');
  }, [telefono]);

  useEffect(() => {
    if (!password) { setPasswordError(''); return; }
    if (password.length < 6) setPasswordError('La contraseña debe tener al menos 6 caracteres.');
    else setPasswordError('');
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);
    if (nombre.length < 2 || nombre.length > 50) { setNombreError('Verifique el nombre.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Verifique el email.'); return; }
    if (telefono.length < 7 || telefono.length > 20) { setTelefonoError('Verifique el teléfono.'); return; }
    if (password.length < 6) { setPasswordError('Contraseña muy corta.'); return; }
    setLoading(true);
    try {
      await api.register(nombre, email, telefono, password);
      setSuccess(true);
      setNombre(''); setEmail(''); setTelefono(''); setPassword('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setSubmitError(err.message || 'Error al procesar el registro.');
    } finally { setLoading(false); }
  };

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (credentialResponse) => {
      setLoading(true);
      setSubmitError('');
      try {
        const payload = decodeJwtPayload(credentialResponse.credential);
        if (!payload) throw new Error('No se pudo verificar la identidad de Google.');
        await api.loginWithGoogle(payload.email, payload.name, payload.sub);
        navigate('/');
      } catch (err) {
        setSubmitError(err.message || 'Error al registrarse con Google.');
      } finally { setLoading(false); }
    },
    onError: () => setSubmitError('Error al autenticar con Google. Intente de nuevo.'),
  });

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full space-y-8 z-10">
          <div className="text-center">
            <Link to="/" className="inline-block text-3xl font-black tracking-[0.25em] text-white uppercase hover:text-neon-glow transition-colors">
              DOPAMINA
            </Link>
            <p className="mt-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
              Unirse al parche del underground
            </p>
          </div>

          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-8 shadow-neon-sm">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-950/30 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">¡Registro Exitoso!</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Tu cuenta ha sido creada. Serás redirigido al formulario de inicio de sesión para ingresar.
                </p>
                <div className="pt-4">
                  <Link to="/login" className="text-xs font-black tracking-widest text-neon-glow hover:underline uppercase">
                    Ir al Login Manualmente
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                  <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs p-3 rounded flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Nombre Completo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><User className="w-4 h-4" /></span>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre"
                      className={`w-full pl-10 pr-4 py-2.5 bg-black border rounded text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200 ${
                        nombreError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : nombre.length >= 2 ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                            : 'border-industrial-800 focus:border-neon-purple focus:shadow-neon-sm'
                      }`}
                    />
                  </div>
                  {nombreError && <p className="text-[10px] text-rose-400 font-medium tracking-wide">{nombreError}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Mail className="w-4 h-4" /></span>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
                      className={`w-full pl-10 pr-4 py-2.5 bg-black border rounded text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200 ${
                        emailError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : email.length > 0 ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                            : 'border-industrial-800 focus:border-neon-purple focus:shadow-neon-sm'
                      }`}
                    />
                  </div>
                  {emailError && <p className="text-[10px] text-rose-400 font-medium tracking-wide">{emailError}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Teléfono</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Phone className="w-4 h-4" /></span>
                    <input type="text" required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="3001234567"
                      className={`w-full pl-10 pr-4 py-2.5 bg-black border rounded text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200 ${
                        telefonoError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : telefono.length > 0 ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                            : 'border-industrial-800 focus:border-neon-purple focus:shadow-neon-sm'
                      }`}
                    />
                  </div>
                  {telefonoError && <p className="text-[10px] text-rose-400 font-medium tracking-wide">{telefonoError}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Contraseña</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                      className={`w-full pl-10 pr-10 py-2.5 bg-black border rounded text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200 ${
                        passwordError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : password.length >= 6 ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                            : 'border-industrial-800 focus:border-neon-purple focus:shadow-neon-sm'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && <p className="text-[10px] text-rose-400 font-medium tracking-wide">{passwordError}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full relative group overflow-hidden bg-neon-purple text-white py-3 rounded text-xs font-black tracking-[0.2em] shadow-neon-sm hover:shadow-neon-md transition-all duration-300 disabled:opacity-50 mt-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 uppercase">{loading ? 'CREANDO CUENTA...' : 'REGISTRARME'}</span>
                </button>

                {hasGoogleClientId && (
                  <>
                    <div className="relative my-4 flex items-center justify-center">
                      <div className="absolute inset-x-0 h-[1px] bg-industrial-800" />
                      <span className="relative z-10 bg-industrial-900 px-3 text-[10px] font-mono text-gray-500 uppercase">o bien</span>
                    </div>
                    <button type="button" onClick={() => googleLogin()} disabled={loading}
                      className="w-full border border-industrial-800 hover:border-neon-purple/50 bg-black text-gray-300 hover:text-white py-3 rounded text-xs font-black tracking-[0.15em] transition-all duration-300 flex items-center justify-center space-x-2.5 focus:outline-none"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>CONTINUAR CON GOOGLE</span>
                    </button>
                  </>
                )}
              </form>
            )}

            {!success && (
              <div className="text-center mt-6 pt-6 border-t border-industrial-800">
                <p className="text-xs text-gray-500">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-neon-glow hover:underline font-bold">Inicia sesión aquí</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
