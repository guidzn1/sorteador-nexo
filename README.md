# Nexo — Sorteios

Site de sorteios para o grupo de atletas Nexo. Ele permite criar sorteios com links próprios, receber inscrições públicas, impedir duplicidade pelo WhatsApp e sortear vencedores em uma área administrativa protegida.

Feito com **React + Vite + Tailwind CSS + Firebase Authentication + Firestore**.

## 1. Configurar o Firebase

1. Acesse o Firebase Console e crie um projeto.
2. Vá em **Authentication → Sign-in method** e ative **E-mail/senha**.
3. Vá em **Authentication → Users** e crie o usuário que vai acessar o painel admin.
4. Copie o **UID** desse usuário. Ele aparece na tabela de usuários do Authentication.
5. Vá em **Firestore Database** e crie o banco em modo produção.
6. No Firestore, crie manualmente uma coleção chamada:

```txt
admins
```

7. Dentro da coleção `admins`, crie um documento com o **ID igual ao UID** do usuário admin.
8. Dentro desse documento, pode colocar campos simples, por exemplo:

```txt
email: seuemail@email.com
name: Nexo
```

Essa etapa é importante porque as regras de segurança só liberam o painel para usuários que existirem na coleção `admins`.

## 2. Publicar as regras do Firestore

No Firebase Console, vá em:

```txt
Firestore Database → Regras
```

Cole o conteúdo do arquivo:

```txt
firebase/firestore.rules
```

Depois clique em **Publicar**.

Essas regras fazem três coisas importantes:

- visitante só consegue ver sorteios ativos;
- visitante só consegue se cadastrar em sorteio ativo;
- a área administrativa só funciona para usuários cadastrados na coleção `admins`.

## 3. Configurar o projeto local

Na raiz do projeto:

```bash
npm install
cp .env.example .env
```

Edite o `.env` com as credenciais do app Web do Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 4. Colocar a logo da Nexo

Coloque a logo dentro da pasta:

```txt
public
```

com o nome exato:

```txt
logo-nexo.png
```

O componente `src/components/Logo.jsx` já está configurado para buscar essa imagem em `/logo-nexo.png`.

## 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse:

```txt
http://localhost:5173
```

Painel admin:

```txt
http://localhost:5173/admin/login
```

## 6. Como funciona

### Página inicial `/`

Lista os sorteios ativos.

### Página pública do sorteio `/s/seu-link`

Mostra o formulário com:

- nome completo;
- WhatsApp;
- Instagram;
- modalidade esportiva.

O WhatsApp é normalizado antes de salvar. Assim, estes dois formatos viram o mesmo cadastro:

```txt
+55 (94) 99999-9999
(94) 99999-9999
```

Os dois viram:

```txt
94999999999
```

Como o documento do participante usa o WhatsApp como ID, o Firebase bloqueia a tentativa de cadastrar o mesmo número duas vezes no mesmo sorteio.

### Área administrativa `/admin`

Permite:

- criar sorteios;
- encerrar/reabrir sorteios;
- copiar link do sorteio;
- visualizar participantes;
- buscar por nome ou WhatsApp;
- remover participantes;
- sortear vencedor;
- visualizar histórico de vencedores.

## 7. Estrutura dos dados no Firestore

```txt
events/{slug}
  name, slug, description, active, createdAt

  participants/{whatsapp}
    fullName, whatsapp, instagram, sport, createdAt

  winners/{winnerId}
    participantId, fullName, whatsapp, instagram, sport, drawnAt

admins/{uid}
  email, name
```

## 8. Build para publicar

```bash
npm run build
```

Isso gera a pasta `dist/`, pronta para publicar no Firebase Hosting, Vercel, Netlify, Cloudflare Pages ou outra hospedagem de site estático.
