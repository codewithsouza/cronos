"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import MONTADO from "@/data/montado.json";
import { clamp01, separation } from "@/lib/ease";

const TEXTURE = "/textures/montado.webp?v=3";

useTexture.preload(TEXTURE);

/** Onde o relógio montado repousa, logo acima do bisel. */
const REST = 0.55;

/**
 * A janela da dissolução.
 *
 * Ela precisa cair *dentro* da separação, não antes dela. Enquanto a foto se
 * dissolvia nos primeiros 16% do scroll, as peças por baixo tinham avançado
 * 1,6% do caminho — então o relógio sumia e o que ficava era um disco parado.
 * A foto não parecia participar da animação porque, no tempo dela, não havia
 * animação: ela estava se apagando sobre uma pilha imóvel.
 */
const FADE_IN = 0.1;
const FADE_OUT = 0.45;

/** O curso do bisel — a camada logo abaixo, com quem o montado sobe junto.
    (apart 2.64 − rest 0.34. Se o curso do explode mudar em `anatomy.ts`,
    este número muda junto, ou a foto descola da pilha que ela representa.) */
const LIFT = 2.3;

/**
 * O relógio montado — a camada de cima da pilha.
 *
 * Visto de topo, o relógio 3D montado é um disco cinza: o mostrador é opaco e
 * não deixa ver nada. Não há maquinário. Esta peça resolve isso — é a
 * fotografia do relógio inteiro, esqueleto à vista, plantada na cena como um
 * plano no topo da pilha.
 *
 * Ela não é uma imagem *sobre* a cena, é uma peça *dentro* dela: entra na mesma
 * escala das outras (o raio da caixa na foto vale exatamente o raio do bisel — o
 * `scripts/textures.mjs` mede isso e escreve em `montado.json`), recebe a mesma
 * câmera, e some no mesmo scroll que separa as demais. Você vê o relógio pronto;
 * ele se dissolve; as sete peças que estavam por baixo se afastam.
 *
 * O material é `basic`, sem resposta à luz: a fotografia já tem a luz dela, e
 * relighting só a sujaria.
 */
export function Assembled({ progress }: { progress: React.RefObject<number> }) {
  const map = useTexture(TEXTURE);
  const mesh = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;

    return new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
      /* Sem teste de profundidade: o billboard inclina com a câmera e a metade
         de baixo dele mergulha atrás do bisel que sobe — com depth test, o anel
         cortava a foto numa aresta dura (a faixa cinza atravessando o relógio).
         A foto é uma dissolução, não um objeto sólido: desenha por cima
         (renderOrder no mesh) e deixa o alpha misturar as duas leituras. */
      depthTest: false,
    });
  }, [map]);

  useFrame(({ camera }) => {
    const m = mesh.current;
    if (!m) return;

    const p = progress.current ?? 0;

    /* Billboard: a foto encara a câmera em todos os frames. Sem isso, o giro
       da câmera a revelaria como um papel deitado sobre a pilha — e é o giro
       que torna a separação visível, então os dois precisam coexistir. Com o
       billboard, a foto pode viver até 45% do percurso, dissolvendo-se com o
       explode já em pleno movimento ao redor dela. */
    m.quaternion.copy(camera.quaternion);

    /* Sobe na mesma curva do bisel, e pelo mesmo curso: enquanto está visível,
       o relógio montado *é* a camada de cima da pilha, e se comporta como uma. */
    m.position.y = REST + separation(p) * LIFT;

    /* Quadrática: a foto afina rápido no começo e não paira como um véu
       leitoso sobre a pilha já aberta — mas a cauda ainda alcança 45%,
       com o explode em pleno movimento ao redor dela. */
    const t = clamp01((p - FADE_IN) / (FADE_OUT - FADE_IN));
    const opacity = (1 - t) * (1 - t);
    material.opacity = opacity;

    /* Fora do caminho quando invisível — nada de desenhar um plano a 0%. */
    m.visible = opacity > 0.001;
  });

  return (
    <mesh
      ref={mesh}
      material={material}
      /* Depois de todo transparente da pilha: com depthTest desligado, é a
         ordem que garante a foto por cima do cristal e do bisel. */
      renderOrder={10}
      /* O plano nasce em pé (normal +Z); deitamos para a face olhar a câmera,
         que no repouso está no eixo do relógio. */
      rotation={[-Math.PI / 2, 0, 0]}
      /* O centro da caixa na foto não é o centro da imagem — as alças e a coroa
         puxam o enquadramento. Sem este deslocamento o relógio nasceria torto
         sobre a pilha. */
      position={[-MONTADO.offsetX, REST, -MONTADO.offsetZ]}
    >
      <planeGeometry args={[MONTADO.width, MONTADO.height]} />
    </mesh>
  );
}
