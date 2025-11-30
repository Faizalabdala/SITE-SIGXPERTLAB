const jwt = require("jsonwebtoken");

// IMPORTANTE: Esta chave tem de ser IGUAL à usada no AuthController.js
// Em produção, isso deve vir de process.env.SECRET_KEY
const SECRET_KEY = "segredo_super_secreto_mude_em_producao";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Verifica se o header existe
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  // 2. O formato é "Bearer <token>". Vamos separar as partes.
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no Token" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  // 3. Verificar a validade do token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });

    // SUCESSO!
    // Colocamos o ID do usuário direto na requisição para as próximas rotas usarem.
    req.userId = decoded.id;

    return next(); // Pode passar para a próxima fase
  });
};
