/**
 * Prepara as fotografias dos componentes como texturas da Vista Anatomia.
 *
 *   node scripts/textures.mjs
 *
 * Cada peça foi fotografada de frente, centrada, sobre o mesmo fundo Bone.
 * Isso permite projetá-las direto nas faces das malhas — sem GLB, sem recorte
 * manual. O script faz três coisas:
 *
 *   1. corta a faixa inferior, onde mora a marca d'água do gerador;
 *   2. acha a caixa do objeto (trim contra o fundo Bone);
 *   3. enquadra conforme o mapeamento UV da malha que vai receber a textura.
 *
 * Para os discos (mostrador, movimento, fundo) o enquadramento é um quadrado
 * centrado: a tampa do cilindro no three.js mapeia um círculo inscrito no
 * quadrado da textura, então os cantos simplesmente nunca são amostrados.
 *
 * O rotor é meia-lua, e a UV dele é planar sobre a caixa da geometria. O
 * recorte precisa começar exatamente na linha do diâmetro — que o script
 * encontra procurando a primeira linha, de cima para baixo, em que o objeto
 * ocupa quase toda a largura (o topo reto do aro). Sem isso, o pivô central,
 * que se projeta acima do diâmetro, desalinharia a textura inteira.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
/* As fotografias de origem moram fora do bundle: elas alimentam este script e
   nunca são servidas. O que o site baixa é o derivado, em public/textures/. */
const SRC = path.join(ROOT, "assets", "fontes");
const OUT = path.join(ROOT, "public", "textures");

const BONE = { r: 242, g: 240, b: 235 };
/* Distância de cor até o fundo abaixo da qual o pixel é fundo. O metal chega
   perto do branco nos brilhos, então a margem é estreita de propósito. */
const BG_TOLERANCE = 18;
/* A marca d'água ocupa o canto inferior direito; nenhuma peça chega lá. */
const WATERMARK_BAND = 0.12;

/**
 * O fundo de cada imagem é Bone, mas não exatamente o mesmo Bone — os
 * geradores derivam alguns pontos. Fixar a cor no código fazia uma delas ser
 * lida inteira como objeto. Lemos o canto superior esquerdo, que é sempre
 * fundo limpo.
 */
function sampleBackground(data, channels) {
  return { r: data[0], g: data[1], b: data[2], channels };
}

const SOURCES = {
  mostrador: "a789fec7-bb10-4589-b9cc-f88155f5228a.png",
  movimento: "1b4e9ca2-5c13-4bc4-bf35-7c0e20120ed1.png",
  fundo: "eb0a4f2d-c695-4d2b-b72e-59486580ff70.png",
  rotor: "ChatGPT Image 13 de jul. de 2026, 21_56_53.png",
};

/**
 * O relógio montado. É a camada de cima da pilha: a peça inteira, que se
 * dissolve para revelar as sete que a compõem.
 *
 * Diferente das outras, esta vem sobre fundo escuro e tem alças e coroa — não
 * é um disco. Precisa de recorte com alpha de verdade, e precisa entrar na cena
 * na mesma escala das outras peças, o que exige saber o raio da caixa em
 * pixels. As duas coisas o script resolve sozinho, abaixo.
 */
const ASSEMBLED = "cc460bae-bddc-4a38-9943-d8706afefe21.png";

/**
 * Os relógios do catálogo. Duas vistas por peça: a frontal, que o card mostra
 * em repouso, e a de lado, que ele abre quando a mão chega.
 *
 * Ao contrário das peças da anatomia, estas NÃO são recortadas. A fotografia
 * já nasce com o fundo escuro que o card queria — vinheta, pulseira sangrando
 * nas bordas, a luz montada em volta do objeto. Recortar contra Graphite chapado
 * jogaria fora exatamente isso e devolveria uma silhueta boiando. Aqui a foto É
 * o painel: entra inteira, sangrada, e o card só a enquadra.
 *
 * Por isso o caminho é outro — sem `cutoutOnDark`, sem alpha, sem faixa de marca
 * d'água (estas não vêm do Higgsfield). Só escala e WebP.
 *
 * Vistas ausentes ficam de fora do mapa; o card cai no gesto de aproximação
 * quando não existe uma segunda vista para abrir. Ver `cronos-prompts.md`.
 */
/* Os arquivos chegam numerados pela ordem em que foram gerados, e essa ordem não
   é a do catálogo: cada um foi mapeado para a peça cuja FICHA ele ilustra, não
   para a de número igual. O relógio 2 é cerâmica preta com tourbillon — é o
   Obsidiana, CR-03. O 3 é metal branco polido com ponte espelhada — é o Salitre,
   CR-04. Casar por número faria o card do Névoa ("titânio jateado, peso pluma")
   mostrar uma peça preta. */
const WATCHES = {
  "cr-01": { front: "relogio 1.png", side: "relogio 1 de lado.png" },
  "cr-02": { front: "ultimo relogio.png", side: "ultimo relogio lado.png" },
  "cr-03": { front: "relogio 2.png", side: "relogio 2 de lado.png" },
  "cr-04": { front: "relogio 3.png", side: "relogio 3 de lado.png" },
};

/**
 * A imagem de fecho — a única cena de uso do site. Não é peça de catálogo: é o
 * ponto final, entre o catálogo e o rodapé, sem uma palavra por cima.
 *
 * Diferente das do catálogo, esta VEM do Higgsfield e traz a marca d'água no
 * canto inferior. A faixa é cortada antes de qualquer coisa, como nas peças da
 * anatomia. Sobra uma panorâmica de ~2:1, que é a proporção de uma faixa que
 * atravessa a tela — e é exatamente o que ela vai ser.
 */
const CLOSING = "9f8609bb-09c1-40a5-8fa8-603f291db870.png";

/* As fotos do catálogo chegam na raiz, e não em assets/fontes: é onde o
   pipeline sempre pediu que fossem largadas. */
const WATCH_SRC = ROOT;
/* Largura de entrega. O card ocupa ~700px num monitor grande; 1400 cobre o
   retina sem carregar um PNG de 2 MB por peça. */
const WATCH_WIDTH = 1400;

/**
 * Recorta o fundo por crescimento de região a partir das bordas.
 *
 * Não dá para simplesmente chavear por cor: o fundo é um degradê escuro, e o
 * mostrador do relógio é quase tão escuro quanto ele. O que separa os dois não
 * é o tom — é a conectividade. O fundo toca a borda da imagem; o mostrador não.
 *
 * Então crescemos a região a partir das bordas, aceitando um pixel quando ele
 * está perto do *vizinho já aceito* (e não de uma cor fixa). Isso acompanha o
 * degradê e a sombra sob a peça, e trava na aresta clara da caixa de aço.
 */
function cutout(data, width, height, channels, tolerance = 10) {
  const bg = new Uint8Array(width * height);
  const stack = [];

  const push = (x, y) => {
    const p = y * width + x;
    if (!bg[p]) {
      bg[p] = 1;
      stack.push(p);
    }
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p / width) | 0;
    const i = p * channels;

    const neighbours = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbours) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const q = ny * width + nx;
      if (bg[q]) continue;

      const j = q * channels;
      const d = Math.hypot(
        data[j] - data[i],
        data[j + 1] - data[i + 1],
        data[j + 2] - data[i + 2],
      );
      if (d > tolerance) continue;

      bg[q] = 1;
      stack.push(q);
    }
  }

  return bg;
}

/**
 * O raio da caixa, em pixels — o maior círculo que cabe dentro da silhueta.
 *
 * A silhueta é caixa + alças + coroa, mas a caixa é a única parte redonda e
 * cheia: o maior círculo inscrito nela *é* a caixa. Uma transformada de
 * distância (dois passes de chanfro) devolve, em cada pixel, a distância até o
 * fundo mais próximo; o máximo dessa distância é o centro da caixa, e o valor
 * ali é o raio.
 *
 * É isso que permite plantar a foto na cena na mesma escala das outras peças,
 * sem número mágico nenhum.
 */
function caseCircle(bg, width, height) {
  const INF = 1e9;
  const dist = new Float64Array(width * height);

  for (let i = 0; i < dist.length; i++) dist[i] = bg[i] ? 0 : INF;

  const d1 = 1;
  const d2 = Math.SQRT2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      let v = dist[p];
      if (x > 0) v = Math.min(v, dist[p - 1] + d1);
      if (y > 0) v = Math.min(v, dist[p - width] + d1);
      if (x > 0 && y > 0) v = Math.min(v, dist[p - width - 1] + d2);
      if (x < width - 1 && y > 0) v = Math.min(v, dist[p - width + 1] + d2);
      dist[p] = v;
    }
  }

  let best = -1;
  let cx = 0;
  let cy = 0;

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const p = y * width + x;
      let v = dist[p];
      if (x < width - 1) v = Math.min(v, dist[p + 1] + d1);
      if (y < height - 1) v = Math.min(v, dist[p + width] + d1);
      if (x < width - 1 && y < height - 1) v = Math.min(v, dist[p + width + 1] + d2);
      if (x > 0 && y < height - 1) v = Math.min(v, dist[p + width - 1] + d2);
      dist[p] = v;

      if (v > best) {
        best = v;
        cx = x;
        cy = y;
      }
    }
  }

  return { cx, cy, radius: best };
}

/**
 * Máscara circular exata para as peças-disco, com borda de ~2px de rampa.
 * O leve encolhimento (0.5%) esconde a franja de anti-serrilhado da fotografia
 * na borda do objeto.
 *
 * `innerRatio` abre um furo central — o anel do fundo usa isso para a janela
 * de safira: o vidro é outra camada da cena, e pela janela vazada se vê o
 * maquinário de verdade, não a foto dele.
 */
function circleMask(side, innerRatio = 0) {
  const mask = Buffer.alloc(side * side);
  const center = side / 2;
  const r1 = center * 0.995;
  const r0 = r1 - 2;
  const h1 = center * innerRatio;
  const h0 = Math.max(0, h1 - 2);

  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const d = Math.hypot(x - center + 0.5, y - center + 0.5);
      let t = d <= r0 ? 1 : d >= r1 ? 0 : (r1 - d) / (r1 - r0);
      if (innerRatio > 0 && d < h1) {
        t = d <= h0 ? 0 : Math.min(t, (d - h0) / (h1 - h0));
      }
      mask[y * side + x] = Math.round(t * 255);
    }
  }

  return mask;
}

/**
 * O raio da janela de safira do fundo, como fração do raio do disco.
 *
 * Medido sobre a foto (recorte centrado no círculo): a borda da janela fica
 * entre 0.60R e 0.63R — a foto não é perfeitamente concêntrica, foi feita em
 * leve ângulo. 0.62 remove o vidro fotografado por inteiro e para antes do
 * anel de texto gravado, que começa em ~0.64R. Ao regenerar o asset (o prompt
 * já pede "perfectly concentric"), re-medir e ajustar aqui — e manter o
 * R_VIDRO de `parts.tsx` em 2.0 × este valor.
 */
const WINDOW = { fundo: 0.62 };

/**
 * Recorte do rotor por TEMPERATURA de cor + distância ao fundo, pixel a pixel.
 *
 * Nada de inundação: com os vãos fechados pelo fio do aro, o crescimento de
 * região não chega neles. A decisão é local, por dois critérios em conjunto:
 *
 * - o canal quente separa Bone de aço quase sempre (o Bone tem r−b ≥ +7 em
 *   toda parte, inclusive na sombra dos vãos; o aço fica em torno de 0)…
 * - …mas os reflexos quentes do metal escovado cruzam o limiar e roíam o aro
 *   de furinhos. A distância de cor ao fundo resolve esses: a distribuição é
 *   bimodal (fundo em 0–7, aço de 40 para cima, vale vazio no meio), então o
 *   metal quente-mas-cinza fica longe do Bone e volta a ser objeto.
 *
 * Fundo é só quem passa nos DOIS testes.
 */
function warmthCutout(data, width, height, channels, bgColor, minWarmth = 5, maxDist = 40) {
  const bg = new Uint8Array(width * height);

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (data[i] - data[i + 2] < minWarmth) continue;
    const d = Math.hypot(
      data[i] - bgColor.r,
      data[i + 1] - bgColor.g,
      data[i + 2] - bgColor.b,
    );
    if (d < maxDist) bg[p] = 1;
  }

  return bg;
}

/**
 * Suaviza a borda da máscara de recorte.
 *
 * O crescimento de região devolve alpha binário — dentro ou fora — e uma borda
 * de 1 bit é exatamente o "esfarelado" que se vê na silhueta contra um fundo
 * de cor diferente. Dois passes de média 3×3 dão à borda uma rampa de ~2px:
 * o suficiente para o recorte assentar, pouco demais para virar halo borrado.
 */
function feather(mask, width, height, passes = 2) {
  let src = Float32Array.from(mask);

  for (let pass = 0; pass < passes; pass++) {
    const dst = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let n = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            sum += src[ny * width + nx];
            n++;
          }
        }

        dst[y * width + x] = sum / n;
      }
    }

    src = dst;
  }

  return src;
}

const isBackground = (bg, r, g, b) =>
  Math.hypot(r - bg.r, g - bg.g, b - bg.b) < BG_TOLERANCE;

/** Caixa do objeto, ignorando o fundo Bone. */
function boundingBox(bg, data, width, height, channels) {
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (isBackground(bg, data[i], data[i + 1], data[i + 2])) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * A linha do diâmetro do rotor — a borda reta da meia-lua. Acima dela só se
 * projeta o pivô central.
 *
 * O que a identifica é a *extensão* da linha (do pixel mais à esquerda ao mais
 * à direita), não a contagem de pixels: o rotor é esqueletizado, e na linha do
 * diâmetro os vazados entre os braços deixam a contagem baixa. A extensão, ao
 * contrário, é máxima exatamente ali — é onde a semicircunferência é mais
 * larga.
 */
function diameterRow(bg, data, width, channels, box) {
  const target = box.width * 0.98;

  for (let y = box.top; y < box.top + box.height; y++) {
    let first = -1;
    let last = -1;

    for (let x = box.left; x < box.left + box.width; x++) {
      const i = (y * width + x) * channels;
      if (isBackground(bg, data[i], data[i + 1], data[i + 2])) continue;
      if (first < 0) first = x;
      last = x;
    }

    if (first >= 0 && last - first + 1 >= target) return y;
  }

  return box.top;
}

/**
 * Recorta um relógio inteiro fotografado sobre fundo escuro e devolve o WebP
 * com alpha, mais a caixa da silhueta e o círculo da caixa de aço.
 *
 * É o caminho comum do montado e das quatro peças do catálogo: as duas coisas
 * são a mesma fotografia — peça completa, com alça e coroa, sobre charcoal — e
 * pedem o mesmo tratamento. O que cada chamador faz com `circle` é problema
 * dele: a cena usa para plantar a foto em escala; o card ignora.
 */
async function cutoutOnDark(file, outPath) {
  const meta = await sharp(path.join(SRC, file)).metadata();
  const usable = {
    left: 0,
    top: 0,
    width: meta.width,
    height: Math.round(meta.height * (1 - WATERMARK_BAND)),
  };

  const { data, info } = await sharp(path.join(SRC, file))
    .extract(usable)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const bg = cutout(data, width, height, channels);
  const circle = caseCircle(bg, width, height);

  /* Caixa da peça recortada. */
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (bg[y * width + x]) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  const box = { left, top, width: right - left + 1, height: bottom - top + 1 };

  /* Máscara recortada e suavizada — a borda de 1 bit era o "esfarelado"
     visível na silhueta das alças. */
  const mask = new Float32Array(box.width * box.height);
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      mask[y * box.width + x] = bg[(y + box.top) * width + (x + box.left)]
        ? 0
        : 255;
    }
  }
  const soft = feather(mask, box.width, box.height);

  /* Aplica o alpha e recorta, num buffer só. */
  const out = Buffer.alloc(box.width * box.height * 4);

  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const src = ((y + box.top) * width + (x + box.left)) * channels;
      const dst = (y * box.width + x) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = soft[y * box.width + x];
    }
  }

  await sharp(out, {
    raw: { width: box.width, height: box.height, channels: 4 },
  })
    /* WebP em 95: visualmente idêntico ao PNG e uma fração do peso —
       menos banda para baixar e menos trabalho para decodificar antes do
       primeiro frame. O alpha do recorte sobrevive. */
    .webp({ quality: 95 })
    .toFile(outPath);

  return { box, circle };
}

await mkdir(OUT, { recursive: true });

/* ── O relógio montado ─────────────────────────────────────────────────── */
{
  const { box, circle } = await cutoutOnDark(
    ASSEMBLED,
    path.join(OUT, "montado.webp"),
  );

  /* A escala, para a cena plantar a foto no mesmo tamanho das outras peças.
     O raio da caixa vira CASE_RADIUS unidades; o resto sai daí. O deslocamento
     é o quanto o centro da caixa está fora do centro da imagem — sem ele, o
     relógio nasceria torto sobre a pilha (as alças e a coroa puxam a caixa da
     imagem para um lado). */
  const CASE_RADIUS = 2.0; // igual ao raio externo do bisel, na cena
  const scale = CASE_RADIUS / circle.radius;

  const manifest = {
    width: +(box.width * scale).toFixed(4),
    height: +(box.height * scale).toFixed(4),
    offsetX: +((circle.cx - (box.left + box.width / 2)) * scale).toFixed(4),
    offsetZ: +((circle.cy - (box.top + box.height / 2)) * scale).toFixed(4),
  };

  await writeFile(
    path.join(ROOT, "src", "data", "montado.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  console.log(
    `montado    silhueta ${box.width}×${box.height}  ` +
      `caixa r=${circle.radius.toFixed(1)}px  →  plano ${manifest.width}×${manifest.height} un`,
  );
}

/* ── As peças do catálogo ──────────────────────────────────────────────── */
{
  const refs = Object.entries(WATCHES);

  if (refs.length) {
    const PECAS = path.join(ROOT, "public", "pecas");
    await mkdir(PECAS, { recursive: true });

    for (const [ref, views] of refs) {
      for (const [view, file] of Object.entries(views)) {
        /* `front` vira cr-01.webp; qualquer outra vista ganha sufixo
           (cr-01-side.webp). O nome da vista principal não carrega sufixo
           porque ela é a peça — as outras é que são "a peça, de outro jeito". */
        const name = view === "front" ? ref : `${ref}-${view}`;
        const out = path.join(PECAS, `${name}.webp`);

        const info = await sharp(path.join(WATCH_SRC, file))
          .resize(WATCH_WIDTH, null, { withoutEnlargement: true })
          .webp({ quality: 88 })
          .toFile(out);

        console.log(
          `${name.padEnd(12)} ${info.width}×${info.height}  ` +
            `${(info.size / 1024).toFixed(0)} KB`,
        );
      }
    }
  }
}

/* ── A imagem de fecho ─────────────────────────────────────────────────── */
{
  const meta = await sharp(path.join(ROOT, CLOSING)).metadata();

  /* A marca d'água mora na faixa de baixo, e some antes de qualquer medição —
     a mesma WATERMARK_BAND das peças da anatomia, pelo mesmo motivo. */
  const info = await sharp(path.join(ROOT, CLOSING))
    .extract({
      left: 0,
      top: 0,
      width: meta.width,
      height: Math.round(meta.height * (1 - WATERMARK_BAND)),
    })
    /* Sem alpha: a cena é opaca e o PNG só carrega um canal morto. */
    .flatten({ background: "#16171a" })
    /* A fonte tem 3168px de largura — larga o bastante para que o fecho seja
       REDUZIDO em qualquer tela, e não esticado. Entregar os 3168 seria mandar
       pixels que ninguém amostra; 2400 cobre uma tela de 1920 com folga para o
       zoom do parallax (1920 × 1.16 = 2227) e ainda sobra margem.

       Qualidade 90: numa imagem que é reduzida, o downscale já esconde a maior
       parte do artefato. Foi a versão anterior — uma fonte pequena, ESTICADA —
       que exigia 95, porque ampliar estica o artefato junto. */
    .resize(2400, null, { withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(ROOT, "public", "fecho.webp"));

  console.log(
    `fecho        ${info.width}×${info.height}  ` +
      `${(info.width / info.height).toFixed(2)}:1  ${(info.size / 1024).toFixed(0)} KB`,
  );
}

for (const [id, file] of Object.entries(SOURCES)) {
  const src = sharp(path.join(SRC, file));
  const meta = await src.metadata();

  /* Fora a faixa da marca d'água, antes de qualquer medição. */
  const usable = {
    left: 0,
    top: 0,
    width: meta.width,
    height: Math.round(meta.height * (1 - WATERMARK_BAND)),
  };

  const { data, info } = await sharp(path.join(SRC, file))
    .extract(usable)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bg = sampleBackground(data, info.channels);
  const box = boundingBox(bg, data, info.width, info.height, info.channels);

  let region;
  let size;

  if (id === "rotor") {
    /* Meia-lua. A altura útil é o raio — ou seja, metade da largura, exatos
       2:1, que é a proporção da caixa da geometria que vai recebê-la.
       Ancoramos no fundo do arco e subimos: o que sobra acima da linha do
       diâmetro é o pivô, que na cena é uma malha à parte.

       (Medir a linha do diâmetro por varredura também funciona — `diameterRow`
       faz isso — mas dava 1.86:1, porque as pontas do aro têm uma aba que sobe
       um pouco. Derivar do raio não erra.) */
    const height = Math.round(box.width / 2);
    region = {
      left: box.left,
      top: box.top + box.height - height,
      width: box.width,
      height,
    };
    size = { width: 2048, height: 1024 };
  } else {
    /* Disco: quadrado centrado no CÍRCULO da peça, não na caixa da silhueta.
       A caixa mente — a sombra sob o fundo esticava a dele 73px na vertical,
       o quadrado saía descentrado e o disco ficava menor que o círculo da
       máscara: serrilha deslocada, anel de Bone assado na borda, e o furo da
       janela fora do lugar. O centro sai da transformada de distância (o
       maior círculo inscrito É o disco) e o raio é a maior distância do
       centro à silhueta — as pontas da serrilha, com guarda de 0,1% contra
       pixel perdido. */
    const bgGrow = cutout(data, info.width, info.height, info.channels);
    const circle = caseCircle(bgGrow, info.width, info.height);

    const HIST_BINS = 2048;
    const hist = new Uint32Array(HIST_BINS);
    let objCount = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (bgGrow[y * info.width + x]) continue;
        const d = Math.hypot(x - circle.cx, y - circle.cy);
        hist[Math.min(HIST_BINS - 1, Math.round(d))]++;
        objCount++;
      }
    }
    let skip = objCount * 0.001;
    let radius = HIST_BINS - 1;
    for (let d = HIST_BINS - 1; d >= 0; d--) {
      skip -= hist[d];
      if (skip <= 0) {
        radius = d;
        break;
      }
    }

    /* O raio vira exatamente o r1 da máscara (0.995 do meio-lado). */
    const side = Math.round((2 * radius) / 0.995);
    region = {
      left: Math.round(circle.cx - side / 2),
      top: Math.round(circle.cy - side / 2),
      width: side,
      height: side,
    };
    size = { width: 1024, height: 1024 };

    console.log(
      `${id.padEnd(10)} círculo centro (${circle.cx}, ${circle.cy})  ` +
        `r_inscrito=${circle.radius.toFixed(0)}px  r_silhueta=${radius}px`,
    );
  }

  /* Um único extract, direto na imagem original.
     Encadear `.extract(usable).extract(region)` NÃO compõe: o sharp aplica um
     extract antes do resize e outro depois, então o segundo recorte saía
     deslocado e ampliado. Como `usable` começa em (0,0), as coordenadas de
     `region` já valem na original — basta recortar uma vez. */
  const pad = {
    left: Math.max(0, -region.left),
    top: Math.max(0, -region.top),
    right: Math.max(0, region.left + region.width - info.width),
    bottom: Math.max(0, region.top + region.height - info.height),
  };

  const crop = {
    left: region.left + pad.left,
    top: region.top + pad.top,
    width: region.width - pad.left - pad.right,
    height: region.height - pad.top - pad.bottom,
  };
  /* Se o objeto encostava na borda, devolvemos o que falta em Bone para não
     deslocar o centro — o círculo precisa ficar inscrito no quadrado. */
  const extend = { ...pad, background: { r: bg.r, g: bg.g, b: bg.b, alpha: 1 } };

  const resized = await sharp(path.join(SRC, file))
    .extract(crop)
    .extend(extend)
    .resize(size.width, size.height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  /* O fundo Bone da fotografia vira alpha 0. Deixá-lo na textura era o "disco
     fantasma" sob as peças: a tampa do cilindro amostrava o anel de Bone entre
     a borda do objeto e a borda do recorte. Cada forma pede uma máscara:

     DISCOS — máscara circular geométrica. O recorte é, por construção, um
     quadrado com o disco inscrito; o círculo exato é conhecido de antemão e
     não há o que detectar. As tentativas de detectar por imagem falharam das
     duas maneiras possíveis: na resolução redimensionada, o teste por vizinho
     desce o gradiente da borda e engole o objeto (mostrador 98% transparente);
     na original, come o friso claro da borda do mostrador (79% → 69%).

     ROTOR — máscara por temperatura de cor + distância ao fundo (ver
     `warmthCutout`): decisão por pixel. Os vãos fechados pelo fio do aro
     deixam de ser um problema porque não há inundação nenhuma. */
  {
    const { width, height, channels } = resized.info;
    const px = resized.data;
    let soft;

    if (id === "rotor") {
      const orig = await sharp(path.join(SRC, file))
        .extract(crop)
        .extend(extend)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const ow = orig.info.width;
      const oh = orig.info.height;
      const bgMask = warmthCutout(orig.data, ow, oh, orig.info.channels, bg);

      const maskBuf = Buffer.alloc(ow * oh);
      for (let i = 0; i < maskBuf.length; i++) maskBuf[i] = bgMask[i] ? 0 : 255;

      /* A máscara nasce binária na resolução da foto e é AMPLIADA (~2×) para o
         tamanho da textura — sem desfoque proporcional à ampliação, a borda
         sai em degraus de bloco.

         O `toColourspace("b-w")` não é decorativo: o resize do sharp promove
         raw de 1 canal para sRGB de 3 na saída. Lido como 1 byte por pixel,
         o buffer intercalado virava uma máscara embaralhada — era isso que
         retalhava o rotor em fragmentos na cena. */
      const upscale = size.width / ow;
      const { data: softData, info: softInfo } = await sharp(maskBuf, {
        raw: { width: ow, height: oh, channels: 1 },
      })
        .resize(size.width, size.height, { fit: "fill" })
        .blur(Math.max(0.6, upscale * 0.9))
        .toColourspace("b-w")
        .raw()
        .toBuffer({ resolveWithObject: true });

      if (softInfo.channels !== 1) {
        throw new Error(`máscara do ${id}: esperava 1 canal, veio ${softInfo.channels}`);
      }
      soft = softData;
    } else {
      soft = circleMask(size.width, WINDOW[id] ?? 0);
    }

    for (let i = 0; i < width * height; i++) px[i * channels + 3] = soft[i];

    await sharp(px, { raw: { width, height, channels } })
      .webp({ quality: 95 })
      .toFile(path.join(OUT, `${id}.webp`));
  }

  console.log(
    `${id.padEnd(10)} objeto ${box.width}×${box.height}  ` +
      `recorte ${region.width}×${region.height} (${(region.width / region.height).toFixed(2)}:1)  ` +
      `→ ${size.width}×${size.height}`,
  );
}
