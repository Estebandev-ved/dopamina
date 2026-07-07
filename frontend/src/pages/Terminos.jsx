import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, FileText } from 'lucide-react';

const TERMS_VERSION = '1.0';

const sections = [
  {
    title: '1. Aceptación de los Términos',
    content: 'Al acceder y utilizar la plataforma Dopamina ("la Plataforma"), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder ni utilizar nuestros servicios. Estos términos aplican a todos los visitantes, usuarios y clientes de Dopamina Crew.'
  },
  {
    title: '2. Descripción del Servicio',
    content: 'Dopamina es una plataforma de gestión de eventos underground que permite la compra de boletas, registro a eventos, y participación en la comunidad musical de Mocoa y Colombia. Nos reservamos el derecho de modificar, suspender o descontinuar cualquier aspecto del servicio sin previo aviso.'
  },
  {
    title: '3. Registro y Cuenta',
    content: 'Para acceder a ciertas funcionalidades, debes crear una cuenta proporcionando información veraz y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Debes notificar inmediatamente cualquier uso no autorizado. Dopamina no será responsable por pérdidas derivadas del uso indebido de tu cuenta.'
  },
  {
    title: '4. Compras y Pagos',
    content: 'Todas las compras de boletas están sujetas a disponibilidad. Los precios se muestran en pesos colombianos (COP) e incluyen los impuestos aplicables. Los pagos se procesan a través de Efipay, una pasarela de pagos autorizada. Dopamina no almacena información de tarjetas de crédito ni datos bancarios. Las transacciones son procesadas de forma segura mediante cifrado SSL/TLS de 256 bits.'
  },
  {
    title: '5. Política de Reembolsos y Cancelaciones',
    content: 'Una vez realizada la compra de una boleta, no se aceptan devoluciones ni cancelaciones, salvo que el evento sea cancelado oficialmente por Dopamina. En caso de cancelación del evento, se procederá al reembolso del valor total de la boleta. No se reembolsarán gastos de transporte, alojamiento u otros costos asociados.'
  },
  {
    title: '6. Código de Conducta',
    content: 'Dopamina promueve un ambiente seguro, inclusivo y libre de acoso. No se tolera: acoso sexual o de cualquier índole, discriminación por raza, género, orientación sexual, religión o identidad, violencia física o verbal, porte de armas, consumo de sustancias ilegales en los eventos. El incumplimiento resultará en la expulsión del evento y la prohibición permanente de la plataforma.'
  },
  {
    title: '7. Propiedad Intelectual',
    content: 'Todo el contenido de la Plataforma, incluyendo marcas, logotipos, textos, imágenes, música y diseño, es propiedad de Dopamina Crew o de sus respectivos titulares y está protegido por las leyes de propiedad intelectual colombianas. No está permitida la reproducción, distribución o modificación sin autorización expresa.'
  },
  {
    title: '8. Protección de Datos Personales',
    content: 'Dopamina cumple con la Ley 1581 de 2012 de Protección de Datos Personales en Colombia. Los datos personales recopilados se utilizan exclusivamente para la prestación de los servicios y no serán compartidos con terceros sin tu consentimiento explícito. Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición contactándonos a través de nuestros canales oficiales.'
  },
  {
    title: '9. Uso de Cookies',
    content: 'Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar contenido. Al aceptar nuestras cookies, consientes su uso conforme a nuestra Política de Cookies. Puedes configurar tus preferencias en cualquier momento desde el banner de cookies.'
  },
  {
    title: '10. Limitación de Responsabilidad',
    content: 'Dopamina Crew no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de usar la Plataforma. En ningún caso nuestra responsabilidad superará el valor pagado por el servicio adquirido. Dopamina no se hace responsable por lesiones, pérdidas o daños ocurridos durante los eventos.'
  },
  {
    title: '11. Modificaciones',
    content: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la Plataforma. Es tu responsabilidad revisar periódicamente estos términos. El uso continuado de la Plataforma después de cualquier modificación constituye la aceptación de los nuevos términos.'
  },
  {
    title: '12. Legislación Aplicable',
    content: 'Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa relacionada con estos términos será resuelta ante los tribunales competentes de Mocoa, Putumayo, Colombia.'
  },
  {
    title: '13. Contacto',
    content: 'Para cualquier consulta sobre estos términos, puedes contactarnos a través de nuestras redes sociales en Instagram: @dopaminalab.eventos o mediante los canales de soporte en la Plataforma.'
  }
];

export default function Terminos() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dopamina_terms_accepted');
    const version = localStorage.getItem('dopamina_terms_version');
    if (stored === 'true' && version === TERMS_VERSION) {
      setAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('dopamina_terms_accepted', 'true');
    localStorage.setItem('dopamina_terms_version', TERMS_VERSION);
    setAccepted(true);
    setShowConfirm(false);
  };

  const handleReject = () => {
    setShowConfirm(true);
  };

  const confirmReject = () => {
    localStorage.setItem('dopamina_terms_accepted', 'false');
    localStorage.setItem('dopamina_terms_version', TERMS_VERSION);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 mb-6">
            <FileText className="w-8 h-8 text-neon-glow" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            TÉRMINOS Y <span className="text-neon-glow">CONDICIONES</span>
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            Última actualización: Julio 2026 · Versión {TERMS_VERSION}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 mb-12"
        >
          {sections.map((section, i) => (
            <div
              key={i}
              className="bg-industrial-900/50 border border-industrial-800 rounded-xl p-6 hover:border-neon-purple/20 transition-colors"
            >
              <h2 className="text-white font-bold text-sm mb-3 tracking-wide">{section.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {accepted ? (
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-semibold">
                Has aceptado los términos y condiciones
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-4 bg-neon-purple hover:bg-neon-purple/90 text-white font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                ACEPTAR TÉRMINOS
              </button>
              <button
                onClick={handleReject}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                RECHAZAR
              </button>
            </>
          )}
        </motion.div>

        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-industrial-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-3">¿Estás seguro?</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Al rechazar los términos no podrás utilizar la plataforma Dopamina para comprar boletas ni acceder a los eventos. Puedes volver a esta página en cualquier momento desde el footer.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-3 bg-industrial-800 hover:bg-industrial-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Volver
                </button>
                <button
                  onClick={confirmReject}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Rechazar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
