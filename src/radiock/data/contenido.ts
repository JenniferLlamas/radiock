import type { Pilar, Punto } from '../domain/Contenido';

export const pilares: readonly Pilar[] = [
  { titulo: 'Dar espacio', texto: 'Crear escenarios donde bandas con música original puedan presentarse.', simbolo: '↗' },
  { titulo: 'Crear comunidad', texto: 'Conectar músicos, público, fotógrafos, productores, venues y proyectos independientes.', simbolo: '✳' },
  { titulo: 'Impulsar talento local', texto: 'Ayudar a que nuevas bandas lleguen a más personas. Que su música encuentre a quien la estaba esperando.', simbolo: '↑' },
  { titulo: 'Llevar nuestra escena más lejos', texto: 'Abrir camino para que la música creada aquí alcance audiencias nacionales e internacionales.', simbolo: '↗' },
];

export const actividades: readonly Punto[] = [
  { titulo: 'Eventos musicales', texto: 'Organizamos conciertos con bandas independientes y música original. Cada cartel es una oportunidad de descubrir algo propio.' },
  { titulo: 'Producción y apoyo técnico', texto: 'Facilitamos equipo, producción y recursos cuando es posible, para reducir los obstáculos que enfrentan las bandas.' },
  { titulo: 'Conexión con espacios', texto: 'Creamos acuerdos con bares, foros y establecimientos que quieren abrir sus puertas a la música local.' },
  { titulo: 'Difusión', texto: 'Damos visibilidad a las bandas antes, durante y después de los eventos. La música sigue cuando termina el concierto.' },
  { titulo: 'Colaboraciones', texto: 'Trabajamos con fotógrafos, productores, medios, organizaciones y otros proyectos independientes.' },
];

export const proceso: readonly Punto[] = [
  { titulo: 'Encontramos talento', texto: 'Bandas con propuestas originales.' },
  { titulo: 'Creamos alianzas', texto: 'Conectamos bandas y espacios.' },
  { titulo: 'Organizamos el evento', texto: 'Producción, logística y promoción.' },
  { titulo: 'Compartimos escenario', texto: 'Varias bandas y nuevas audiencias.' },
  { titulo: 'Hacemos crecer la escena', texto: 'Cada evento genera nuevas conexiones.' },
];
