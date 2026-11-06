import { useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   Página pública: no usa Layout, ni sesión, ni estilos de la app.
   Edita solo estas constantes antes de publicar.
   ───────────────────────────────────────────────────────────── */
const EMPRESA = 'CAPTUSTEC';
const CORREO_CONTACTO = 'privacidad@tudominio.com'; // ← CAMBIAR por un correo real que revises
const ULTIMA_ACTUALIZACION = '6 de noviembre de 2026';

const SECCIONES = [
  {
    id: 'responsable',
    titulo: 'Quién es el responsable',
    cuerpo: (
      <>
        <p>
          {EMPRESA} es responsable del tratamiento de los datos personales descritos en esta
          política. Recibimos los mensajes que las personas nos envían a través de Messenger a la
          página de Facebook de {EMPRESA}, y los usamos para atenderlas.
        </p>
      </>
    ),
  },
  {
    id: 'datos',
    titulo: 'Qué datos recopilamos',
    cuerpo: (
      <>
        <p>Cuando nos escribes por Messenger, recibimos:</p>
        <ul>
          <li>El identificador que Meta asigna a tu conversación con nuestra página.</li>
          <li>El contenido de tus mensajes: texto y, si los envías, imágenes o archivos adjuntos.</li>
          <li>Las opciones que eliges en botones o menús de la conversación.</li>
          <li>La fecha y la hora de cada mensaje.</li>
          <li>
            Los datos que decidas darnos para atender tu consulta, como tu nombre, teléfono o
            correo.
          </li>
        </ul>
        <p>
          No necesitamos datos sensibles ni contraseñas. Te pedimos que no los envíes por este
          medio.
        </p>
      </>
    ),
  },
  {
    id: 'uso',
    titulo: 'Para qué usamos tus datos',
    cuerpo: (
      <>
        <ul>
          <li>Responder tus consultas y mantener el hilo de la conversación.</li>
          <li>Preparar y dar seguimiento a cotizaciones, ventas o servicios que nos pidas.</li>
          <li>Evitar mensajes duplicados y proteger el canal contra abuso.</li>
          <li>Cumplir obligaciones legales cuando corresponda.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'base-legal',
    titulo: 'Base legal',
    cuerpo: (
      <>
        <p>
          Tratamos tus datos con tu consentimiento, que nos das al escribirnos por Messenger, y
          conforme a la Ley N.º 29733, Ley de Protección de Datos Personales del Perú, y su
          reglamento. Puedes retirar tu consentimiento en cualquier momento, como se explica más
          abajo.
        </p>
      </>
    ),
  },
  {
    id: 'comparticion',
    titulo: 'Con quién los compartimos',
    cuerpo: (
      <>
        <p>No vendemos ni alquilamos tus datos. Solo intervienen:</p>
        <ul>
          <li>
            <strong>Meta Platforms</strong>, dueña de Messenger, que procesa la conversación según
            su propia{' '}
            <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
              política de privacidad
            </a>
            .
          </li>
          <li>
            Proveedores de infraestructura (alojamiento, red y bases de datos) que tratan datos
            por nuestra cuenta y solo para operar el servicio.
          </li>
          <li>Autoridades competentes, cuando una norma nos obligue a entregar información.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'conservacion',
    titulo: 'Cuánto tiempo los conservamos',
    cuerpo: (
      <>
        <p>
          Guardamos tus datos mientras sean necesarios para atender tu solicitud, mientras exista
          una relación comercial o durante los plazos que exija la ley. Después los eliminamos o
          los anonimizamos.
        </p>
      </>
    ),
  },
  {
    id: 'seguridad',
    titulo: 'Cómo los protegemos',
    cuerpo: (
      <>
        <ul>
          <li>Recibimos los mensajes por una conexión cifrada (HTTPS).</li>
          <li>Comprobamos la firma de cada evento que llega desde Meta y rechazamos los que no la cumplen.</li>
          <li>Las credenciales de integración se guardan solo en nuestros servidores.</li>
          <li>El acceso a los datos está limitado al personal autorizado.</li>
        </ul>
        <p>
          Ningún sistema es completamente seguro, pero aplicamos medidas razonables para reducir
          los riesgos.
        </p>
      </>
    ),
  },
  {
    id: 'derechos',
    titulo: 'Tus derechos',
    cuerpo: (
      <>
        <p>
          Puedes pedirnos acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso, y
          retirar tu consentimiento. Escríbenos a{' '}
          <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>. Podemos pedirte datos
          básicos para confirmar que la solicitud es tuya, y te responderemos dentro de los plazos
          que establece la ley.
        </p>
      </>
    ),
  },
  {
    id: 'eliminacion',
    titulo: 'Cómo eliminar tus datos',
    cuerpo: (
      <>
        <p>Para que borremos los datos de tus conversaciones con nosotros:</p>
        <ol>
          <li>
            Escribe a <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a> con el asunto
            «Eliminación de datos».
          </li>
          <li>
            Indica el nombre del perfil de Facebook desde el que nos escribiste, para que podamos
            ubicar tu conversación.
          </li>
          <li>Te confirmaremos por el mismo medio cuando la eliminación esté hecha.</li>
        </ol>
        <p>
          Borrar la conversación desde Messenger solo la quita de tu cuenta. No elimina la copia
          que conservamos nosotros, por eso necesitamos tu solicitud.
        </p>
      </>
    ),
  },
  {
    id: 'menores',
    titulo: 'Menores de edad',
    cuerpo: (
      <>
        <p>
          Este canal no está dirigido a menores de 18 años. Si nos enteramos de que un menor nos
          escribió sin autorización de su padre, madre o tutor, eliminaremos sus datos.
        </p>
      </>
    ),
  },
  {
    id: 'cambios',
    titulo: 'Cambios en esta política',
    cuerpo: (
      <>
        <p>
          Si actualizamos esta política, publicaremos la versión nueva en esta misma página con su
          fecha de actualización.
        </p>
      </>
    ),
  },
  {
    id: 'contacto',
    titulo: 'Contacto',
    cuerpo: (
      <>
        <p>
          Para cualquier consulta sobre privacidad, escríbenos a{' '}
          <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>.
        </p>
      </>
    ),
  },
];

const CSS = `
.pp {
  --bg: #f5f7f6;
  --surface: #ffffff;
  --ink: #17251f;
  --muted: #55655d;
  --line: #d9e1dc;
  --accent: #1f6a4a;
  --accent-soft: #e2f0e8;
  --link: #14543a;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: Charter, 'Bitstream Charter', 'Iowan Old Style', 'Sitka Text', Georgia, serif;
  font-size: 18px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
@media (prefers-color-scheme: dark) {
  .pp {
    --bg: #0e1411;
    --surface: #141c18;
    --ink: #e5ede8;
    --muted: #9fb0a6;
    --line: #25332c;
    --accent: #6fcf9f;
    --accent-soft: #19281f;
    --link: #8fe0b7;
  }
}
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
.pp *, .pp *::before, .pp *::after { box-sizing: border-box; }
.pp a { color: var(--link); text-underline-offset: 3px; }
.pp a:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 2px; }

.pp-head { border-bottom: 1px solid var(--line); background: var(--surface); }
.pp-head-in { max-width: 1080px; margin: 0 auto; padding: 44px 24px 36px; }
.pp-brand {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px; font-weight: 700; letter-spacing: .02em; color: var(--accent); margin: 0 0 18px;
}
.pp-title { font-size: clamp(32px, 5vw, 48px); line-height: 1.1; font-weight: 700; margin: 0 0 14px; letter-spacing: -.01em; }
.pp-date { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: var(--muted); margin: 0; }

.pp-grid {
  max-width: 1080px; margin: 0 auto; padding: 48px 24px 80px;
  display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 64px; align-items: start;
}
.pp-nav {
  position: sticky; top: 32px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.4;
}
.pp-nav p { margin: 0 0 10px; font-weight: 700; color: var(--ink); }
.pp-nav ol { list-style: none; margin: 0; padding: 0; border-left: 2px solid var(--line); }
.pp-nav li { margin: 0; }
.pp-nav a { display: block; padding: 7px 0 7px 14px; margin-left: -2px; border-left: 2px solid transparent; color: var(--muted); text-decoration: none; }
.pp-nav a:hover { color: var(--ink); border-left-color: var(--accent); }

.pp-main { max-width: 68ch; }
.pp-resumen {
  background: var(--accent-soft); border-left: 4px solid var(--accent);
  padding: 22px 26px; margin: 0 0 48px; border-radius: 0 6px 6px 0;
}
.pp-resumen h2 { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 17px; margin: 0 0 10px; }
.pp-resumen ul { margin: 0; padding-left: 20px; }
.pp-resumen li { margin: 6px 0; }

.pp-sec { margin: 0 0 44px; scroll-margin-top: 28px; }
.pp-sec h2 { font-size: 26px; line-height: 1.25; margin: 0 0 14px; letter-spacing: -.005em; }
.pp-sec p { margin: 0 0 16px; }
.pp-sec ul, .pp-sec ol { margin: 0 0 16px; padding-left: 24px; }
.pp-sec li { margin: 8px 0; padding-left: 4px; }
.pp-sec li::marker { color: var(--accent); }

.pp-foot { border-top: 1px solid var(--line); padding-top: 24px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: var(--muted); }

@media (max-width: 860px) {
  .pp { font-size: 17px; }
  .pp-grid { grid-template-columns: minmax(0, 1fr); gap: 32px; padding-top: 32px; }
  .pp-nav { position: static; border: 1px solid var(--line); border-radius: 6px; padding: 16px 18px; background: var(--surface); }
}
`;

export default function PoliticaPrivacidad() {
  useEffect(() => {
    const anterior = document.title;
    document.title = `Política de privacidad | ${EMPRESA}`;
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <div className="pp">
      <style>{CSS}</style>

      <header className="pp-head">
        <div className="pp-head-in">
          <p className="pp-brand">{EMPRESA}</p>
          <h1 className="pp-title">Política de privacidad</h1>
          <p className="pp-date">Última actualización: {ULTIMA_ACTUALIZACION}</p>
        </div>
      </header>

      <div className="pp-grid">
        <nav className="pp-nav" aria-label="Contenido de la política">
          <p>En esta página</p>
          <ol>
            {SECCIONES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.titulo}</a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="pp-main">
          <section className="pp-resumen" aria-labelledby="resumen">
            <h2 id="resumen">En resumen</h2>
            <ul>
              <li>
                Guardamos lo que nos escribes por Messenger y el identificador que Meta asigna a
                tu conversación.
              </li>
              <li>Los usamos para atender tu consulta o tu cotización.</li>
              <li>No vendemos tus datos.</li>
              <li>
                Para que los eliminemos, escribe a{' '}
                <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>.
              </li>
            </ul>
          </section>

          {SECCIONES.map((s) => (
            <section className="pp-sec" id={s.id} key={s.id}>
              <h2>{s.titulo}</h2>
              {s.cuerpo}
            </section>
          ))}

          <footer className="pp-foot">
            © {new Date().getFullYear()} {EMPRESA}. Todos los derechos reservados.
          </footer>
        </main>
      </div>
    </div>
  );
}