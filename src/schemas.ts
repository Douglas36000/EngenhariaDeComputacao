import { z } from "zod";

export const CadastroUsuarioSchema = z
  .object({
    nome: z
      .string({ required_error: "O nome é obrigatório." })
      .min(3, "O nome deve ter no mínimo 3 caracteres.")
      .max(100, "O nome deve ter no máximo 100 caracteres."),
    email: z
      .string({ required_error: "O e-mail é obrigatório." })
      .email("Formato de e-mail inválido."),
    senha: z
      .string({ required_error: "A senha é obrigatória." })
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
      .regex(/\d/, "A senha deve conter pelo menos um número.")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "A senha deve conter pelo menos um caractere especial."
      ),
    confirmacaoSenha: z.string({
      required_error: "A confirmação de senha é obrigatória.",
    }),
    idade: z
      .number({ required_error: "A idade é obrigatória." })
      .int("A idade deve ser um número inteiro.")
      .min(16, "A idade mínima para cadastro é 16 anos.")
      .max(120, "Idade inválida."),
    perfil: z.enum(["Administrador", "Professor", "Aluno"], {
      errorMap: () => ({
        message: "O perfil deve ser: Administrador, Professor ou Aluno.",
      }),
    }),
    matricula: z.string().optional(),
  })
  // Regra de Negócio 1: Senhas devem coincidir
  .refine((data) => data.senha === data.confirmacaoSenha, {
    message: "A senha e a confirmação de senha não coincidem.",
    path: ["confirmacaoSenha"],
  })
  // Regra de Negócio 2: Alunos e Professores devem informar matrícula
  .refine(
    (data) => {
      if (data.perfil === "Aluno" || data.perfil === "Professor") {
        return Boolean(data.matricula && data.matricula.trim().length > 0);
      }
      return true;
    },
    {
      message: "O campo 'matricula' é obrigatório para Alunos e Professores.",
      path: ["matricula"],
    }
  )
  // Regra de Negócio 3: Administradores devem usar e-mail institucional
  .refine(
    (data) => {
      if (data.perfil === "Administrador") {
        return data.email.endsWith("@instituicao.edu.br");
      }
      return true;
    },
    {
      message:
        "Administradores devem utilizar um e-mail institucional (@instituicao.edu.br).",
      path: ["email"],
    }
  );

export const LoginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "A senha é obrigatória."),
});
