"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import type { LayerId } from "@/data/anatomy";
import {
  SAPPHIRE,
  STEEL,
  STEEL_BRUSHED,
  STEEL_DARK,
  photographic,
  planarUV,
  ringGeometry,
  rotorGeometry,
} from "./materials";

const R = 1.72; // raio interno da caixa
const ROTOR_R = R - 0.14;

/**
 * As quatro peças fotografadas de frente viram textura direto nas faces das
 * malhas. Elas continuam sendo objetos 3D — com espessura, com a câmera
 * orbitando em volta, com o explode —, só que vestidas com a fotografia em vez
 * do metal procedural.
 *
 * O bisel e o cristal foram fotografados em três-quartos, e por isso não
 * servem como textura plana: seguem procedurais. Não é perda — são justamente
 * as duas peças mais simples da pilha, um anel e um disco de vidro.
 */
/* O `?v=` fura o cache do navegador. O public/ é servido direto do disco, e
   durante a iteração das máscaras alguns intermediários quebrados chegaram a
   ser servidos — quem os tem em cache veria o rotor em pedaços para sempre.
   Suba o número a cada regeneração de textura. */
const V = "?v=5";

const TEXTURES = {
  mostrador: `/textures/mostrador.webp${V}`,
  movimento: `/textures/movimento.webp${V}`,
  fundo: `/textures/fundo.webp${V}`,
  rotor: `/textures/rotor.webp${V}`,
} as const;

/* Buscadas assim que o módulo carrega, e não quando a malha pede. Sem isso, a
   primeira aparição da cena espera o download e o decode — que é justamente
   quando o usuário está rolando. */
useTexture.preload(Object.values(TEXTURES));

/* ── Bisel ─────────────────────────────────────────────────────────────── */
function Bisel() {
  const geo = useMemo(() => ringGeometry(2.0, R, 0.18), []);
  const inner = useMemo(() => ringGeometry(R + 0.02, R - 0.06, 0.1), []);
  return (
    <group>
      <mesh geometry={geo} material={STEEL} />
      <mesh geometry={inner} material={STEEL_DARK} position={[0, -0.08, 0]} />
    </group>
  );
}

/* ── Cristal ───────────────────────────────────────────────────────────── */
function Cristal() {
  return (
    <group>
      <mesh material={SAPPHIRE}>
        <cylinderGeometry args={[R - 0.02, R - 0.02, 0.09, 128]} />
      </mesh>
      {/* O fio de safira na borda: é ele que denuncia a espessura do cristal.
          O torus nasce no plano XY — em pé, um bambolê atravessando a pilha.
          Deitado (eixo do furo = Y) ele abraça a borda do disco. */}
      <mesh material={STEEL_BRUSHED} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R - 0.02, 0.006, 8, 128]} />
      </mesh>
    </group>
  );
}

/**
 * Disco fotografado.
 *
 * A tampa do cilindro no three.js já mapeia um círculo inscrito no quadrado da
 * textura — que é exatamente como o script recorta cada peça. A foto cai no
 * lugar sem uma linha de UV manual; os cantos do quadrado nunca são amostrados.
 *
 * A ordem dos materiais num cilindro é [lateral, tampa de cima, tampa de
 * baixo].
 */
function PhotoDisc({
  src,
  radius,
  depth,
  seeThrough = false,
}: {
  src: string;
  radius: number;
  depth: number;
  /** Quando a textura tem furo (a janela do fundo), a tampa de baixo também
      precisa vestir a foto: o `alphaTest` dela recorta o mesmo furo e a janela
      fica vazada de verdade — sem isso, o furo de cima mostraria o aço da
      tampa de baixo. */
  seeThrough?: boolean;
}) {
  const map = useTexture(src);
  const face = useMemo(() => photographic(map), [map]);

  return (
    <mesh material={[STEEL_DARK, face, seeThrough ? face : STEEL_DARK]}>
      <cylinderGeometry args={[radius, radius, depth, 128]} />
    </mesh>
  );
}

/* ── Mostrador ─────────────────────────────────────────────────────────── */
function Mostrador() {
  return <PhotoDisc src={TEXTURES.mostrador} radius={R - 0.05} depth={0.05} />;
}

/* ── Movimento ─────────────────────────────────────────────────────────── */
function Movimento() {
  return <PhotoDisc src={TEXTURES.movimento} radius={R - 0.12} depth={0.22} />;
}

/* ── Fundo ─────────────────────────────────────────────────────────────── */
function Fundo() {
  /* O anel de aço da tampa, com a janela central VAZADA (o script abre o furo
     no alpha). O vidro que morava aqui é a camada `vidro`, a última da pilha —
     pela janela se vê o rotor e o movimento de verdade, não a foto deles. */
  return <PhotoDisc src={TEXTURES.fundo} radius={2.0} depth={0.16} seeThrough />;
}

/* ── Vidro ─────────────────────────────────────────────────────────────── */
function Vidro() {
  /* A janela de exibição: o espelho do Cristal, do outro lado da pilha.
     O raio casa com o furo do anel do fundo (0.62 × 2.0 — ver WINDOW no
     scripts/textures.mjs; mudou lá, muda aqui). */
  const R_VIDRO = 1.24;
  return (
    <group>
      <mesh material={SAPPHIRE}>
        <cylinderGeometry args={[R_VIDRO, R_VIDRO, 0.06, 128]} />
      </mesh>
      {/* O mesmo fio que denuncia a espessura do cristal, deitado no plano. */}
      <mesh material={STEEL_BRUSHED} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R_VIDRO, 0.005, 8, 128]} />
      </mesh>
    </group>
  );
}

/* ── Rotor ─────────────────────────────────────────────────────────────── */
function Rotor() {
  const map = useTexture(TEXTURES.rotor);
  const face = useMemo(() => photographic(map), [map]);

  /* A foto é a meia-lua INTEIRA, esqueletizada: aro, raios e cubo. Um meio-anel
     com furo de 0.86 cairia justamente sobre os raios — amputados na borda
     interna, virariam cacos soltos. O meio-disco entrega a superfície toda e o
     `alphaTest` recorta o esqueleto de verdade; o furo mínimo só abre passagem
     para o pivô. */
  const geo = useMemo(() => {
    const g = rotorGeometry(ROTOR_R, 0.1, 0.09);
    planarUV(g, ROTOR_R);
    return g;
  }, []);

  return (
    <group rotation={[0, -0.5, 0]}>
      <mesh geometry={geo} material={face} />
      {/* O pivô: na foto ele se projeta acima da linha do diâmetro, fora do
          recorte. Aqui ele volta como malha. */}
      <mesh material={STEEL_DARK}>
        <cylinderGeometry args={[0.16, 0.16, 0.14, 32]} />
      </mesh>
    </group>
  );
}

const PROCEDURAL: Record<LayerId, () => React.JSX.Element> = {
  bisel: Bisel,
  cristal: Cristal,
  mostrador: Mostrador,
  movimento: Movimento,
  rotor: Rotor,
  fundo: Fundo,
  vidro: Vidro,
};

/**
 * A fronteira trocável.
 *
 * Hoje cada camada é uma malha montada em código — quatro delas vestidas com a
 * fotografia da peça real. Para substituir uma por um GLB, coloque o arquivo em
 * `public/models/` e aponte aqui:
 *
 *     const GLB_PARTS: Partial<Record<LayerId, string>> = {
 *       movimento: "/models/movimento.glb",
 *     };
 *
 * O explode, a câmera, as legendas e o scroll não mudam — eles operam sobre o
 * grupo da camada, não sobre a malha. Peça a peça, sem reescrever a cena.
 */
const GLB_PARTS: Partial<Record<LayerId, string>> = {};

export function Part({ id }: { id: LayerId }) {
  const url = GLB_PARTS[id];
  if (url) return <GlbPart url={url} />;

  const Procedural = PROCEDURAL[id];
  return <Procedural />;
}

/**
 * Normaliza o GLB: centraliza na origem e escala para caber no diâmetro da
 * caixa, para que um modelo com escala arbitrária caia no lugar certo da pilha.
 */
function GlbPart({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    clone.position.sub(center);

    const widest = Math.max(size.x, size.z) || 1;
    const scale = (R * 2) / widest;
    clone.scale.setScalar(scale);

    return clone;
  }, [scene]);

  return <primitive object={object} />;
}
