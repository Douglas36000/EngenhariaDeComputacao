export type PerfilUsuario = "Administrador" | "Professor" | "Aluno";

export interface Usuario {
  nome: string;
  email: string;
  senhaHash: string;
  idade: number;
  perfil: PerfilUsuario;
  matricula?: string;
}

// Simulação de banco de dados em memória
export const fakeUsersDb: Map<string, Usuario> = new Map();
