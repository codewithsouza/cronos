"use client";

import { useEffect, useRef } from "react";
import { invalidate, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { LAYERS } from "@/data/anatomy";
import { clamp01, separation } from "@/lib/ease";
import { Part } from "./parts";
import { Assembled } from "./assembled";

export type ProjectedPoint = { x: number; y: number; opacity: number };

type Props = {
  /** 0 → relógio montado. 1 → totalmente desmembrado. Lido, nunca renderizado. */
  progress: React.RefObject<number>;
  /** Chamado a cada frame com a posição em tela de cada camada. */
  onFrame: (points: ProjectedPoint[]) => void;
  reduced: boolean;
};

/* A câmera usa a MESMA curva das peças, e isso é estrutural, não estético.
   No repouso ela olha de cima, ao longo do eixo em que as camadas se separam —
   dessa posição, a separação é invisível (as peças vêm na direção da lente).
   Se a câmera demora a sair do zênite, o começo do explode acontece sem que
   nada pareça se mover: foi exatamente o bug que fazia o relógio montado se
   dissolver "antes" da animação. O giro precisa começar no primeiro pixel de
   scroll, junto com tudo. */

export function AnatomyScene({ progress, onFrame, reduced }: Props) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const points = useRef<ProjectedPoint[]>(
    LAYERS.map(() => ({ x: 0, y: 0, opacity: 0 })),
  );
  const world = useRef(new THREE.Vector3());
  const { camera, size } = useThree();

  /* Com `frameloop="demand"` nada é desenhado sem um pedido explícito — e UM
     frame não basta. O Environment (frames={1}) grava o cubemap no primeiro
     frame renderizado, mas os materiais só o amostram do frame seguinte em
     diante. Com um único invalidate, a cena congelava no estado meio-assado:
     metal escuro como grafite e cristal invisível (a presença dele é 100%
     reflexo do ambiente), até o usuário rolar e pedir outro frame sem querer.
     Alguns frames seguidos no mount resolvem a cadeia inteira: bake do
     ambiente → upload das texturas → primeiro frame correto. */
  useEffect(() => {
    let remaining = 6;
    let raf = 0;

    const kick = () => {
      invalidate();
      if (--remaining > 0) raf = requestAnimationFrame(kick);
    };
    kick();

    return () => cancelAnimationFrame(raf);
  }, []);

  useFrame(() => {
    const p = clamp01(progress.current ?? 0);

    /* ── As camadas ──────────────────────────────────────────────────────
       Cada uma parte um pouco depois da anterior: a pilha se abre de fora
       para dentro, como um relojoeiro desmontaria de verdade. */
    LAYERS.forEach((layer, i) => {
      const g = groupRefs.current[i];
      if (!g) return;

      const start = i * 0.05;
      const span = 1 - start;
      const local = separation((p - start) / span);

      g.position.y = THREE.MathUtils.lerp(layer.rest, layer.apart, local);

      /* O rotor é a única peça que gira ao se soltar — ele é o que gira. */
      if (layer.id === "rotor") {
        g.rotation.y = -0.5 + local * Math.PI * 0.75;
      }
    });

    /* ── A câmera ────────────────────────────────────────────────────────
       Começa no eixo do relógio, olhando o mostrador de frente. Desce para
       três-quartos à medida que a pilha se abre — sem esse giro, o explode
       aconteceria todo na direção da câmera e não se veria nada. */
    if (!reduced) {
      const cam = separation(p);
      /* Nunca exatamente π/2: no zênite a direção do olhar fica paralela ao
         vetor "up" e o `lookAt` degenera — a cena giraria sozinha. */
      const elevation = THREE.MathUtils.lerp(1.45, 0.3, cam);
      const azimuth = THREE.MathUtils.lerp(0, 0.42, cam);
      /* A distância É o zoom: numa perspectiva, o tamanho na tela é
         inversamente proporcional ao raio. Aproximar 20% (÷ 1,25) amplia a
         cena inteira em 25% — peças, foto do montado e os vãos entre elas,
         sem tocar em geometria nenhuma.
         O relógio tem raio 2; abaixo de ~10 unidades ele sangra pelas bordas. */
      const radius = THREE.MathUtils.lerp(12.8, 15.2, cam);

      camera.position.set(
        radius * Math.cos(elevation) * Math.sin(azimuth),
        radius * Math.sin(elevation),
        radius * Math.cos(elevation) * Math.cos(azimuth),
      );
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
    }

    /* ── As legendas ─────────────────────────────────────────────────────
       Projeta o centro de cada peça para coordenadas de tela, para que o fio
       Brushed saia da peça de verdade e não de um ponto decorativo. */
    LAYERS.forEach((layer, i) => {
      const g = groupRefs.current[i];
      if (!g) return;

      g.getWorldPosition(world.current);
      world.current.project(camera);

      const point = points.current[i];
      point.x = (world.current.x * 0.5 + 0.5) * size.width;
      point.y = (-world.current.y * 0.5 + 0.5) * size.height;
      /* As legendas só aparecem quando há separação para anotar. */
      point.opacity = clamp01((p - 0.18 - i * 0.04) * 6);
    });

    onFrame(points.current);
  });

  return (
    <>
      {/* O mesmo Bone do CSS da seção. Os dois têm de casar: o canvas é opaco e
          cobre o palco inteiro, então qualquer diferença viraria uma emenda
          visível na borda dele. */}
      <color attach="background" args={["#f2f0eb"]} />

      {/* Sem sombras projetadas: o shadow map custa uma passada extra da cena
          por frame, e as peças já se separam por reflexo e oclusão do ambiente. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 9, 5]} intensity={1.6} />
      <directionalLight position={[-6, 3, -4]} intensity={0.5} />

      {/*
        O metal precisa de algo para refletir — sem mapa de ambiente, aço
        vira preto. Este Environment é montado com Lightformers dentro da
        própria cena: nada é baixado, e as faixas de luz imitam os softboxes
        de uma mesa de fotografia de produto.
      */}
      <Environment resolution={128} frames={1}>
        <mesh scale={[40, 40, 40]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#5c6066" side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-9, 1, 3]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[10, 14]} />
          <meshBasicMaterial color="#e8e6e1" />
        </mesh>
        <mesh position={[9, 0, -3]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[8, 12]} />
          <meshBasicMaterial color="#9aa0a6" />
        </mesh>
      </Environment>

      {/* A peça inteira, no topo da pilha. Dissolve-se e revela as sete. */}
      <Assembled progress={progress} />

      <group>
        {LAYERS.map((layer, i) => (
          <group
            key={layer.id}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            position={[0, layer.rest, 0]}
          >
            <Part id={layer.id} />
          </group>
        ))}
      </group>
    </>
  );
}
