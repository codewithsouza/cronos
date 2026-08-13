export type Collection = "Monólito" | "Eclipse";

export type Piece = {
  ref: string;
  name: string;
  collection: Collection;
  price: number;
  calibre: string;
  reserve: string;
  jewels: number;
  /**
   * Material e diâmetro moram separados de propósito.
   *
   * Juntos numa frase só ("Titânio grau 5 · 40 mm") eles quebram em duas linhas
   * numa coluna estreita — e, como cada peça tem um material de comprimento
   * diferente, quebram em cards diferentes, o que desalinhava o grid. Separados,
   * cada um cai na sua coluna e a ficha do card lê como instrumento; a página da
   * peça, que tem largura de sobra, recompõe a frase inteira.
   */
  case: { material: string; diameter: string };
  note: string;
  /**
   * As vistas da peça, sangradas — a fotografia traz o próprio fundo escuro e o
   * card só a enquadra. Gerada por `scripts/textures.mjs` (const `WATCHES`).
   *
   * `side` é opcional, e essa opcionalidade é o contrato do card: quem tem a
   * segunda vista abre nela quando a mão chega; quem não tem cai no gesto de
   * aproximação. Nenhuma peça fica sem resposta ao hover — a resposta é que muda.
   */
  image: { front: string; side?: string };
  /** Edição numerada — presente apenas nas peças limitadas. */
  edition?: string;
};

/**
 * PROVISÓRIO. Três das quatro peças ainda não foram fotografadas, e até lá
 * mostram o relógio montado da Anatomia — a mesma imagem, três vezes. É para
 * ser trocada: ver os prompts em `cronos-prompts.md`.
 *
 * Note que esta é um recorte com alpha, feito para a cena 3D, e não uma
 * fotografia sangrada como a do CR-01. Ela vai parecer ampliada demais dentro do
 * card, e deve — o card foi desenhado para a foto de verdade, não para o
 * substituto.
 */
const PROVISORIO = { front: "/textures/montado.webp" };

/**
 * Toda referência segue o padrão CR-00 seguido de um mineral ou material.
 *
 * OS DOIS CALIBRES SÃO TOURBILLON, e isso não é engano.
 *
 * O CRN-8 já se chamou "automático", de quando a Monólito era a linha de
 * mostrador fechado e a Eclipse detinha a complicação. As quatro peças
 * fotografadas mostram o tourbillon — inclusive as duas da Monólito —, e uma
 * ficha que dissesse "automático" embaixo de uma gaiola girando seria mentira
 * escrita em caixa alta, no meio da vitrine.
 *
 * O que hoje distingue os calibres é a reserva e a contagem de rubis, e o que
 * distingue as LINHAS é a caixa, não o mecanismo — ver `app/colecoes/page.tsx`.
 */
export const PIECES: Piece[] = [
  {
    ref: "CR-01",
    name: "Ardósia",
    collection: "Monólito",
    price: 42800,
    calibre: "CRN-8 tourbillon",
    reserve: "72 horas",
    jewels: 27,
    case: { material: "Aço 904L", diameter: "39 mm" },
    note: "Caixa quadrada, usinada de um bloco só. O esqueleto em cinza-ardósia — a máquina inteira à vista, e nenhuma cor.",
    image: { front: "/pecas/cr-01.webp", side: "/pecas/cr-01-side.webp" },
  },
  {
    ref: "CR-02",
    name: "Névoa",
    collection: "Monólito",
    price: 51200,
    calibre: "CRN-8 tourbillon",
    reserve: "72 horas",
    jewels: 27,
    case: { material: "Safira maciça", diameter: "40 mm" },
    note: "Um bloco de safira lapidado até desaparecer. Sobra o mecanismo, suspenso no ar.",
    image: { front: "/pecas/cr-02.webp", side: "/pecas/cr-02-side.webp" },
  },
  {
    ref: "CR-03",
    name: "Obsidiana",
    collection: "Eclipse",
    price: 68500,
    calibre: "CRN-12 tourbillon",
    reserve: "96 horas",
    jewels: 33,
    case: { material: "Cerâmica preta", diameter: "41 mm" },
    note: "Tourbillon visível às 6h. A escultura do mecanismo exposta como se deve.",
    image: { front: "/pecas/cr-03.webp", side: "/pecas/cr-03-side.webp" },
  },
  {
    ref: "CR-04",
    name: "Salitre",
    collection: "Eclipse",
    price: 74900,
    calibre: "CRN-12 tourbillon",
    reserve: "96 horas",
    jewels: 33,
    case: { material: "Platina 950", diameter: "41 mm" },
    note: "Ponte do tourbillon polida em espelho, numerada à mão.",
    /* ATENÇÃO: esta imagem traz "VACHERON CONSTANTIN GENÈVE" legível no
       mostrador e a cruz de Malta na coroa — marca de terceiro alucinada pelo
       gerador. Entrou por decisão consciente (o CRONOS é estudo e não vai ao
       ar), e NÃO pode sobreviver a nada que seja publicado. Regerar com "no text
       on the dial, no brand name, no logo" antes de qualquer uso real. */
    image: { front: "/pecas/cr-04.webp", side: "/pecas/cr-04-side.webp" },
    edition: "Edição de 40 peças",
  },
];

export function getPiece(ref: string): Piece | undefined {
  return PIECES.find((p) => p.ref.toLowerCase() === ref.toLowerCase());
}

export function piecesByCollection(collection: Collection): Piece[] {
  return PIECES.filter((p) => p.collection === collection);
}

/* Preço em pt-BR, sem centavos. Um valor cheio não precisa de vírgula. */
export function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
