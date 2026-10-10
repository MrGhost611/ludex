const bcrypt = require('bcryptjs');
const db = require('./db');

function upsertUser(username, fullName, role, group, password = 'ludex123') {
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return exists.id;
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (username, password_hash, full_name, role, group_name) VALUES (?,?,?,?,?)'
  ).run(username, hash, fullName, role, group || null);
  return info.lastInsertRowid;
}

// --- usuarios de ejemplo (contraseña para todos: ludex123) ---
upsertUser('admin', 'Administrador Ludex', 'admin', null, process.env.ADMIN_PASSWORD || 'ludex123');
upsertUser('docente.6a', 'Wilfer Escalante', 'teacher', '6-A');
upsertUser('ana.martinez', 'Ana Martínez', 'student', '6-A');
upsertUser('luis.torres', 'Luis Torres', 'student', '6-A');

// --- juegos ---
db.prepare("INSERT OR IGNORE INTO games (id, name) VALUES ('chess','Ajedrez')").run();
db.prepare("INSERT OR IGNORE INTO games (id, name) VALUES ('domino','Dominó')").run();

// --- niveles de ajedrez ---
const chessLevels = [
  {
    id: 'chess-1', order_index: 1, title: 'Nivel 1: El peón y la torre',
    lesson_title: 'El peón avanza y la torre domina líneas rectas',
    lesson_body: 'El peón se mueve una casilla hacia adelante (dos en su primer movimiento) y captura en diagonal. La torre se mueve en línea recta, tantas casillas como quiera, mientras no haya piezas en el camino.',
    math_connection: 'Desde el centro del tablero, una torre puede llegar hasta 14 casillas distintas en un solo movimiento. Cuenta cuántas casillas domina desde una esquina.'
  },
  {
    id: 'chess-2', order_index: 2, title: 'Nivel 2: El caballo',
    lesson_title: 'El caballo se mueve en forma de L',
    lesson_body: 'Salta dos casillas en línea recta y una hacia un lado. Es la única pieza que puede saltar sobre otras piezas.',
    math_connection: 'Desde el centro del tablero el caballo puede llegar a 8 casillas distintas. Desde una esquina, ¿a cuántas llega? Compara los dos resultados.'
  },
  {
    id: 'chess-3', order_index: 3, title: 'Nivel 3: El alfil',
    lesson_title: 'El alfil recorre las diagonales',
    lesson_body: 'El alfil se mueve en diagonal, tantas casillas como quiera, sin saltar piezas. Cada alfil se queda siempre en casillas del mismo color: uno en casillas blancas y otro en negras.',
    math_connection: 'Desde d4 en un tablero vacío el alfil domina 13 casillas (7 en una diagonal y 6 en la otra). Prueba desde una esquina y compara.'
  },
  {
    id: 'chess-4', order_index: 4, title: 'Nivel 4: La dama',
    lesson_title: 'La dama es torre y alfil a la vez',
    lesson_body: 'La dama se mueve como una torre y como un alfil: en línea recta o en diagonal, tantas casillas como quiera. Es la pieza más poderosa, por eso vale 9 puntos.',
    math_connection: 'Desde d4 la dama domina 14 casillas como torre más 13 como alfil: 14 + 13 = 27. ¡Sumar te ayuda a medir su poder!'
  },
  {
    id: 'chess-5', order_index: 5, title: 'Nivel 5: El rey y el jaque mate',
    lesson_title: 'El rey se mueve de a una casilla y nunca puede quedar en jaque',
    lesson_body: 'El rey se mueve una casilla en cualquier dirección. Si una pieza lo ataca hay jaque y debes protegerlo. Si no hay forma de salvarlo, es jaque mate y termina la partida. Si no estás en jaque pero no tienes jugadas, son tablas (rey ahogado).',
    math_connection: 'Un rey en el centro tiene 8 casillas alrededor; en una esquina solo 3. Los mates se dan más fácil en los bordes: ¡por eso el conteo importa!'
  },
  {
    id: 'chess-6', order_index: 6, title: 'Nivel 6: Valor de las piezas y estrategia',
    lesson_title: 'Cada pieza vale puntos: úsalos para decidir cambios',
    lesson_body: 'Peón = 1, caballo = 3, alfil = 3, torre = 5 y dama = 9. Antes de capturar o cambiar piezas, suma y resta: si ganas más puntos de los que pierdes, el cambio te conviene.',
    math_connection: 'Cambiar un caballo (3) por una torre (5) te da +2 puntos. Lleva la cuenta del material en el panel de la partida: es una resta continua.'
  }
];
const insLevel = db.prepare(`INSERT OR IGNORE INTO levels
  (id, game_id, order_index, title, lesson_title, lesson_body, math_connection)
  VALUES (@id,'chess',@order_index,@title,@lesson_title,@lesson_body,@math_connection)`);
chessLevels.forEach(l => insLevel.run(l));

// --- niveles de dominó ---
const dominoLevels = [
  {
    id: 'domino-1', order_index: 1, title: 'Nivel 1: Encajar fichas',
    lesson_title: 'Cada ficha tiene dos mitades con puntos del 0 al 6',
    lesson_body: 'Para jugar una ficha, uno de sus lados debe tener el mismo número que un extremo abierto de la mesa. Si no tienes una ficha que encaje, pasas el turno.',
    math_connection: 'Antes de jugar una ficha, suma los puntos de sus dos lados. Esa suma te ayuda a decidir qué ficha te conviene más soltar primero.'
  },
  {
    id: 'domino-2', order_index: 2, title: 'Nivel 2: Sumar y decidir',
    lesson_title: 'Los puntos de tu mano cuentan: menos puntos, mejor',
    lesson_body: 'Si el juego se tranca, gana quien tenga menos puntos en la mano. Por eso conviene soltar primero las fichas con más puntos. Si no tienes ficha y el pozo tiene fichas, debes robar; si el pozo está vacío, pasas.',
    math_connection: 'Suma los puntos de toda tu mano durante la partida (el juego te los muestra). Intenta que ese número baje rápido.'
  },
  {
    id: 'domino-3', order_index: 3, title: 'Nivel 3: Estrategia y probabilidad',
    lesson_title: 'Cada número aparece en 7 fichas: cuenta las que faltan',
    lesson_body: 'En el doble-seis cada número está en 7 fichas. Si ves 5 fichas con el 3 (en la mesa y en tu mano), solo quedan 2 ocultas. Con esa información puedes adivinar qué le falta al rival y cerrarle el juego.',
    math_connection: 'Probabilidad = casos favorables / casos posibles. Si hay 3 fichas ocultas con un 5 entre 21 fichas ocultas, la probabilidad es 3/21 = 1/7.'
  },
  {
    id: 'domino-4', order_index: 4, title: 'Nivel 4: Maestro del dominó',
    lesson_title: 'Pon todo junto: suma, conteo y probabilidad',
    lesson_body: 'Combina todo lo aprendido: suma tus puntos, cuenta fichas ocultas, recuerda cuándo pasó tu rival y elige extremos que a él le cuesten. El bot de este nivel juega con estrategia.',
    math_connection: 'Al empezar hay 28 fichas: 7 para ti, 7 para el bot y 14 en el pozo. 7 + 7 + 14 = 28.'
  }
];
const insLevelD = db.prepare(`INSERT OR IGNORE INTO levels
  (id, game_id, order_index, title, lesson_title, lesson_body, math_connection)
  VALUES (@id,'domino',@order_index,@title,@lesson_title,@lesson_body,@math_connection)`);
dominoLevels.forEach(l => insLevelD.run(l));

// --- retos (challenge stage) ---
const challenges = [
  {
    id: 'ch-chess-1-1', level_id: 'chess-1', order_index: 1, topic: 'Lógica · Conteo',
    prompt: 'Una torre está en la esquina a1 de un tablero vacío de 8x8. ¿En cuántas casillas distintas se puede mover en un solo turno?',
    options: JSON.stringify(['7', '14', '8', '21']), correct_index: 1,
    explanation: 'Desde a1 puede recorrer las 7 casillas de su columna y las 7 de su fila: 7 + 7 = 14.',
    hint: 'Cuenta por separado la fila y la columna, luego suma.', points: 20
  },
  {
    id: 'ch-chess-1-2', level_id: 'chess-1', order_index: 2, topic: 'Matemáticas · Suma',
    prompt: 'Si un peón blanco avanza 2 casillas en su primer turno y luego 1 casilla más, ¿cuántas casillas avanzó en total?',
    options: JSON.stringify(['2', '3', '4', '1']), correct_index: 1,
    explanation: '2 casillas en el primer movimiento más 1 casilla después: 2 + 1 = 3.',
    hint: 'Suma los dos movimientos.', points: 15
  },
  {
    id: 'ch-chess-2-1', level_id: 'chess-2', order_index: 1, topic: 'Lógica · Conteo',
    prompt: 'Un caballo está en el centro de un tablero vacío. ¿A cuántas casillas distintas puede saltar?',
    options: JSON.stringify(['6', '8', '4', '10']), correct_index: 1,
    explanation: 'Desde el centro, el caballo tiene las 8 combinaciones de la forma en L disponibles.',
    hint: 'Dibuja las 8 formas de "2 y 1" alrededor del caballo.', points: 20
  },
  {
    id: 'ch-domino-1-1', level_id: 'domino-1', order_index: 1, topic: 'Estadística y probabilidad',
    prompt: 'Un dominó doble-seis tiene 28 fichas en total. Si sacas una ficha al azar, ¿cuál es la probabilidad de que sea un doble (mismo número en ambos lados)?',
    options: JSON.stringify(['1/2', '1/4', '1/7', '7/14']), correct_index: 1,
    explanation: 'Hay 7 fichas dobles (0-0 a 6-6) de 28 en total: 7/28 se simplifica a 1/4.',
    hint: 'Cuenta cuántas fichas dobles hay en total (del 0-0 al 6-6).', points: 25
  },
  {
    id: 'ch-domino-1-2', level_id: 'domino-1', order_index: 2, topic: 'Matemáticas · Suma',
    prompt: 'Tienes la ficha [6|2]. Un extremo de la mesa muestra un 2. ¿Cuánto suman los dos lados de tu ficha?',
    options: JSON.stringify(['6', '8', '4', '12']), correct_index: 1,
    explanation: '6 + 2 = 8.',
    hint: 'Suma los dos números de la ficha.', points: 15
  }  ,
  { id: 'ch-chess-3-1', level_id: 'chess-3', order_index: 1, topic: 'Lógica · Conteo',
    prompt: 'Un alfil está en d4 de un tablero vacío. ¿A cuántas casillas distintas puede moverse?',
    options: JSON.stringify(['9', '13', '14', '11']), correct_index: 1,
    explanation: 'Una diagonal le da 7 casillas y la otra 6: 7 + 6 = 13.', hint: 'Cuenta cada diagonal por separado.', points: 20 },
  { id: 'ch-chess-3-2', level_id: 'chess-3', order_index: 2, topic: 'Lógica · Razonamiento',
    prompt: 'Un alfil empieza en una casilla blanca. ¿Podrá llegar alguna vez a una casilla negra?',
    options: JSON.stringify(['Sí, tras dos movimientos', 'No, siempre queda en casillas blancas', 'Sí, si captura', 'Solo en el primer turno']), correct_index: 1,
    explanation: 'Cada paso en diagonal te lleva a una casilla del mismo color, así que el alfil nunca cambia de color.', hint: 'Dibuja una diagonal y mira los colores.', points: 20 },
  { id: 'ch-chess-4-1', level_id: 'chess-4', order_index: 1, topic: 'Matemáticas · Suma',
    prompt: 'Una dama en d4 (tablero vacío) se mueve como torre (14 casillas) y como alfil (13). ¿A cuántas casillas llega en total?',
    options: JSON.stringify(['27', '21', '28', '14']), correct_index: 0,
    explanation: '14 + 13 = 27 casillas.', hint: 'Suma lo que domina como torre con lo que domina como alfil.', points: 20 },
  { id: 'ch-chess-4-2', level_id: 'chess-4', order_index: 2, topic: 'Matemáticas · Suma',
    prompt: 'Tu dama captura una torre (5 puntos) y luego un alfil (3 puntos). ¿Cuántos puntos de material ganaste?',
    options: JSON.stringify(['8', '12', '14', '9']), correct_index: 0,
    explanation: '5 + 3 = 8 puntos.', hint: 'Torre = 5, alfil = 3.', points: 15 },
  { id: 'ch-chess-5-1', level_id: 'chess-5', order_index: 1, topic: 'Lógica · Conteo',
    prompt: 'Un rey está en el centro de un tablero vacío. ¿A cuántas casillas puede moverse?',
    options: JSON.stringify(['4', '6', '8', '9']), correct_index: 2,
    explanation: 'Se mueve una casilla en cualquier dirección: 8 casillas alrededor.', hint: 'Cuenta las casillas que rodean al rey.', points: 20 },
  { id: 'ch-chess-5-2', level_id: 'chess-5', order_index: 2, topic: 'Lógica · Conteo',
    prompt: 'Ahora el rey está en la esquina a1. ¿A cuántas casillas puede moverse?',
    options: JSON.stringify(['2', '3', '4', '5']), correct_index: 1,
    explanation: 'Solo tiene a2, b1 y b2: 3 casillas. Por eso los reyes en las esquinas son más fáciles de acorralar.', hint: 'Las esquinas tienen menos vecinos.', points: 20 },
  { id: 'ch-chess-6-1', level_id: 'chess-6', order_index: 1, topic: 'Matemáticas · Comparación',
    prompt: 'Las blancas tienen dama y 2 peones (9 + 2). Las negras tienen torre y alfil (5 + 3). ¿Quién tiene más material?',
    options: JSON.stringify(['Blancas por 3', 'Negras por 3', 'Blancas por 1', 'Empate']), correct_index: 0,
    explanation: 'Blancas: 11. Negras: 8. Diferencia: 11 - 8 = 3.', hint: 'Suma cada bando y resta.', points: 25 },
  { id: 'ch-chess-6-2', level_id: 'chess-6', order_index: 2, topic: 'Matemáticas · Resta',
    prompt: 'Cambias tu caballo (3) por una torre rival (5). ¿Cuántos puntos de material ganas con el cambio?',
    options: JSON.stringify(['2', '3', '5', '8']), correct_index: 0,
    explanation: 'Ganas 5 y pierdes 3: 5 - 3 = 2 puntos.', hint: 'Resta lo que ganas menos lo que pierdes.', points: 20 },
  { id: 'ch-domino-2-1', level_id: 'domino-2', order_index: 1, topic: 'Matemáticas · Suma',
    prompt: 'Tu mano es [6|6], [3|2] y [0|1]. ¿Cuántos puntos tienes en total?',
    options: JSON.stringify(['16', '18', '17', '20']), correct_index: 1,
    explanation: '12 + 5 + 1 = 18 puntos.', hint: 'Suma ficha por ficha.', points: 20 },
  { id: 'ch-domino-2-2', level_id: 'domino-2', order_index: 2, topic: 'Lógica · Conteo',
    prompt: 'En un dominó doble-seis, ¿cuántas fichas tienen al menos un 4?',
    options: JSON.stringify(['6', '7', '8', '4']), correct_index: 1,
    explanation: '[4|0], [4|1], [4|2], [4|3], [4|4], [4|5], [4|6]: son 7 fichas.', hint: 'Combina el 4 con 0, 1, 2, 3, 4, 5 y 6.', points: 20 },
  { id: 'ch-domino-3-1', level_id: 'domino-3', order_index: 1, topic: 'Estadística y probabilidad',
    prompt: 'Hay 7 fichas con el número 3. Ves 4 de ellas en la mesa y en tu mano. ¿Cuántas siguen ocultas?',
    options: JSON.stringify(['3', '4', '7', '11']), correct_index: 0,
    explanation: '7 - 4 = 3 fichas ocultas.', hint: 'Resta lo que ves del total de 7.', points: 25 },
  { id: 'ch-domino-3-2', level_id: 'domino-3', order_index: 2, topic: 'Estadística y probabilidad',
    prompt: 'Hay 21 fichas ocultas y 3 de ellas tienen un 5. Si el bot toma una al azar, ¿qué probabilidad hay de que tenga un 5?',
    options: JSON.stringify(['1/3', '1/7', '3/7', '1/21']), correct_index: 1,
    explanation: '3/21 se simplifica dividiendo entre 3: 1/7.', hint: 'Casos favorables entre casos posibles, luego simplifica.', points: 25 },
  { id: 'ch-domino-4-1', level_id: 'domino-4', order_index: 1, topic: 'Matemáticas · Suma y comparación',
    prompt: 'El juego se tranca. Tú tienes fichas que suman 9 + 4 + 7 y el bot suma 18. ¿Quién gana?',
    options: JSON.stringify(['Tú, por 2', 'El bot, por 2', 'Empate', 'El bot, por 38']), correct_index: 1,
    explanation: 'Tú: 9 + 4 + 7 = 20. Bot: 18. Gana quien tiene menos puntos: el bot por 2.', hint: 'Suma tus fichas y compara.', points: 25 },
  { id: 'ch-domino-4-2', level_id: 'domino-4', order_index: 2, topic: 'Matemáticas · Resta',
    prompt: 'El dominó tiene 28 fichas y cada jugador recibe 7. ¿Cuántas fichas quedan en el pozo?',
    options: JSON.stringify(['7', '14', '21', '28']), correct_index: 1,
    explanation: '28 - 7 - 7 = 14 fichas.', hint: 'Resta las fichas repartidas.', points: 20 }
];
const insChallenge = db.prepare(`INSERT OR IGNORE INTO challenges
  (id, level_id, order_index, topic, prompt, options, correct_index, explanation, hint, points)
  VALUES (@id,@level_id,@order_index,@topic,@prompt,@options,@correct_index,@explanation,@hint,@points)`);
challenges.forEach(c => insChallenge.run(c));

// --- diagnóstico inicial ---
const diag = [
  { id: 'd1', order_index: 1, topic: 'Lógica · Patrones', prompt: '¿Qué número sigue: 2, 4, 8, 16, ?', options: JSON.stringify(['24','32','20','18']), correct_index: 1 },
  { id: 'd2', order_index: 2, topic: 'Matemáticas', prompt: '¿Cuánto es 7 + 5?', options: JSON.stringify(['11','12','13','10']), correct_index: 1 },
  { id: 'd3', order_index: 3, topic: 'Ajedrez básico', prompt: '¿Cuántas casillas tiene un tablero de ajedrez?', options: JSON.stringify(['32','48','64','100']), correct_index: 2 },
  { id: 'd4', order_index: 4, topic: 'Dominó básico', prompt: '¿Cuántas fichas tiene un dominó doble-seis completo?', options: JSON.stringify(['28','24','36','21']), correct_index: 0 },
  { id: 'd5', order_index: 5, topic: 'Lógica', prompt: 'Si hoy es martes, ¿qué día será dentro de 3 días?', options: JSON.stringify(['Jueves','Viernes','Sábado','Miércoles']), correct_index: 1 }
];
const insDiag = db.prepare(`INSERT OR IGNORE INTO diagnostic_questions
  (id, order_index, topic, prompt, options, correct_index) VALUES (@id,@order_index,@topic,@prompt,@options,@correct_index)`);
diag.forEach(d => insDiag.run(d));

// --- logros ---
const achievements = [
  { id: 'first-level', name: 'Primer nivel', icon: '🏆', description: 'Completaste tu primer nivel.' },
  { id: 'chess-knight', name: 'Caballo saltarín', icon: '♞', description: 'Aprendiste el movimiento del caballo.' },
  { id: 'domino-double', name: 'Doble seis', icon: '🁛', description: 'Superaste el reto de probabilidad del dominó.' },
  { id: 'chess-queen', name: 'Reina del tablero', icon: '♛', description: 'Dominas la dama.' },
  { id: 'chess-master', name: 'Estratega', icon: '♚', description: 'Completaste todos los niveles de ajedrez.' },
  { id: 'domino-master', name: 'Maestro del dominó', icon: '🎲', description: 'Completaste todos los niveles de dominó.' }
];
const insAch = db.prepare('INSERT OR IGNORE INTO achievements (id, name, icon, description) VALUES (@id,@name,@icon,@description)');
achievements.forEach(a => insAch.run(a));

// --- inicializar progreso de estudiantes de ejemplo: nivel 1 desbloqueado ---
const students = db.prepare("SELECT id FROM users WHERE role='student'").all();
const levels = db.prepare('SELECT id, game_id, order_index FROM levels').all();
const insProg = db.prepare(`INSERT OR IGNORE INTO student_progress (user_id, game_id, level_id, unlocked) VALUES (?,?,?,?)`);
const insPoints = db.prepare('INSERT OR IGNORE INTO student_points (user_id, total_points) VALUES (?, 0)');
students.forEach(s => {
  insPoints.run(s.id);
  levels.forEach(l => {
    insProg.run(s.id, l.game_id, l.id, l.order_index === 1 ? 1 : 0);
  });
});

console.log('Seed completado. Usuarios demo (contraseña: ludex123):');
console.log(' - admin / ludex123 (administrador)');
console.log(' - docente.6a / ludex123 (docente)');
console.log(' - ana.martinez / ludex123 (estudiante)');
console.log(' - luis.torres / ludex123 (estudiante)');