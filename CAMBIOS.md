# Cambios en LUDEX
- Ajedrez: partida completa vs bot (4 dificultades), coronación, jaque/mate/tablas, pista, deshacer, material en puntos, misión por nivel. Niveles 3-6 nuevos (alfil, dama, rey y mate, valor de piezas).
- Dominó: partida completa (7 fichas c/u, pozo de 14), bot (3 estrategias), elegir lado, robar del pozo, y si el pozo está vacío: "Pasar turno" o "Responder una pregunta" (bonus ⭐). Niveles 2-4 nuevos con suma y probabilidad.
- Backend: seed con nuevos niveles/retos/logros; el mapa de ruta crea y desbloquea automáticamente los niveles nuevos para estudiantes existentes.
Para correr: `cd Backend && npm i && npm run seed && npm start` y `cd Frontend && npm i && npm run dev`.
