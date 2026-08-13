export type LayerId =
  | "bisel"
  | "cristal"
  | "mostrador"
  | "movimento"
  | "rotor"
  | "fundo"
  | "vidro";

export type Layer = {
  id: LayerId;
  label: string;
  spec: string;
  /** Posição em repouso no eixo do relógio (o relógio montado). */
  rest: number;
  /** Posição ao final do explode. A ordem da pilha é preservada. */
  apart: number;
};

/**
 * As sete camadas da Vista Anatomia, do bisel ao vidro do fundo.
 *
 * `rest` e `apart` são as duas posições no eixo Y do relógio; o scroll
 * interpola entre elas. Os intervalos de `apart` não são uniformes de
 * propósito: o movimento é a peça densa e ganha mais ar em volta.
 *
 * A pilha é simétrica nas pontas: bisel + cristal fecham a frente,
 * fundo + vidro fecham as costas — o vidro é a última peça a se soltar.
 *
 * O curso do explode é 0,8× o original, o mesmo fator com que a câmera se
 * aproximou (`scene.tsx`). Os dois andam juntos por necessidade: aproximar a
 * câmera amplia a pilha inteira, vãos inclusive, e o explode passava da tela.
 * Com o curso comprimido na mesma medida, a pilha aberta ocupa a altura de
 * antes — e cada peça chega 25% maior. É esse o ganho: peça grande, vão justo.
 */
export const LAYERS: Layer[] = [
  {
    id: "bisel",
    label: "Bisel",
    spec: "Aço 904L usinado",
    rest: 0.34,
    apart: 2.64,
  },
  {
    id: "cristal",
    label: "Cristal",
    spec: "Safira dupla antirreflexo",
    rest: 0.22,
    apart: 1.6,
  },
  {
    id: "mostrador",
    label: "Mostrador",
    spec: "Latão galvanizado, sem índice",
    rest: 0.08,
    apart: 0.64,
  },
  {
    id: "movimento",
    label: "Movimento",
    spec: "Calibre CRN, montado à mão",
    rest: -0.14,
    apart: -0.56,
  },
  {
    id: "rotor",
    label: "Rotor",
    spec: "Esqueletizado, pivô central",
    rest: -0.32,
    apart: -1.76,
  },
  {
    id: "fundo",
    label: "Fundo",
    spec: "Aço 904L, rosca serrilhada",
    rest: -0.44,
    apart: -2.8,
  },
  {
    id: "vidro",
    label: "Vidro",
    spec: "Safira de exibição",
    /* Em repouso, encaixado na janela do anel do fundo (o anel ocupa
       -0.52 a -0.36; o vidro, fino, assenta um fio abaixo do plano dele). */
    rest: -0.46,
    apart: -3.68,
  },
];
