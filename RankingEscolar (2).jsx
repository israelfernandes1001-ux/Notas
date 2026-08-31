import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Trophy, Medal, TrendingUp, Users, BookOpen, LogIn, UserPlus, Sun, Moon,
  Menu, X, ChevronRight, Award, BarChart3, Settings, LogOut, Check,
  AlertCircle, Star, Zap, GraduationCap, School, Filter, Pencil, Trash2,
  Lock, Unlock, Plus, Save, KeyRound, Home, ClipboardList, LayoutDashboard,
  ShieldCheck, ChevronLeft, Info, Eye, EyeOff
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

/* ============================================================
   RANKING ESCOLAR — dados & regras
   ============================================================ */

const ETAPA_MAX = { 1: 30, 2: 35, 3: 35 };
const CATEGORIAS = { FGB: "Formação Geral Básica", ITINERARIO: "Itinerários" };

const SEED_TURMAS = [
  { id: "t-2a", nome: "2º A", serie: "2º ano", status: "ativa" },
  { id: "t-2b", nome: "2º B", serie: "2º ano", status: "ativa" },
  { id: "t-2c", nome: "2º C", serie: "2º ano", status: "ativa" },
  { id: "t-2d", nome: "2º D", serie: "2º ano", status: "ativa" },
];

const SEED_MATERIAS = [
  { id: "fgb-portugues", nome: "Português", categoria: "FGB", status: "ativa" },
  { id: "fgb-matematica", nome: "Matemática", categoria: "FGB", status: "ativa" },
  { id: "fgb-fisica", nome: "Física", categoria: "FGB", status: "ativa" },
  { id: "fgb-sociologia", nome: "Sociologia", categoria: "FGB", status: "ativa" },
  { id: "fgb-filosofia", nome: "Filosofia", categoria: "FGB", status: "ativa" },
  { id: "fgb-artes", nome: "Artes", categoria: "FGB", status: "ativa" },
  { id: "fgb-literatura", nome: "Literatura", categoria: "FGB", status: "ativa" },
  { id: "fgb-biologia", nome: "Biologia", categoria: "FGB", status: "ativa" },
  { id: "fgb-edfisica", nome: "Educação Física", categoria: "FGB", status: "ativa" },
  { id: "fgb-geografia", nome: "Geografia", categoria: "FGB", status: "ativa" },
  { id: "it-matcomp", nome: "Matemática Computacional", categoria: "ITINERARIO", status: "ativa" },
  { id: "it-especialidade", nome: "Linguagem e Expressividade Sonora", categoria: "ITINERARIO", status: "ativa" },
  { id: "it-edfin", nome: "Educação Financeira", categoria: "ITINERARIO", status: "ativa" },
  { id: "it-prodtexto", nome: "Produção de Texto", categoria: "ITINERARIO", status: "ativa" },
  { id: "it-quimica", nome: "Química", categoria: "ITINERARIO", status: "ativa" },
  { id: "it-fisica", nome: "Física", categoria: "ITINERARIO", status: "ativa" },
  { id: "it-ingles", nome: "Inglês", categoria: "ITINERARIO", status: "ativa" },
];

const NOMES_TESTE = [
  "João Pedro Alves", "Maria Clara Souza", "Lucas Gabriel Lima", "Ana Beatriz Costa",
  "Pedro Henrique Rocha", "Sofia Martins Dias", "Gabriel Ferreira Melo", "Isabela Santos Cruz",
  "Rafael Oliveira Reis", "Laura Fernandes Nunes"
];
const APELIDOS_TESTE = [
  "João", "Maria Clara", "Lucas", "Ana Bia", "Pedro H.", "Sofia", "Gabriel", "Isabela", "Rafael", "Laura"
];

function rnd(min, max, step = 0.5) {
  const n = Math.round((Math.random() * (max - min) + min) / step) * step;
  return Math.max(min, Math.min(max, n));
}

function buildSeed() {
  const users = [
    {
      id: "admin-1", displayName: "Admin",
      password: "admin123", turma: null, tipo: "admin",
      status: "ativo", createdAt: Date.now(), isTest: true,
    },
  ];
  const notas = {};
  const turmaIds = SEED_TURMAS.map((t) => t.id);

  NOMES_TESTE.forEach((fullName, i) => {
    const id = `aluno-teste-${i + 1}`;
    const turma = turmaIds[i % turmaIds.length];
    users.push({
      id, displayName: APELIDOS_TESTE[i],
      password: "123456", turma,
      tipo: "aluno", status: "ativo", createdAt: Date.now(), isTest: true,
    });

    // cada aluno de teste recebe notas em quase todas as matérias (skill leve varia por aluno)
    const skill = 0.55 + Math.random() * 0.4; // qualidade geral do aluno fictício
    SEED_MATERIAS.forEach((m) => {
      // 1 ou 2 alunos ficam sem notas em alguma matéria pra simular dado real
      if (Math.random() < 0.08) return;
      const base = Math.min(0.98, Math.max(0.35, skill + (Math.random() - 0.5) * 0.25));
      notas[`${id}__${m.id}`] = {
        e1: rnd(0, ETAPA_MAX[1] * base, 0.5),
        e2: rnd(0, ETAPA_MAX[2] * Math.min(1, base + 0.03), 0.5),
        e3: rnd(0, ETAPA_MAX[3] * Math.min(1, base + 0.06), 0.5),
        updatedAt: Date.now(),
      };
    });
  });

  return { users, turmas: SEED_TURMAS, materias: SEED_MATERIAS, notas };
}

/* ============================================================
   Helpers de cálculo
   ============================================================ */

function subjectStats(notasMap, userId, materiaId) {
  const g = notasMap[`${userId}__${materiaId}`];
  if (!g) return null;
  const parts = [];
  if (g.e1 !== undefined && g.e1 !== null && g.e1 !== "") parts.push([1, g.e1]);
  if (g.e2 !== undefined && g.e2 !== null && g.e2 !== "") parts.push([2, g.e2]);
  if (g.e3 !== undefined && g.e3 !== null && g.e3 !== "") parts.push([3, g.e3]);
  if (parts.length === 0) return null;
  let sum = 0, max = 0;
  parts.forEach(([etapa, val]) => { sum += Number(val); max += ETAPA_MAX[etapa]; });
  const complete = parts.length === 3;
  return {
    sum, max, percent: (sum / max) * 100, complete,
    e1: g.e1 ?? null, e2: g.e2 ?? null, e3: g.e3 ?? null,
    totalOn100: complete ? sum : null,
  };
}

function overallStats(notasMap, materias, userId) {
  const active = materias.filter((m) => m.status === "ativa");
  const subs = [];
  active.forEach((m) => {
    const s = subjectStats(notasMap, userId, m.id);
    if (s) subs.push({ materia: m, ...s });
  });
  if (subs.length === 0) return { percent: null, count: 0, best: null, subs: [] };
  const avg = subs.reduce((a, s) => a + s.percent, 0) / subs.length;
  const best = subs.reduce((a, b) => (b.percent > (a?.percent ?? -1) ? b : a), null);
  return { percent: avg, count: subs.length, best, subs, totalActive: active.length };
}

function etapaStats(notasMap, materias, userId, etapa) {
  const active = materias.filter((m) => m.status === "ativa");
  const vals = [];
  active.forEach((m) => {
    const g = notasMap[`${userId}__${m.id}`];
    const v = g ? g[`e${etapa}`] : undefined;
    if (v !== undefined && v !== null && v !== "") vals.push(Number(v));
  });
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  const max = vals.length * ETAPA_MAX[etapa];
  return { sum, max, percent: (sum / max) * 100, avgRaw: sum / vals.length, count: vals.length };
}

function fmt(n, d = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function computeAchievements(notasMap, materias, users, userId, rank) {
  const list = [];
  const os = overallStats(notasMap, materias, userId);
  if (rank === 1) list.push({ id: "top1", label: "Top 1", desc: "Primeiro lugar no ranking geral", icon: "trophy" });
  if (rank && rank <= 3) list.push({ id: "top3", label: "Top 3", desc: "Entre os três primeiros colocados", icon: "medal" });
  if (os.percent !== null && os.percent >= 90) list.push({ id: "90plus", label: "90+", desc: "Média geral acima de 90 pontos", icon: "zap" });
  if (os.subs.some((s) => s.complete && s.totalOn100 === 100)) list.push({ id: "max", label: "Nota Máxima", desc: "Conseguiu 100/100 em uma matéria", icon: "star" });
  const activeCount = materias.filter((m) => m.status === "ativa").length;
  if (os.count === activeCount && activeCount > 0) list.push({ id: "completo", label: "Aluno Completo", desc: "Possui notas em todas as matérias", icon: "book" });
  const e1 = etapaStats(notasMap, materias, userId, 1);
  const e3 = etapaStats(notasMap, materias, userId, 3);
  if (e1 && e3 && e3.percent > e1.percent) list.push({ id: "evolucao", label: "Evolução", desc: "Melhorou o desempenho entre as etapas", icon: "trending" });
  return list;
}

const ACH_ICON = { trophy: Trophy, medal: Medal, zap: Zap, star: Star, book: BookOpen, trending: TrendingUp };

/* ============================================================
   Tema / design tokens
   ============================================================ */

const THEME = {
  light: {
    bg: "#EFF1F6", surface: "#FFFFFF", surfaceAlt: "#F5F7FB", ink: "#151A2B",
    inkSoft: "#5B6478", border: "#DBE0EA", primary: "#2C3E8C", primarySoft: "#E7EAF7",
    gold: "#B8862F", goldSoft: "#F6E8CB", coral: "#C4442F", coralSoft: "#FBE6E1",
    green: "#2E7D46", greenSoft: "#E2F2E6",
  },
  dark: {
    bg: "#0E1120", surface: "#181C2E", surfaceAlt: "#1F2439", ink: "#EDEFF7",
    inkSoft: "#9BA2B8", border: "#2A2F48", primary: "#7C8CE0", primarySoft: "#232A4C",
    gold: "#E0B15C", goldSoft: "#33291A", coral: "#E77E6C", coralSoft: "#3A2320",
    green: "#6BC98A", greenSoft: "#1D3324",
  },
};

/* ============================================================
   App
   ============================================================ */

export default function RankingEscolar() {
  const [ready, setReady] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [users, setUsers] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [notas, setNotas] = useState({});
  const [mode, setMode] = useState("light");
  const [session, setSession] = useState(null); // userId
  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const T = THEME[mode];

  const showToast = useCallback((text, kind = "ok") => {
    setToast({ text, kind, key: Date.now() });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ---- carregar / semear banco de dados ----
  useEffect(() => {
    (async () => {
      try {
        let u, t, m, n;
        try { u = JSON.parse((await window.storage.get("re:users", true)).value); } catch { u = null; }
        try { t = JSON.parse((await window.storage.get("re:turmas", true)).value); } catch { t = null; }
        try { m = JSON.parse((await window.storage.get("re:materias", true)).value); } catch { m = null; }
        try { n = JSON.parse((await window.storage.get("re:notas", true)).value); } catch { n = null; }

        if (!u || !t || !m || !n) {
          const seed = buildSeed();
          u = u || seed.users;
          t = t || seed.turmas;
          m = m || seed.materias;
          n = n || seed.notas;
          await window.storage.set("re:users", JSON.stringify(u), true);
          await window.storage.set("re:turmas", JSON.stringify(t), true);
          await window.storage.set("re:materias", JSON.stringify(m), true);
          await window.storage.set("re:notas", JSON.stringify(n), true);
        }
        // migração: bancos criados antes da mudança para "2º ano" ainda têm turmas "1º"
        let turmasChanged = false;
        t = t.map((turma) => {
          if (turma.serie === "1º ano" || /^1º\s/.test(turma.nome)) {
            turmasChanged = true;
            return { ...turma, nome: turma.nome.replace(/^1º/, "2º"), serie: "2º ano" };
          }
          return turma;
        });
        if (turmasChanged) {
          await window.storage.set("re:turmas", JSON.stringify(t), true);
        }

        // migração: matéria "Especialidade Sonora" renomeada
        let materiasChanged = false;
        m = m.map((materia) => {
          if (materia.id === "it-especialidade" && materia.nome !== "Linguagem e Expressividade Sonora") {
            materiasChanged = true;
            return { ...materia, nome: "Linguagem e Expressividade Sonora" };
          }
          return materia;
        });
        if (materiasChanged) {
          await window.storage.set("re:materias", JSON.stringify(m), true);
        }

        setUsers(u); setTurmas(t); setMaterias(m); setNotas(n);

        try {
          const th = await window.storage.get("re:theme", false);
          if (th?.value) setMode(th.value);
        } catch { /* sem preferência salva ainda */ }
      } catch (e) {
        setDbError("Não foi possível conectar ao armazenamento de dados.");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistUsers = useCallback(async (next) => {
    setUsers(next);
    try { await window.storage.set("re:users", JSON.stringify(next), true); } catch { showToast("Erro ao salvar dados de usuários.", "err"); }
  }, [showToast]);
  const persistTurmas = useCallback(async (next) => {
    setTurmas(next);
    try { await window.storage.set("re:turmas", JSON.stringify(next), true); } catch { showToast("Erro ao salvar turmas.", "err"); }
  }, [showToast]);
  const persistMaterias = useCallback(async (next) => {
    setMaterias(next);
    try { await window.storage.set("re:materias", JSON.stringify(next), true); } catch { showToast("Erro ao salvar matérias.", "err"); }
  }, [showToast]);
  const persistNotas = useCallback(async (next) => {
    setNotas(next);
    try { await window.storage.set("re:notas", JSON.stringify(next), true); } catch { showToast("Erro ao salvar notas.", "err"); }
  }, [showToast]);

  const toggleTheme = useCallback(async () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    try { await window.storage.set("re:theme", next, false); } catch { /* preferência não crítica */ }
  }, [mode]);

  const currentUser = useMemo(() => users.find((u) => u.id === session) || null, [users, session]);

  function goto(v) { setView(v); setMenuOpen(false); }

  function logout() {
    setSession(null);
    goto("home");
    showToast("Sessão encerrada.");
  }

  if (!ready) {
    return (
      <div style={{ background: T.bg, color: T.ink }} className="min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Trophy className="animate-pulse" size={32} color={T.gold} />
          <p style={{ color: T.inkSoft }} className="text-sm">Carregando Notas do SESI…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.ink, "--r-primary": T.primary }} className="min-h-screen w-full font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .re-root, .re-root * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
        .re-display { font-family: 'Fraunces', Georgia, serif; }
        .re-num { font-variant-numeric: tabular-nums; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        .re-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .re-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      `}</style>
      <div className="re-root min-h-screen">
        {toast && <Toast toast={toast} T={T} />}
        {!currentUser ? (
          <PublicSite T={T} mode={mode} toggleTheme={toggleTheme} view={view} goto={goto}
            users={users} persistUsers={persistUsers} turmas={turmas} setSession={setSession} showToast={showToast} />
        ) : (
          <AppShell T={T} mode={mode} toggleTheme={toggleTheme} view={view} goto={goto}
            menuOpen={menuOpen} setMenuOpen={setMenuOpen} currentUser={currentUser}
            users={users} turmas={turmas} materias={materias} notas={notas}
            persistUsers={persistUsers} persistTurmas={persistTurmas} persistMaterias={persistMaterias} persistNotas={persistNotas}
            logout={logout} showToast={showToast} />
        )}
      </div>
    </div>
  );
}

function Toast({ toast, T }) {
  const bg = toast.kind === "err" ? T.coralSoft : toast.kind === "warn" ? T.goldSoft : T.greenSoft;
  const fg = toast.kind === "err" ? T.coral : toast.kind === "warn" ? T.gold : T.green;
  return (
    <div style={{ background: bg, color: fg, borderColor: fg }}
      className="fixed top-4 right-4 left-4 sm:left-auto z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg flex items-center gap-2 sm:max-w-sm">
      {toast.kind === "err" ? <AlertCircle size={16} /> : <Check size={16} />}
      <span>{toast.text}</span>
    </div>
  );
}

/* ============================================================
   SITE PÚBLICO (home / login / cadastro)
   ============================================================ */

function PublicSite({ T, mode, toggleTheme, view, goto, users, persistUsers, turmas, setSession, showToast }) {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur border-b" style={{ background: mode === "light" ? "rgba(239,241,246,0.85)" : "rgba(14,17,32,0.85)", borderColor: T.border }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={() => goto("home")} className="flex items-center gap-2">
            <div style={{ background: T.primary }} className="w-9 h-9 rounded-lg flex items-center justify-center">
              <Trophy size={18} color="#fff" />
            </div>
            <span className="re-display text-lg font-semibold">Notas do SESI</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} style={{ borderColor: T.border }} className="w-9 h-9 rounded-full border flex items-center justify-center">
              {mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {view !== "login" && (
              <button onClick={() => goto("login")} style={{ borderColor: T.border }} className="hidden sm:flex px-4 py-2 rounded-lg border text-sm font-medium items-center gap-1.5">
                <LogIn size={15} /> Entrar
              </button>
            )}
            {view !== "signup" && (
              <button onClick={() => goto("signup")} style={{ background: T.primary }} className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5">
                <UserPlus size={15} /> Criar conta
              </button>
            )}
          </div>
        </div>
      </header>

      {view === "login" && <LoginView T={T} users={users} turmas={turmas} persistUsers={persistUsers} setSession={setSession} goto={goto} showToast={showToast} />}
      {view === "signup" && <SignupView T={T} users={users} persistUsers={persistUsers} turmas={turmas} setSession={setSession} goto={goto} showToast={showToast} />}
      {(view === "home" || view === "") && <HomeView T={T} goto={goto} />}
    </div>
  );
}

function HomeView({ T, goto }) {
  const cards = [
    { icon: Trophy, title: "Ranking geral", desc: "Veja sua posição entre todos os alunos da escola, atualizada automaticamente." },
    { icon: BarChart3, title: "Pontuação total", desc: "Acompanhe sua média percentual em todas as matérias cadastradas." },
    { icon: BookOpen, title: "Desempenho por matéria", desc: "Notas da 1ª, 2ª e 3ª etapa organizadas por disciplina." },
    { icon: School, title: "Ranking por turma", desc: "Compare seu desempenho com o de colegas da mesma turma." },
  ];
  return (
    <main>
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="max-w-2xl">
          <div style={{ color: T.gold }} className="flex items-center gap-2 text-sm font-semibold mb-4">
            <Medal size={16} /> Plataforma de acompanhamento escolar
          </div>
          <h1 className="re-display text-4xl sm:text-6xl font-semibold leading-[1.05] mb-5">
            🏆 Notas do SESI
          </h1>
          <p style={{ color: T.inkSoft }} className="text-lg sm:text-xl leading-relaxed mb-8">
            Coloque suas notas, acompanhe seu desempenho e descubra sua posição no ranking.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => goto("login")} style={{ background: T.primary }} className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2">
              <LogIn size={17} /> Entrar
            </button>
            <button onClick={() => goto("signup")} style={{ borderColor: T.border }} className="px-6 py-3 rounded-lg border font-medium flex items-center gap-2">
              <UserPlus size={17} /> Criar conta
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <div key={i} style={{ background: T.surface, borderColor: T.border }} className="rounded-xl border p-5">
              <div style={{ background: T.primarySoft, color: T.primary }} className="w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <c.icon size={19} />
              </div>
              <h3 className="font-semibold mb-1.5">{c.title}</h3>
              <p style={{ color: T.inkSoft }} className="text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: T.surfaceAlt, borderColor: T.border }} className="border-t">
        <div className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Sistema de pontos</h4>
            <p style={{ color: T.inkSoft }}>1ª etapa: 0–30 · 2ª etapa: 0–35 · 3ª etapa: 0–35. Total de até 100 pontos por matéria.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Ranking justo</h4>
            <p style={{ color: T.inkSoft }}>A posição é calculada pela média percentual das matérias cadastradas — nunca pela soma bruta de pontos.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Conta individual</h4>
            <p style={{ color: T.inkSoft }}>Cada aluno só acessa e edita as próprias notas. Dados privados nunca aparecem no ranking.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginView({ T, users, turmas, persistUsers, setSession, goto, showToast }) {
  const [asAdmin, setAsAdmin] = useState(false);
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [turma, setTurma] = useState(turmas[0]?.id || "");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const [forgotNome, setForgotNome] = useState("");
  const [forgotTurma, setForgotTurma] = useState(turmas[0]?.id || "");
  const [tempPw, setTempPw] = useState(null);

  function handleLogin(e) {
    e.preventDefault();
    setError("");
    const nomeNorm = nome.trim().toLowerCase();
    const u = users.find((x) =>
      x.displayName.trim().toLowerCase() === nomeNorm &&
      (asAdmin ? x.tipo === "admin" : x.tipo === "aluno" && x.turma === turma)
    );
    if (!u || u.password !== password) { setError("Nome, senha ou turma incorretos."); return; }
    if (u.status === "bloqueado") { setError("Esta conta está bloqueada. Fale com a coordenação."); return; }
    setSession(u.id);
    goto(u.tipo === "admin" ? "admin" : "notas");
  }

  async function handleForgot(e) {
    e.preventDefault();
    const nomeNorm = forgotNome.trim().toLowerCase();
    const u = users.find((x) => x.displayName.trim().toLowerCase() === nomeNorm && x.tipo === "aluno" && x.turma === forgotTurma);
    if (!u) { showToast("Nenhuma conta encontrada com esse nome e turma.", "err"); return; }
    const newPw = Math.random().toString(36).slice(2, 8);
    const next = users.map((x) => x.id === u.id ? { ...x, password: newPw } : x);
    await persistUsers(next);
    setTempPw(newPw);
  }

  return (
    <main className="max-w-md mx-auto px-5 py-14 sm:py-20">
      <h1 className="re-display text-3xl font-semibold mb-1.5">{forgot ? "Recuperar senha" : "Bem-vindo de volta"}</h1>
      <p style={{ color: T.inkSoft }} className="mb-8 text-sm">{forgot ? "Informe seu nome e turma cadastrados." : "Entre para ver suas notas e sua posição no ranking."}</p>

      {!forgot ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Nome" T={T}>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required
              style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none" />
          </Field>
          <Field label="Senha" T={T}>
            <div className="relative">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} required
                style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 pr-10 rounded-lg border outline-none" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: T.inkSoft }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          {!asAdmin && (
            <Field label="Turma" T={T}>
              <select value={turma} onChange={(e) => setTurma(e.target.value)}
                style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none">
                {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </Field>
          )}
          {error && <p style={{ color: T.coral }} className="text-sm flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
          <button type="submit" style={{ background: T.primary }} className="w-full py-2.5 rounded-lg text-white font-medium">Entrar</button>
          <div className="flex justify-between text-sm pt-1 flex-wrap gap-2">
            <button type="button" onClick={() => setForgot(true)} style={{ color: T.primary }}>Esqueci minha senha</button>
            <button type="button" onClick={() => goto("signup")} style={{ color: T.inkSoft }}>Criar conta</button>
          </div>
          <button type="button" onClick={() => setAsAdmin(!asAdmin)} style={{ color: T.inkSoft }} className="text-xs w-full text-center pt-1">
            {asAdmin ? "← Voltar ao login de aluno" : "Sou administrador"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {!tempPw ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <Field label="Nome" T={T}>
                <input value={forgotNome} onChange={(e) => setForgotNome(e.target.value)} required
                  style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none" />
              </Field>
              <Field label="Turma" T={T}>
                <select value={forgotTurma} onChange={(e) => setForgotTurma(e.target.value)}
                  style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none">
                  {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </Field>
              <button type="submit" style={{ background: T.primary }} className="w-full py-2.5 rounded-lg text-white font-medium">Gerar nova senha</button>
              <button type="button" onClick={() => setForgot(false)} style={{ color: T.inkSoft }} className="text-sm">Voltar ao login</button>
            </form>
          ) : (
            <div style={{ background: T.greenSoft, borderColor: T.green }} className="rounded-lg border p-4 text-sm">
              <p className="font-medium mb-1" style={{ color: T.green }}>Senha redefinida</p>
              <p style={{ color: T.inkSoft }} className="mb-2">Não há envio de e-mail neste ambiente de demonstração — use a senha temporária abaixo para entrar e depois troque-a no seu perfil.</p>
              <p className="re-num font-mono text-base font-semibold">{tempPw}</p>
              <button onClick={() => { setForgot(false); setTempPw(null); }} style={{ color: T.primary }} className="text-sm mt-3 underline">Ir para o login</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Field({ label, T, children }) {
  return (
    <label className="block">
      <span style={{ color: T.inkSoft }} className="block text-xs font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function SignupView({ T, users, persistUsers, turmas, setSession, goto, showToast }) {
  const [form, setForm] = useState({ displayName: "", password: "", turma: turmas[0]?.id || "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.displayName.trim() || !form.password || !form.turma) {
      setError("Preencha todos os campos."); return;
    }
    if (form.password.length < 4) { setError("A senha deve ter pelo menos 4 caracteres."); return; }
    const nomeNorm = form.displayName.trim().toLowerCase();
    if (users.some((u) => u.tipo === "aluno" && u.turma === form.turma && u.displayName.trim().toLowerCase() === nomeNorm)) {
      setError("Já existe um aluno com esse nome nessa turma. Adicione um sobrenome ou apelido para diferenciar."); return;
    }
    const id = "aluno-" + Date.now().toString(36);
    const newUser = {
      id, displayName: form.displayName.trim(),
      password: form.password, turma: form.turma,
      tipo: "aluno", status: "ativo", createdAt: Date.now(), isTest: false,
    };
    await persistUsers([...users, newUser]);
    setSession(id);
    showToast("Conta criada com sucesso! Bem-vindo(a). 🎉");
    goto("notas");
  }

  return (
    <main className="max-w-md mx-auto px-5 py-14 sm:py-20">
      <h1 className="re-display text-3xl font-semibold mb-1.5">Criar conta</h1>
      <p style={{ color: T.inkSoft }} className="mb-8 text-sm">Cadastre-se para começar a acompanhar suas notas e seu ranking.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome (é o que aparecerá no ranking)" T={T}>
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required
            style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none" />
        </Field>
        <Field label="Senha" T={T}>
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required
            style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none" />
        </Field>
        <Field label="Turma" T={T}>
          <select value={form.turma} onChange={(e) => setForm({ ...form, turma: e.target.value })}
            style={{ background: T.surface, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border outline-none">
            {turmas.filter((t) => t.status === "ativa").map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </Field>
        {error && <p style={{ color: T.coral }} className="text-sm flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
        <button type="submit" style={{ background: T.primary }} className="w-full py-2.5 rounded-lg text-white font-medium">Criar minha conta</button>
        <button type="button" onClick={() => goto("login")} style={{ color: T.inkSoft }} className="text-sm w-full text-center">Já tenho conta — entrar</button>
      </form>
    </main>
  );
}

/* ============================================================
   APP SHELL (logado)
   ============================================================ */

function AppShell(props) {
  const { T, mode, toggleTheme, view, goto, menuOpen, setMenuOpen, currentUser, logout } = props;
  const isAdmin = currentUser.tipo === "admin";

  const navItems = isAdmin
    ? [
      { id: "admin", label: "Painel Admin", icon: ShieldCheck },
      { id: "ranking", label: "Ranking Global", icon: Trophy },
    ]
    : [
      { id: "dashboard", label: "Início", icon: LayoutDashboard },
      { id: "notas", label: "Minhas Notas", icon: ClipboardList },
      { id: "ranking", label: "Ranking", icon: Trophy },
      { id: "materia", label: "Por Matéria", icon: BookOpen },
      { id: "etapa", label: "Por Etapa", icon: BarChart3 },
    ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside style={{ background: T.surface, borderColor: T.border }} className="hidden lg:flex flex-col w-60 border-r shrink-0 min-h-screen sticky top-0">
        <div className="p-5 flex items-center gap-2">
          <div style={{ background: T.primary }} className="w-9 h-9 rounded-lg flex items-center justify-center"><Trophy size={18} color="#fff" /></div>
          <span className="re-display text-lg font-semibold">Notas do SESI</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((n) => (
            <button key={n.id} onClick={() => goto(n.id)}
              style={{ background: view === n.id ? T.primarySoft : "transparent", color: view === n.id ? T.primary : T.ink }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium">
              <n.icon size={17} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 space-y-1 border-t" style={{ borderColor: T.border }}>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: T.ink }}>
            {mode === "light" ? <Moon size={17} /> : <Sun size={17} />} {mode === "light" ? "Modo escuro" : "Modo claro"}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: T.coral }}>
            <LogOut size={17} /> Sair da conta
          </button>
        </div>
      </aside>

      {/* Drawer mobile */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div style={{ background: T.surface }} className="w-72 h-full p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="re-display text-lg font-semibold">Menu</span>
              <button onClick={() => setMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((n) => (
                <button key={n.id} onClick={() => goto(n.id)}
                  style={{ background: view === n.id ? T.primarySoft : "transparent", color: view === n.id ? T.primary : T.ink }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium">
                  <n.icon size={17} /> {n.label}
                </button>
              ))}
            </nav>
            <div className="space-y-1 pt-3 border-t" style={{ borderColor: T.border }}>
              <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium">
                {mode === "light" ? <Moon size={17} /> : <Sun size={17} />} {mode === "light" ? "Modo escuro" : "Modo claro"}
              </button>
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: T.coral }}>
                <LogOut size={17} /> Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Topbar mobile */}
        <header style={{ background: T.surface, borderColor: T.border }} className="lg:hidden sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
          <span className="re-display font-semibold">Notas do SESI</span>
          <div style={{ background: T.primarySoft, color: T.primary }} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold">
            {currentUser.displayName?.[0]?.toUpperCase()}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
          {view === "dashboard" && !isAdmin && <DashboardView {...props} />}
          {view === "notas" && !isAdmin && <NotasView {...props} />}
          {view === "ranking" && <RankingView {...props} />}
          {view === "materia" && !isAdmin && <RankingMateriaView {...props} />}
          {view === "etapa" && !isAdmin && <RankingEtapaView {...props} />}
          {view === "admin" && isAdmin && <AdminView {...props} />}
          {(view === "home" || view === "login" || view === "signup" || view === "") && (isAdmin ? <AdminView {...props} /> : <DashboardView {...props} />)}
        </main>

        {/* Bottom tab bar mobile */}
        {!isAdmin && (
          <nav style={{ background: T.surface, borderColor: T.border }} className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t flex justify-around py-2">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => goto(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1"
                style={{ color: view === n.id ? T.primary : T.inkSoft }}>
                <n.icon size={20} />
                <span className="text-[10px] font-medium">{n.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Card básico
   ============================================================ */
function Card({ T, className = "", children, style = {} }) {
  return (
    <div style={{ background: T.surface, borderColor: T.border, ...style }} className={`rounded-xl border p-5 ${className}`}>
      {children}
    </div>
  );
}

function ProgressBar({ percent, T, color }) {
  const c = color || (percent >= 90 ? T.green : percent >= 60 ? T.primary : T.coral);
  return (
    <div style={{ background: T.surfaceAlt }} className="w-full h-2 rounded-full overflow-hidden">
      <div style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: c }} className="h-full rounded-full transition-all" />
    </div>
  );
}

/* ============================================================
   DASHBOARD DO ALUNO
   ============================================================ */

function DashboardView({ T, currentUser, users, materias, notas }) {
  const os = overallStats(notas, materias, currentUser.id);
  const rankList = buildRanking(notas, materias, users, null);
  const myRank = rankList.findIndex((r) => r.user.id === currentUser.id) + 1;
  const achievements = computeAchievements(notas, materias, users, currentUser.id, myRank || null);

  const e1 = etapaStats(notas, materias, currentUser.id, 1);
  const e2 = etapaStats(notas, materias, currentUser.id, 2);
  const e3 = etapaStats(notas, materias, currentUser.id, 3);

  const evolChart = [
    { etapa: "1ª Etapa", percent: e1 ? Number(e1.percent.toFixed(1)) : 0 },
    { etapa: "2ª Etapa", percent: e2 ? Number(e2.percent.toFixed(1)) : 0 },
    { etapa: "3ª Etapa", percent: e3 ? Number(e3.percent.toFixed(1)) : 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="re-display text-2xl sm:text-3xl font-semibold mb-1">Olá, {currentUser.displayName}! 👋</h1>
        <p style={{ color: T.inkSoft }} className="text-sm">Aqui está um resumo do seu desempenho na escola.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard T={T} icon={Trophy} color={T.gold} label="Posição no ranking" value={myRank ? `${myRank}º` : "—"} />
        <StatCard T={T} icon={TrendingUp} color={T.primary} label="Média geral" value={os.percent !== null ? `${fmt(os.percent, 2)}` : "—"} />
        <StatCard T={T} icon={BookOpen} color={T.green} label="Matérias cadastradas" value={`${os.count}/${os.totalActive ?? materias.filter(m=>m.status==='ativa').length}`} />
        <StatCard T={T} icon={Star} color={T.coral} label="Melhor matéria" value={os.best ? os.best.materia.nome : "—"} small />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card T={T} className="lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={17} /> Evolução entre etapas</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="etapa" tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Aproveitamento"]} />
                <Line type="monotone" dataKey="percent" stroke={T.primary} strokeWidth={3} dot={{ r: 5, fill: T.primary }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <EtapaMini T={T} label="1ª Etapa" stat={e1} max={30} />
            <EtapaMini T={T} label="2ª Etapa" stat={e2} max={35} />
            <EtapaMini T={T} label="3ª Etapa" stat={e3} max={35} />
          </div>
        </Card>

        <Card T={T}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Award size={17} /> Conquistas</h3>
          {achievements.length === 0 ? (
            <p style={{ color: T.inkSoft }} className="text-sm">Continue cadastrando notas para desbloquear conquistas.</p>
          ) : (
            <div className="space-y-3">
              {achievements.map((a) => {
                const Icon = ACH_ICON[a.icon];
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <div style={{ background: T.goldSoft, color: T.gold }} className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{a.label}</p>
                      <p style={{ color: T.inkSoft }} className="text-xs">{a.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {os.subs.length > 0 && (
        <Card T={T}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BookOpen size={17} /> Pontuação final por matéria</h3>
          <div className="space-y-3">
            {os.subs.sort((a, b) => b.percent - a.percent).map((s) => (
              <div key={s.materia.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{s.materia.nome}</span>
                  <span className="re-num" style={{ color: T.inkSoft }}>{s.complete ? `${fmt(s.totalOn100,1)}/100` : `${fmt(s.sum,1)}/${s.max} (parcial)`}</span>
                </div>
                <ProgressBar percent={s.percent} T={T} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ T, icon: Icon, color, label, value, small }) {
  return (
    <Card T={T} className="!p-4">
      <div style={{ background: color + "20", color }} className="w-9 h-9 rounded-lg flex items-center justify-center mb-3">
        <Icon size={17} />
      </div>
      <p className={`re-num font-semibold ${small ? "text-base" : "text-xl"} leading-tight mb-0.5 truncate`}>{value}</p>
      <p style={{ color: T.inkSoft }} className="text-xs">{label}</p>
    </Card>
  );
}

function EtapaMini({ T, label, stat, max }) {
  return (
    <div style={{ background: T.surfaceAlt }} className="rounded-lg p-3">
      <p style={{ color: T.inkSoft }} className="text-xs mb-1">{label}</p>
      <p className="re-num font-semibold text-sm">{stat ? `${fmt(stat.avgRaw, 1)}/${max}` : "—"}</p>
    </div>
  );
}

/* ============================================================
   MINHAS NOTAS
   ============================================================ */

function NotasView({ T, currentUser, materias, notas, persistNotas, showToast }) {
  const [draft, setDraft] = useState({});
  const [errors, setErrors] = useState({});

  const fgb = materias.filter((m) => m.categoria === "FGB" && m.status === "ativa");
  const it = materias.filter((m) => m.categoria === "ITINERARIO" && m.status === "ativa");

  function getVal(materiaId, etapa) {
    const key = `${currentUser.id}__${materiaId}`;
    if (draft[key]?.[`e${etapa}`] !== undefined) return draft[key][`e${etapa}`];
    const v = notas[key]?.[`e${etapa}`];
    return v === undefined || v === null ? "" : String(v);
  }

  function setVal(materiaId, etapa, raw) {
    const key = `${currentUser.id}__${materiaId}`;
    setDraft((d) => ({ ...d, [key]: { ...d[key], [`e${etapa}`]: raw } }));
    const max = ETAPA_MAX[etapa];
    const num = raw === "" ? null : Number(raw.replace(",", "."));
    const errKey = `${key}_e${etapa}`;
    if (raw !== "" && (Number.isNaN(num) || num < 0 || num > max)) {
      setErrors((er) => ({ ...er, [errKey]: `Valor entre 0 e ${max}` }));
    } else {
      setErrors((er) => { const c = { ...er }; delete c[errKey]; return c; });
    }
  }

  async function handleSave() {
    if (Object.keys(errors).length > 0) { showToast("Corrija os valores inválidos antes de salvar.", "err"); return; }
    const next = { ...notas };
    let changed = 0;
    Object.entries(draft).forEach(([key, vals]) => {
      const existing = next[key] || { e1: null, e2: null, e3: null };
      const merged = { ...existing };
      [1, 2, 3].forEach((et) => {
        if (vals[`e${et}`] !== undefined) {
          const raw = vals[`e${et}`];
          merged[`e${et}`] = raw === "" ? null : Number(String(raw).replace(",", "."));
        }
      });
      merged.updatedAt = Date.now();
      next[key] = merged;
      changed++;
    });
    if (changed === 0) { showToast("Nenhuma alteração para salvar.", "warn"); return; }
    await persistNotas(next);
    setDraft({});
    showToast("Notas salvas com sucesso!");
  }

  const hasChanges = Object.keys(draft).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="re-display text-2xl sm:text-3xl font-semibold mb-1">Minhas Notas</h1>
          <p style={{ color: T.inkSoft }} className="text-sm">Informe a nota final de cada etapa. Use ponto ou vírgula para decimais (ex: 24.5 ou 24,5).</p>
        </div>
        <button onClick={handleSave} disabled={!hasChanges}
          style={{ background: hasChanges ? T.primary : T.border, color: hasChanges ? "#fff" : T.inkSoft }}
          className="px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shrink-0">
          <Save size={16} /> Salvar notas
        </button>
      </div>

      <NotasTable T={T} title="📘 FGB — Formação Geral Básica" materias={fgb} getVal={getVal} setVal={setVal} errors={errors} userId={currentUser.id} notas={notas} />
      <NotasTable T={T} title="🎯 Itinerários" materias={it} getVal={getVal} setVal={setVal} errors={errors} userId={currentUser.id} notas={notas} />
    </div>
  );
}

function NotasTable({ T, title, materias, getVal, setVal, errors, userId, notas }) {
  return (
    <Card T={T} className="!p-0 overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: T.border }}>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto re-scroll">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr style={{ color: T.inkSoft }} className="text-left">
              <th className="px-5 py-3 font-medium">Matéria</th>
              <th className="px-3 py-3 font-medium text-center">1ª Etapa /30</th>
              <th className="px-3 py-3 font-medium text-center">2ª Etapa /35</th>
              <th className="px-3 py-3 font-medium text-center">3ª Etapa /35</th>
              <th className="px-5 py-3 font-medium text-center">Total /100</th>
            </tr>
          </thead>
          <tbody>
            {materias.map((m) => {
              const s = subjectStats(notas, userId, m.id);
              return (
                <tr key={m.id} className="border-t" style={{ borderColor: T.border }}>
                  <td className="px-5 py-3 font-medium">{m.nome}</td>
                  {[1, 2, 3].map((et) => (
                    <td key={et} className="px-3 py-3">
                      <input value={getVal(m.id, et)} onChange={(e) => setVal(m.id, et, e.target.value)}
                        placeholder="—" inputMode="decimal"
                        style={{
                          background: T.surfaceAlt,
                          borderColor: errors[`${userId}__${m.id}_e${et}`] ? T.coral : T.border,
                        }}
                        className="re-num w-20 mx-auto block text-center px-2 py-1.5 rounded-md border outline-none" />
                    </td>
                  ))}
                  <td className="px-5 py-3 text-center">
                    <span className="re-num font-semibold">{s ? (s.complete ? `${fmt(s.totalOn100,1)}/100` : `${fmt(s.sum,1)}/${s.max}`) : "—"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ============================================================
   RANKING GLOBAL
   ============================================================ */

function buildRanking(notas, materias, users, turmaFilter) {
  const alunos = users.filter((u) => u.tipo === "aluno" && u.status !== "excluido");
  const withStats = alunos
    .filter((u) => !turmaFilter || turmaFilter === "todas" || u.turma === turmaFilter)
    .map((u) => ({ user: u, ...overallStats(notas, materias, u.id) }))
    .filter((r) => r.percent !== null);
  withStats.sort((a, b) => b.percent - a.percent);
  return withStats;
}

function medalFor(pos) {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return null;
}

function RankingView({ T, users, materias, notas, turmas, currentUser }) {
  const [turmaFilter, setTurmaFilter] = useState("todas");
  const ranking = useMemo(() => buildRanking(notas, materias, users, turmaFilter), [notas, materias, users, turmaFilter]);
  const isAdmin = currentUser.tipo === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="re-display text-2xl sm:text-3xl font-semibold mb-1">🏆 Ranking Global</h1>
          <p style={{ color: T.inkSoft }} className="text-sm">Ordenado pela média percentual das matérias cadastradas.</p>
        </div>
        <select value={turmaFilter} onChange={(e) => setTurmaFilter(e.target.value)}
          style={{ background: T.surface, borderColor: T.border }} className="px-3.5 py-2.5 rounded-lg border text-sm">
          <option value="todas">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>

      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[ranking[1], ranking[0], ranking[2]].map((r, i) => {
            const pos = i === 1 ? 1 : i === 0 ? 2 : 3;
            const heights = { 1: "py-8", 2: "py-5", 3: "py-4" };
            return (
              <div key={r.user.id} style={{ background: T.surface, borderColor: pos === 1 ? T.gold : T.border }}
                className={`rounded-xl border-2 text-center ${heights[pos]} px-2`}>
                <div className="text-2xl mb-1">{medalFor(pos)}</div>
                <p className="font-semibold text-sm truncate">{r.user.displayName}</p>
                <p style={{ color: T.inkSoft }} className="text-xs truncate">{turmas.find((t) => t.id === r.user.turma)?.nome}</p>
                <p className="re-num font-bold text-lg mt-1" style={{ color: T.primary }}>{fmt(r.percent, 2)}</p>
              </div>
            );
          })}
        </div>
      )}

      <Card T={T} className="!p-0 overflow-hidden">
        <div className="overflow-x-auto re-scroll">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr style={{ color: T.inkSoft }} className="text-left">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Nome</th>
                <th className="px-3 py-3 font-medium">Turma</th>
                <th className="px-5 py-3 font-medium text-right">Média geral</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => {
                const pos = i + 1;
                const isMe = !isAdmin && r.user.id === currentUser.id;
                return (
                  <tr key={r.user.id} className="border-t" style={{ borderColor: T.border, background: isMe ? T.primarySoft : "transparent" }}>
                    <td className="px-5 py-3 font-semibold">{medalFor(pos) || pos}</td>
                    <td className="px-3 py-3 font-medium">{r.user.displayName}{isMe && <span style={{ color: T.primary }} className="text-xs font-normal ml-1.5">(você)</span>}</td>
                    <td className="px-3 py-3" style={{ color: T.inkSoft }}>{turmas.find((t) => t.id === r.user.turma)?.nome || "—"}</td>
                    <td className="px-5 py-3 text-right re-num font-semibold">{fmt(r.percent, 2)}</td>
                  </tr>
                );
              })}
              {ranking.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center" style={{ color: T.inkSoft }}>Nenhum aluno com notas cadastradas ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   RANKING POR MATÉRIA
   ============================================================ */

function RankingMateriaView({ T, users, materias, notas }) {
  const active = materias.filter((m) => m.status === "ativa");
  const [materiaId, setMateriaId] = useState(active[0]?.id || "");
  const materia = materias.find((m) => m.id === materiaId);

  const ranking = useMemo(() => {
    const alunos = users.filter((u) => u.tipo === "aluno" && u.status !== "excluido");
    const list = alunos.map((u) => ({ user: u, stat: subjectStats(notas, u.id, materiaId) })).filter((r) => r.stat);
    list.sort((a, b) => b.stat.percent - a.stat.percent);
    return list;
  }, [users, notas, materiaId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="re-display text-2xl sm:text-3xl font-semibold mb-1">📚 Ranking por Matéria</h1>
        <p style={{ color: T.inkSoft }} className="text-sm mb-4">Veja quem está na frente em cada disciplina.</p>
        <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}
          style={{ background: T.surface, borderColor: T.border }} className="px-3.5 py-2.5 rounded-lg border text-sm w-full sm:w-auto">
          <optgroup label="FGB">{active.filter((m) => m.categoria === "FGB").map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</optgroup>
          <optgroup label="Itinerários">{active.filter((m) => m.categoria === "ITINERARIO").map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</optgroup>
        </select>
      </div>

      <Card T={T} className="!p-0 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: T.border }}>
          <Trophy size={16} color={T.gold} />
          <h3 className="font-semibold">{materia?.nome}</h3>
        </div>
        <div className="overflow-x-auto re-scroll">
          <table className="w-full text-sm min-w-[420px]">
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.user.id} className="border-t" style={{ borderColor: T.border }}>
                  <td className="px-5 py-3 font-semibold w-10">{medalFor(i + 1) || i + 1}</td>
                  <td className="px-3 py-3 font-medium">{r.user.displayName}</td>
                  <td className="px-5 py-3 text-right re-num font-semibold">
                    {r.stat.complete ? `${fmt(r.stat.totalOn100, 1)}/100` : `${fmt(r.stat.sum, 1)}/${r.stat.max}`}
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr><td className="px-5 py-8 text-center" style={{ color: T.inkSoft }}>Nenhum aluno com notas nesta matéria ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   RANKING POR ETAPA
   ============================================================ */

function RankingEtapaView({ T, users, materias, notas }) {
  const [etapa, setEtapa] = useState(1);
  const ranking = useMemo(() => {
    const alunos = users.filter((u) => u.tipo === "aluno" && u.status !== "excluido");
    const list = alunos.map((u) => ({ user: u, stat: etapaStats(notas, materias, u.id, etapa) })).filter((r) => r.stat);
    list.sort((a, b) => b.stat.percent - a.stat.percent);
    return list;
  }, [users, materias, notas, etapa]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="re-display text-2xl sm:text-3xl font-semibold mb-1">📈 Ranking por Etapa</h1>
        <p style={{ color: T.inkSoft }} className="text-sm mb-4">Compare o desempenho médio de cada etapa entre os alunos.</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((et) => (
            <button key={et} onClick={() => setEtapa(et)}
              style={{ background: etapa === et ? T.primary : T.surface, color: etapa === et ? "#fff" : T.ink, borderColor: T.border }}
              className="px-4 py-2 rounded-lg text-sm font-medium border">
              {et}ª Etapa
            </button>
          ))}
        </div>
      </div>

      <Card T={T} className="!p-0 overflow-hidden">
        <div className="overflow-x-auto re-scroll">
          <table className="w-full text-sm min-w-[420px]">
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.user.id} className="border-t" style={{ borderColor: T.border }}>
                  <td className="px-5 py-3 font-semibold w-10">{medalFor(i + 1) || i + 1}</td>
                  <td className="px-3 py-3 font-medium">{r.user.displayName}</td>
                  <td className="px-5 py-3 text-right re-num font-semibold">{fmt(r.stat.avgRaw, 1)}/{ETAPA_MAX[etapa]} <span style={{ color: T.inkSoft }} className="font-normal">({fmt(r.stat.percent, 1)}%)</span></td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr><td className="px-5 py-8 text-center" style={{ color: T.inkSoft }}>Nenhuma nota cadastrada para esta etapa ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   PAINEL ADMINISTRATIVO
   ============================================================ */

function AdminView(props) {
  const [tab, setTab] = useState("stats");
  const { T } = props;
  const tabs = [
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
    { id: "alunos", label: "Alunos", icon: Users },
    { id: "turmas", label: "Turmas", icon: School },
    { id: "materias", label: "Matérias", icon: BookOpen },
    { id: "notas", label: "Notas", icon: ClipboardList },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="re-display text-2xl sm:text-3xl font-semibold mb-1 flex items-center gap-2"><ShieldCheck size={26} color={T.primary} /> Painel Administrativo</h1>
        <p style={{ color: T.inkSoft }} className="text-sm">Gerencie alunos, turmas, matérias e notas da escola.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto re-scroll pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? T.primary : T.surface, color: tab === t.id ? "#fff" : T.ink, borderColor: T.border }}
            className="px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-1.5 shrink-0">
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "stats" && <AdminStats {...props} />}
      {tab === "alunos" && <AdminAlunos {...props} />}
      {tab === "turmas" && <AdminTurmas {...props} />}
      {tab === "materias" && <AdminMaterias {...props} />}
      {tab === "notas" && <AdminNotas {...props} />}
    </div>
  );
}

function AdminStats({ T, users, materias, notas, turmas }) {
  const alunos = users.filter((u) => u.tipo === "aluno");
  const rankings = buildRanking(notas, materias, users, null);
  const medias = rankings.map((r) => r.percent);
  const mediaGeral = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null;
  const maior = medias.length ? Math.max(...medias) : null;
  const menor = medias.length ? Math.min(...medias) : null;

  const porTurma = turmas.map((t) => {
    const r = buildRanking(notas, materias, users, t.id);
    const avg = r.length ? r.reduce((a, b) => a + b.percent, 0) / r.length : null;
    return { turma: t.nome, media: avg ? Number(avg.toFixed(1)) : 0 };
  });

  const porMateria = materias.filter((m) => m.status === "ativa").map((m) => {
    const vals = alunos.map((u) => subjectStats(notas, u.id, m.id)).filter(Boolean).map((s) => s.percent);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { materia: m.nome, media: Number(avg.toFixed(1)) };
  });

  const porEtapa = [1, 2, 3].map((et) => {
    const vals = alunos.map((u) => etapaStats(notas, materias, u.id, et)).filter(Boolean).map((s) => s.percent);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { etapa: `${et}ª Etapa`, media: Number(avg.toFixed(1)) };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard T={T} icon={Users} color={T.primary} label="Total de alunos" value={alunos.length} />
        <StatCard T={T} icon={School} color={T.green} label="Total de turmas" value={turmas.length} />
        <StatCard T={T} icon={TrendingUp} color={T.gold} label="Média geral da escola" value={mediaGeral !== null ? fmt(mediaGeral, 1) : "—"} />
        <StatCard T={T} icon={Award} color={T.coral} label="Maior / menor média" value={maior !== null ? `${fmt(maior,1)} / ${fmt(menor,1)}` : "—"} small />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card T={T}>
          <h3 className="font-semibold mb-4">Média por turma</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porTurma} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="turma" tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="media" fill={T.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card T={T}>
          <h3 className="font-semibold mb-4">Média por etapa</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porEtapa} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="etapa" tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="media" fill={T.gold} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card T={T}>
        <h3 className="font-semibold mb-4">Média por matéria</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMateria} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis type="category" dataKey="materia" width={140} tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.border }} tickLine={false} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="media" fill={T.green} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function AdminAlunos({ T, users, turmas, persistUsers, showToast }) {
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [resetPwFor, setResetPwFor] = useState(null);
  const alunos = users.filter((u) => u.tipo === "aluno");

  async function updateUser(id, patch) {
    await persistUsers(users.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function deleteUser(id) {
    await persistUsers(users.filter((u) => u.id !== id));
    setConfirmDelete(null);
    showToast("Aluno removido.");
  }

  async function resetPassword(id) {
    const newPw = Math.random().toString(36).slice(2, 8);
    await updateUser(id, { password: newPw });
    setResetPwFor(newPw);
  }

  return (
    <Card T={T} className="!p-0 overflow-hidden">
      <div className="overflow-x-auto re-scroll">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr style={{ color: T.inkSoft }} className="text-left border-b" >
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-3 py-3 font-medium">Turma</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: T.border }}>
                <td className="px-5 py-3 font-medium">{u.displayName} {u.isTest && <span style={{ color: T.inkSoft }} className="text-xs font-normal">(teste)</span>}</td>
                <td className="px-3 py-3">
                  {editing === u.id ? (
                    <select defaultValue={u.turma} onChange={(e) => updateUser(u.id, { turma: e.target.value })}
                      style={{ background: T.surfaceAlt, borderColor: T.border }} className="px-2 py-1 rounded-md border text-sm">
                      {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  ) : (turmas.find((t) => t.id === u.turma)?.nome || "—")}
                </td>
                <td className="px-3 py-3">
                  <span style={{ background: u.status === "ativo" ? T.greenSoft : T.coralSoft, color: u.status === "ativo" ? T.green : T.coral }}
                    className="px-2 py-0.5 rounded-full text-xs font-medium">{u.status === "ativo" ? "Ativo" : "Bloqueado"}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5 flex-wrap">
                    <IconBtn T={T} title={editing === u.id ? "Concluir" : "Editar turma"} onClick={() => setEditing(editing === u.id ? null : u.id)}><Pencil size={14} /></IconBtn>
                    <IconBtn T={T} title={u.status === "ativo" ? "Bloquear" : "Desbloquear"} onClick={() => updateUser(u.id, { status: u.status === "ativo" ? "bloqueado" : "ativo" })}>
                      {u.status === "ativo" ? <Lock size={14} /> : <Unlock size={14} />}
                    </IconBtn>
                    <IconBtn T={T} title="Resetar senha" onClick={() => resetPassword(u.id)}><KeyRound size={14} /></IconBtn>
                    <IconBtn T={T} title="Excluir" danger onClick={() => setConfirmDelete(u.id)}><Trash2 size={14} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <ConfirmModal T={T} title="Excluir aluno?" desc="Esta ação é permanente e removerá o acesso do aluno."
          onCancel={() => setConfirmDelete(null)} onConfirm={() => deleteUser(confirmDelete)} />
      )}
      {resetPwFor && (
        <ConfirmModal T={T} title="Senha redefinida" desc={`Nova senha temporária: ${resetPwFor}. Informe o aluno para que ele possa entrar e trocá-la.`}
          onCancel={() => setResetPwFor(null)} onConfirm={() => setResetPwFor(null)} confirmLabel="OK" hideCancel />
      )}
    </Card>
  );
}

function IconBtn({ T, children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: T.surfaceAlt, color: danger ? T.coral : T.ink, borderColor: T.border }}
      className="w-8 h-8 rounded-md border flex items-center justify-center">
      {children}
    </button>
  );
}

function ConfirmModal({ T, title, desc, onCancel, onConfirm, confirmLabel = "Excluir", hideCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/40">
      <div style={{ background: T.surface }} className="w-full max-w-sm rounded-xl p-5">
        <h3 className="font-semibold mb-1.5">{title}</h3>
        <p style={{ color: T.inkSoft }} className="text-sm mb-5">{desc}</p>
        <div className="flex justify-end gap-2">
          {!hideCancel && <button onClick={onCancel} style={{ borderColor: T.border }} className="px-4 py-2 rounded-lg border text-sm font-medium">Cancelar</button>}
          <button onClick={onConfirm} style={{ background: T.primary }} className="px-4 py-2 rounded-lg text-sm font-medium text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function AdminTurmas({ T, turmas, persistTurmas, showToast }) {
  const [novo, setNovo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function addTurma() {
    if (!novo.trim()) return;
    const id = "t-" + Date.now().toString(36);
    await persistTurmas([...turmas, { id, nome: novo.trim(), serie: "2º ano", status: "ativa" }]);
    setNovo("");
    showToast("Turma criada.");
  }
  async function toggleStatus(id) {
    await persistTurmas(turmas.map((t) => t.id === id ? { ...t, status: t.status === "ativa" ? "inativa" : "ativa" } : t));
  }
  async function remove(id) {
    await persistTurmas(turmas.filter((t) => t.id !== id));
    setConfirmDelete(null);
    showToast("Turma removida.");
  }

  return (
    <Card T={T}>
      <div className="flex gap-2 mb-5">
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome da nova turma (ex: 2º A)"
          style={{ background: T.surfaceAlt, borderColor: T.border }} className="flex-1 px-3.5 py-2.5 rounded-lg border outline-none text-sm" />
        <button onClick={addTurma} style={{ background: T.primary }} className="px-4 rounded-lg text-white flex items-center gap-1.5 text-sm font-medium"><Plus size={16} /> Criar</button>
      </div>
      <div className="space-y-2">
        {turmas.map((t) => (
          <div key={t.id} style={{ borderColor: T.border }} className="flex items-center justify-between border rounded-lg px-4 py-3">
            <div>
              <p className="font-medium text-sm">{t.nome}</p>
              <p style={{ color: T.inkSoft }} className="text-xs">{t.serie}</p>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ background: t.status === "ativa" ? T.greenSoft : T.coralSoft, color: t.status === "ativa" ? T.green : T.coral }} className="px-2 py-0.5 rounded-full text-xs font-medium">{t.status === "ativa" ? "Ativa" : "Inativa"}</span>
              <IconBtn T={T} title="Alternar status" onClick={() => toggleStatus(t.id)}>{t.status === "ativa" ? <Lock size={14} /> : <Unlock size={14} />}</IconBtn>
              <IconBtn T={T} title="Excluir" danger onClick={() => setConfirmDelete(t.id)}><Trash2 size={14} /></IconBtn>
            </div>
          </div>
        ))}
      </div>
      {confirmDelete && (
        <ConfirmModal T={T} title="Excluir turma?" desc="Alunos vinculados a esta turma manterão a referência antiga."
          onCancel={() => setConfirmDelete(null)} onConfirm={() => remove(confirmDelete)} />
      )}
    </Card>
  );
}

function AdminMaterias({ T, materias, persistMaterias, showToast }) {
  const [novo, setNovo] = useState("");
  const [categoria, setCategoria] = useState("FGB");
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function addMateria() {
    if (!novo.trim()) return;
    const id = (categoria === "FGB" ? "fgb-" : "it-") + Date.now().toString(36);
    await persistMaterias([...materias, { id, nome: novo.trim(), categoria, status: "ativa" }]);
    setNovo("");
    showToast("Matéria criada.");
  }
  async function toggleStatus(id) {
    await persistMaterias(materias.map((m) => m.id === id ? { ...m, status: m.status === "ativa" ? "inativa" : "ativa" } : m));
  }
  async function remove(id) {
    await persistMaterias(materias.filter((m) => m.id !== id));
    setConfirmDelete(null);
    showToast("Matéria removida.");
  }

  return (
    <Card T={T}>
      <div className="flex gap-2 mb-5 flex-wrap">
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome da nova matéria"
          style={{ background: T.surfaceAlt, borderColor: T.border }} className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-lg border outline-none text-sm" />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
          style={{ background: T.surfaceAlt, borderColor: T.border }} className="px-3.5 py-2.5 rounded-lg border text-sm">
          <option value="FGB">FGB</option>
          <option value="ITINERARIO">Itinerários</option>
        </select>
        <button onClick={addMateria} style={{ background: T.primary }} className="px-4 rounded-lg text-white flex items-center gap-1.5 text-sm font-medium"><Plus size={16} /> Criar</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {["FGB", "ITINERARIO"].map((cat) => (
          <div key={cat}>
            <p style={{ color: T.inkSoft }} className="text-xs font-medium mb-2">{CATEGORIAS[cat]}</p>
            <div className="space-y-2">
              {materias.filter((m) => m.categoria === cat).map((m) => (
                <div key={m.id} style={{ borderColor: T.border }} className="flex items-center justify-between border rounded-lg px-3.5 py-2.5">
                  <span className="text-sm font-medium">{m.nome}</span>
                  <div className="flex items-center gap-1.5">
                    <span style={{ background: m.status === "ativa" ? T.greenSoft : T.coralSoft, color: m.status === "ativa" ? T.green : T.coral }} className="px-2 py-0.5 rounded-full text-xs font-medium">{m.status === "ativa" ? "Ativa" : "Inativa"}</span>
                    <IconBtn T={T} title="Alternar status" onClick={() => toggleStatus(m.id)}>{m.status === "ativa" ? <Lock size={13} /> : <Unlock size={13} />}</IconBtn>
                    <IconBtn T={T} title="Excluir" danger onClick={() => setConfirmDelete(m.id)}><Trash2 size={13} /></IconBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {confirmDelete && (
        <ConfirmModal T={T} title="Excluir matéria?" desc="As notas já cadastradas nessa matéria deixarão de aparecer nos rankings."
          onCancel={() => setConfirmDelete(null)} onConfirm={() => remove(confirmDelete)} />
      )}
    </Card>
  );
}

function AdminNotas({ T, users, materias, notas, turmas, persistNotas, showToast }) {
  const alunos = users.filter((u) => u.tipo === "aluno");
  const [alunoId, setAlunoId] = useState(alunos[0]?.id || "");
  const [materiaId, setMateriaId] = useState(materias[0]?.id || "");
  const [form, setForm] = useState({ e1: "", e2: "", e3: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const g = notas[`${alunoId}__${materiaId}`];
    setForm({ e1: g?.e1 ?? "", e2: g?.e2 ?? "", e3: g?.e3 ?? "" });
    setError("");
  }, [alunoId, materiaId, notas]);

  function validate(field, val) {
    const et = Number(field.replace("e", ""));
    const max = ETAPA_MAX[et];
    const num = val === "" ? null : Number(String(val).replace(",", "."));
    if (val !== "" && (Number.isNaN(num) || num < 0 || num > max)) return `Valor entre 0 e ${max}`;
    return null;
  }

  async function save() {
    for (const f of ["e1", "e2", "e3"]) {
      const err = validate(f, form[f]);
      if (err) { setError(`Etapa ${f.slice(1)}: ${err}`); return; }
    }
    const key = `${alunoId}__${materiaId}`;
    const next = { ...notas, [key]: {
      e1: form.e1 === "" ? null : Number(String(form.e1).replace(",", ".")),
      e2: form.e2 === "" ? null : Number(String(form.e2).replace(",", ".")),
      e3: form.e3 === "" ? null : Number(String(form.e3).replace(",", ".")),
      updatedAt: Date.now(),
    }};
    await persistNotas(next);
    showToast("Nota atualizada.");
  }

  async function clear() {
    const key = `${alunoId}__${materiaId}`;
    const next = { ...notas };
    delete next[key];
    await persistNotas(next);
    setForm({ e1: "", e2: "", e3: "" });
    showToast("Notas removidas para esta matéria.");
  }

  return (
    <Card T={T}>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <Field label="Aluno" T={T}>
          <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}
            style={{ background: T.surfaceAlt, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border text-sm">
            {alunos.map((u) => <option key={u.id} value={u.id}>{u.displayName} — {turmas.find((t) => t.id === u.turma)?.nome || "sem turma"}</option>)}
          </select>
        </Field>
        <Field label="Matéria" T={T}>
          <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}
            style={{ background: T.surfaceAlt, borderColor: T.border }} className="w-full px-3.5 py-2.5 rounded-lg border text-sm">
            <optgroup label="FGB">{materias.filter((m) => m.categoria === "FGB").map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</optgroup>
            <optgroup label="Itinerários">{materias.filter((m) => m.categoria === "ITINERARIO").map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</optgroup>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((et) => (
          <Field key={et} label={`${et}ª Etapa /${ETAPA_MAX[et]}`} T={T}>
            <input value={form[`e${et}`]} onChange={(e) => setForm({ ...form, [`e${et}`]: e.target.value })}
              inputMode="decimal" placeholder="—"
              style={{ background: T.surfaceAlt, borderColor: T.border }} className="re-num w-full px-3 py-2.5 rounded-lg border outline-none text-center" />
          </Field>
        ))}
      </div>
      {error && <p style={{ color: T.coral }} className="text-sm mb-3 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} style={{ background: T.primary }} className="px-5 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2"><Save size={15} /> Salvar</button>
        <button onClick={clear} style={{ borderColor: T.border, color: T.coral }} className="px-5 py-2.5 rounded-lg border text-sm font-medium">Limpar notas</button>
      </div>
    </Card>
  );
}
