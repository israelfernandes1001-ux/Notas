# 📚 Minha Aula · Escola SESI

Horário, lembretes pessoais, avisos por sala (2º A, B, C e D), moderadores, painel do dono e Quiz em sala com IA.

## Arquivos
- `index.html` → vai para o GitHub (raiz do repositório)
- `README.md` → vai para o GitHub
- `supabase.sql` → só para colar no Supabase (não precisa ir para o GitHub)
- `gerar-quiz.ts` → opcional, para a IA automática do Quiz (colar no Supabase)

## Passo a passo
1. Crie um projeto grátis em supabase.com
2. Abra o `supabase.sql`, troque `COLOQUE-SUA-SENHA-AQUI` pela sua senha de dono (mantenha as aspas simples), cole em **SQL Editor → Run**
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**
4. No `index.html`, na linha `const SB={url:'',key:''}`, cole os dois valores entre as aspas
5. Envie `index.html` e `README.md` para a **raiz** do repositório no GitHub
6. **Settings → Pages**: Source = *Deploy from a branch*, Branch = `main`, pasta `/ (root)`, Save

## Dono
No app: **Perfil → Sou o dono**, digite a senha. A aba **Painel** aparece.

## Quiz
Aba **Quiz** → *Criar sala* → passe o código aos amigos → escreva a matéria → *Gerar perguntas*.
- Com `gerar-quiz.ts` publicado: a IA cria as perguntas sozinha.
- Sem ele: o app mostra o **modo manual**. Copie o pedido, cole em qualquer IA (Claude, ChatGPT…), copie a resposta e cole de volta.
