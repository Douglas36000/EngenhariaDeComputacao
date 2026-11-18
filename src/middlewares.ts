import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PerfilUsuario } from "./database.js";

export const SECRET_KEY = "chave_super_secreta_para_atividade_pratica";

export interface TokenPayload {
  email: string;
  perfil: PerfilUsuario;
}

// Estende a tipagem do Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export function autenticarToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ erro: "Token de autenticação não fornecido." });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

export function exigirPerfis(perfisPermitidos: PerfilUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ erro: "Usuário não autenticado." });
      return;
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      res.status(403).json({
        erro: `Acesso negado. Perfis permitidos: ${perfisPermitidos.join(", ")}.`,
      });
      return;
    }

    next();
  };
}
