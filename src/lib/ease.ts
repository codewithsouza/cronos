export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * A curva da separação.
 *
 * Antes isto era um `easeInOut` cúbico, e essa foi a origem de um erro de
 * leitura difícil de enxergar no código: numa animação presa ao scroll, um
 * ease-in significa que o começo do gesto do usuário quase não move nada. Em
 * 16% do percurso, o cúbico avança 4 × 0,16³ ≈ 1,6% — a peça fica parada
 * enquanto a pessoa rola.
 *
 * Um ease-out inverte isso: a separação responde já no primeiro movimento do
 * scroll (em 16% do percurso, 29%) e desacelera ao assentar. É o que se espera
 * de algo que é *dirigido* pela mão, e não reproduzido para ela.
 */
export const separation = (t: number) => {
  const p = clamp01(t);
  return 1 - (1 - p) * (1 - p);
};
