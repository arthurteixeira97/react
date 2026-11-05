import jwt from 'jsonwebtoken';

// Exige token válido. Coloca { id, nome, perfil } em req.user.
export function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ erro: 'Não autenticado' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão expirada ou inválida' });
  }
}

// Uso: router.post('/', autorizar('admin'), handler)
export const autorizar = (...perfis) => (req, res, next) => {
  if (!perfis.includes(req.user?.perfil)) return res.status(403).json({ erro: 'Sem permissão' });
  next();
};
