import cors from "cors";
import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CadastroUsuarioSchema, LoginSchema } from "./schemas.js";
import { fakeUsersDb } from "./database.js";
import { autenticarToken, exigirPerfis, SECRET_KEY } from "./middlewares.js";

const app = express();
app.use(cors());
app.use(express.json());

// --- ROTA DE CADASTRO (ATIVIDADE PRÁTICA 1) ---
app.post("/usuarios/cadastro", async (req: Request, res: Response) => {
  const validacao = CadastroUsuarioSchema.safeParse(req.body);

  if (!validacao.success) {
    res.status(400).json({
      erro: "Falha na validação dos dados.",
      detalhes: validacao.error.flatten().fieldErrors,
    });
    return;
  }

  const dados = validacao.data;

  if (fakeUsersDb.has(dados.email)) {
    res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    return;
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  fakeUsersDb.set(dados.email, {
    nome: dados.nome,
    email: dados.email,
    senhaHash,
    idade: dados.idade,
    perfil: dados.perfil,
    matricula: dados.matricula,
  });

  res.status(201).json({
    mensagem: "Usuário cadastrado com sucesso!",
    usuario: {
      nome: dados.nome,
      email: dados.email,
      idade: dados.idade,
      perfil: dados.perfil,
      matricula: dados.matricula ?? null,
    },
  });
});

// --- ROTA DE LOGIN (ATIVIDADE PRÁTICA 2) ---
app.post("/login", async (req: Request, res: Response) => {
  const validacao = LoginSchema.safeParse(req.body);

  if (!validacao.success) {
    res.status(400).json({ erro: "Informe e-mail e senha válidos." });
    return;
  }

  const { email, senha } = validacao.data;
  const usuario = fakeUsersDb.get(email);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    res.status(401).json({ erro: "E-mail ou senha incorretos." });
    return;
  }

  const token = jwt.sign(
    { email: usuario.email, perfil: usuario.perfil },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({ access_token: token, token_type: "Bearer" });
});

// --- ROTAS PROTEGIDAS POR PERFIL (ATIVIDADE PRÁTICA 2) ---

app.get(
  "/admin/painel",
  autenticarToken,
  exigirPerfis(["Administrador"]),
  (req: Request, res: Response) => {
    const usuario = fakeUsersDb.get(req.usuario!.email);
    res.json({
      mensagem: `Bem-vindo ao painel administrativo, ${usuario?.nome}.`,
      funcionalidades: [
        "Gerenciar usuários",
        "Configurar parâmetros do sistema",
        "Emitir relatórios gerais",
      ],
    });
  }
);

app.post(
  "/professor/lancar-notas",
  autenticarToken,
  exigirPerfis(["Professor"]),
  (req: Request, res: Response) => {
    const usuario = fakeUsersDb.get(req.usuario!.email);
    res.json({
      mensagem: `Acesso autorizado para o(a) Prof. ${usuario?.nome}.`,
      funcionalidades: [
        "Lançar notas",
        "Registrar frequência",
        "Criar avaliações",
      ],
    });
  }
);

app.get(
  "/aluno/boletim",
  autenticarToken,
  exigirPerfis(["Aluno"]),
  (req: Request, res: Response) => {
    const usuario = fakeUsersDb.get(req.usuario!.email);
    res.json({
      mensagem: `Boletim acadêmico de ${usuario?.nome} (Matrícula: ${usuario?.matricula}).`,
      funcionalidades: [
        "Visualizar notas",
        "Consultar faltas",
        "Baixar histórico escolar",
      ],
    });
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
