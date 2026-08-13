# CRONOS — O tempo, esculpido

Relojoaria mecânica contemporânea. Site one-brand com direção de arte editorial;
o e-commerce é secundário, cada peça é tratada como página de galeria.

Stack: **Next.js 15 (App Router) · Tailwind v4 · GSAP · React Three Fiber**

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

## Estrutura

```
src/
  app/
    page.tsx              Abertura (vídeo) → Novas peças (vídeo) → Anatomia → Manifesto → Coleções
    colecoes/             Grid editorial, Monólito e Eclipse separados por respiro
    pecas/[ref]/          Página de peça + a vista explodida  (SSG: cr-01…cr-04)
    manifesto/            Storytelling, sem imagens de apoio
    reserva/              Fluxo discreto — "Reservar peça", nunca "Comprar agora"
  components/
    loop-video.tsx        Vídeo em loop, sem áudio, pausa fora da tela  ← os dois usam
    hero-video.tsx        Abertura em tela cheia; esconde a nav enquanto ocupa o topo
    live-clock.tsx        SVG em tempo real  (SEM USO — substituído pelo vídeo do calibre)
    anatomy/
      anatomy.tsx         Seção: ScrollTrigger → progresso → explode + legendas
      scene.tsx           Cena R3F: camadas, câmera e projeção das legendas
      parts.tsx           As sete peças  ← a fronteira trocável (ver abaixo)
      materials.ts        Materiais frios + geometrias de anel/rotor
  data/
    pieces.ts             CR-01…CR-04
    anatomy.ts            As sete camadas, com posição em repouso e no explode

assets/                   Origem. Não é servida — alimenta os scripts.
  fontes/                 Os renders que viram textura  (scripts/textures.mjs lê daqui)
  video/                  As filmagens brutas       (public/video/ é o derivado)
  referencias/            Screenshots de bug e comparações

public/
  textures/               Derivado de assets/fontes  → node scripts/textures.mjs
  video/                  Derivado de assets/video   → ver "Vídeo", abaixo
```

## Vídeo

Dois planos, os dois em loop, mudos e pausados fora da tela (`loop-video.tsx`).
O áudio é removido **do arquivo**, não silenciado no player.

O WebM é o original copiado sem recodificar — zero perda de geração. O MP4 é só
para quem não toca VP9:

```bash
ffmpeg -i assets/video/<origem>.webm -c:v copy -an -map 0:v:0 public/video/<nome>.webm
ffmpeg -i assets/video/<origem>.webm -c:v libx264 -profile:v high -crf 18 \
       -preset slow -pix_fmt yuv420p -movflags +faststart -an public/video/<nome>.mp4
ffmpeg -ss 0 -i public/video/<nome>.webm -frames:v 1 public/video/<nome>-poster.webp
```

O `LoopVideo` recebe o caminho **sem extensão** (`/video/hero`) e monta os três
nomes sozinho. Trocar uma filmagem é trocar os três arquivos — o componente não
muda.

Duas armadilhas que já custaram tempo:

- **Tarja preta embutida.** O plano de "Novas peças" vinha 2,5:1 dentro de um
  quadro 1,9:1, e `object-cover` não desfaz letterbox assado no pixel — as
  faixas apareciam como duas barras contra o Graphite. `ffmpeg -vf cropdetect`
  acha o corte (foi `crop=1920:764:0:124`); recortar obriga a recodificar, então
  esse é o único vídeo que não é cópia bit a bit do original.
- **Cartão de logo no fim.** O mesmo plano fecha com a marca do autor aos ~56s,
  o que num loop reapareceria a cada volta. Cortado em `-t 55`.

## A Vista Anatomia

O scroll não rola a página — aciona o mecanismo.

No repouso você vê o **relógio montado** (`assembled.tsx`): a fotografia da peça
inteira, esqueleto à vista. Ela não é uma imagem *sobre* a cena — é uma peça
*dentro* dela, o plano no topo da pilha. Sem ela, o relógio montado visto de
topo seria só um disco cinza: o mostrador é opaco, e não haveria maquinário
nenhum para ver. Nos primeiros 16% do scroll ela se dissolve subindo, e as sete
camadas que estavam por baixo começam a se afastar.

A escala não é chutada: o script mede o raio da caixa na foto (o maior círculo
inscrito na silhueta) e escreve `src/data/montado.json`, de modo que esse raio
valha exatamente o raio do bisel na cena.

A seção fica presa em `sticky` e o progresso (0 → 1) dirige três coisas ao mesmo
tempo:

1. **as camadas** se afastam no eixo do relógio, escalonadas (o bisel sai
   primeiro, o fundo por último — a ordem em que um relojoeiro desmontaria);
2. **a câmera** desce do topo (relógio de face, montado) para três-quartos.
   Sem esse giro o explode aconteceria na direção da câmera e não se veria nada;
3. **as legendas** entram, cada uma puxada por um fio Brushed de 1px que sai da
   posição real da peça — projetada da cena 3D para coordenadas de tela a cada
   frame.

Respeita `prefers-reduced-motion`: a câmera trava e as peças não giram.

### As peças

Quatro das sete camadas são **fotografias reais projetadas nas malhas**:
mostrador, movimento, rotor e fundo. Elas continuam sendo objetos 3D — têm
espessura, a câmera orbita em volta, o explode as separa — só que vestidas com
a foto em vez do metal procedural. Bisel e cristal foram fotografados em
três-quartos e não servem como textura plana, então seguem procedurais (são as
duas peças mais simples: um anel e um disco de vidro).

O preparo das texturas é automático:

```bash
node scripts/textures.mjs     # PNGs da raiz → public/textures/
```

O script acha a caixa de cada objeto (trim contra o fundo Bone, amostrado da
própria imagem — elas não usam exatamente o mesmo Bone) e enquadra conforme o
UV da malha que vai receber a textura:

- **discos** — quadrado centrado. A tampa do cilindro no three.js mapeia um
  círculo inscrito no quadrado, então a foto cai no lugar sem UV manual e os
  cantos nunca são amostrados.
- **rotor** — retângulo 2:1 ancorado no fundo do arco. A altura de uma meia-lua
  é o raio, logo metade da largura; isso bate exatamente com a caixa da
  geometria, e `planarUV()` reprojeta a malha nessa mesma caixa.

### Trocar uma peça por um GLB

Hoje cada camada é montada em código, com primitivas do three.js — sem asset
externo, e com cada peça isolada num grupo próprio. Para usar um modelo
fotorrealista, coloque o `.glb` em `public/models/` e aponte em
`src/components/anatomy/parts.tsx`:

```ts
const GLB_PARTS: Partial<Record<LayerId, string>> = {
  movimento: "/models/movimento.glb",
};
```

O `GlbPart` centraliza e escala o modelo para o diâmetro da caixa, então a peça
cai no lugar certo da pilha mesmo vindo com escala arbitrária. **O explode, a
câmera, as legendas e o scroll não mudam** — eles operam sobre o grupo da
camada, não sobre a malha. Dá para migrar uma peça de cada vez.

> Um GLB do relógio **inteiro** não serve: vem como malha única e não separa em
> camadas. É preciso um arquivo por componente.

As seis imagens já estão no workspace Higgsfield, confirmadas e prontas para
converter. O `image_to_3d` custa **20 créditos por peça sem textura, 30 com** —
ou seja, 120 a 180 pela pilha inteira. Foi por isso que a rota do GLB ficou
para depois.

## Deploy — Cloudflare Pages

O site não tem nada de servidor: nenhum server action, nenhuma API route,
nenhum middleware, nenhum ISR. O formulário de reserva confirma na tela e
para por aí. Por isso o `next.config.ts` sai em `output: "export"` e o
artefato é um `out/` de arquivos soltos — 88 arquivos, 45 MB.

| campo (painel do Pages)  | valor           |
| ------------------------ | --------------- |
| Build command            | `npm run build` |
| Build output directory   | `out`           |

O diretório de saída também está no `wrangler.jsonc`
(`pages_build_output_dir`), e o que está lá **vence o painel**. O comando de
build, não: esse o Pages só lê da interface.

E ele precisa ser preenchido à mão. Deixando o campo vazio, o Cloudflare
detecta "Next.js" e assume `npx @cloudflare/next-on-pages` — o adaptador de
SSR em Workers. Fora de ser a ferramenta errada para um site estático, ela
falha na própria instalação: os peer deps dela pedem `@cloudflare/workers-types`
v4 e o wrangler atual traz a v5, e o `npm` aborta com `ERESOLVE`. O build
morre antes de chegar ao Next.

Publicar do terminal, sem passar pelo build do Pages:

```bash
npm run build
npx wrangler pages deploy out --project-name=cronos-6gb
```

## Guarda-corpo

- Nenhum tom quente ou dourado — quebra o posicionamento inteiro. O Brushed
  (`#B8BCC0`) é o único acento, e só em fios de 1px e micro-detalhes.
- Serifada (Playfair) só em headline; grotesk (Inter) só em corpo; mono
  (JetBrains) só em dados. Cada fonte tem seu papel.
- Sem "Comprar agora", contador de estoque ou selo de desconto.

## Pendências

> **Projeto de estudo — não vai ao ar.** As marcas de terceiros nos assets
> (DRYDEN no vídeo da abertura, Rolex no do calibre, "IWC CALIBER" gravado na
> textura do fundo) deixam de ser bloqueio por causa disso. Ficam registradas
> porque, se algum dia isto for publicado, cada uma volta a ser impeditiva.

- **O mostrador é uma chapa maciça, num relógio esqueletizado.** A textura dele
  é um disco cinza fechado — mas a peça inteira é vazada, e a foto do montado
  mostra o calibre à vista. As duas coisas não podem ser verdade. O conserto é o
  mesmo mecanismo da janela do fundo: acrescentar `mostrador` ao `WINDOW` em
  `scripts/textures.mjs` e ligar o `seeThrough` no `PhotoDisc` — a chapa vira
  anel de horas e o movimento aparece por baixo. Duas linhas; falta escolher o
  raio do vazado.
- **A textura do fundo traz "IWC CALIBER" gravada** (e o resto do texto do anel
  é alucinado/borrado). Regerar com `no text, clean engraved rings only`, ou
  com a gravação em CRONOS.
- **O still do relógio montado nasceu com a alça esquerda cortada** — colada na
  borda do quadro. O feather do recorte limpou o esfarelado, mas pixel cortado
  não se inventa. Regerar com `complete watch not cropped, margin around
  object, clean sharp edges, solid flat background`.
- **As peças têm perspectivas levemente diferentes** (bisel e fundo em ¾,
  movimento e rotor frontais) — preço de gerar peça por peça. Minimizar
  regerando as destoantes com `top-down 3/4 view, 30 degree angle, consistent
  isometric perspective`; resolver de vez é a rota GLB.
- **Reserva sem backend.** O submit confirma na tela; falta ligar a um endpoint
  ou ao e-mail do atelier.
- **Fotografia de produto.** As páginas de coleção e de peça ainda não têm
  imagem — só tipografia e a cena 3D.
