import * as THREE from "three";

/* Nenhum tom quente entra na cena. Todo metal é frio. */
export const STEEL = new THREE.MeshStandardMaterial({
  color: "#c3c7cb",
  metalness: 1,
  roughness: 0.22,
});

export const STEEL_BRUSHED = new THREE.MeshStandardMaterial({
  color: "#b8bcc0",
  metalness: 1,
  roughness: 0.42,
});

export const STEEL_DARK = new THREE.MeshStandardMaterial({
  color: "#8a8d91",
  metalness: 1,
  roughness: 0.34,
});

/* Cerâmica preta da CR-03. Quase sem reflexo especular. */
export const CERAMIC = new THREE.MeshStandardMaterial({
  color: "#16171a",
  metalness: 0.15,
  roughness: 0.42,
});

/* Mostrador: latão galvanizado em cinza-ardósia, sem índice. */
export const DIAL = new THREE.MeshStandardMaterial({
  color: "#4a4e54",
  metalness: 0.45,
  roughness: 0.72,
});

/**
 * Safira.
 *
 * `transmission` daria refração de verdade — e custa uma re-renderização da
 * cena inteira, por frame, por malha transmissiva. Com três peças de safira,
 * isso é o triplo do custo do frame para um ganho que quase não se vê num
 * cristal fino e plano.
 *
 * O vidro aqui é feito do jeito barato e honesto: reflexo de ambiente forte,
 * quase nenhuma cor própria, e opacidade baixa. Custa uma passada.
 */
export const SAPPHIRE = new THREE.MeshPhysicalMaterial({
  color: "#e9ecef",
  metalness: 0,
  roughness: 0.04,
  transparent: true,
  /* O corpo quase não existe — o cristal se anuncia pelo aro e pelo reflexo.
     (0.12 foi tímido demais: com o ambiente consertado, 0.18 dá presença de
     vidro sem voltar a ler como disco branco.) */
  opacity: 0.18,
  envMapIntensity: 2.6,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  depthWrite: false,
});

/**
 * As peças fotografadas entram como textura, não como cor.
 *
 * A luz já está assada na imagem, então o material precisa ser quase inerte:
 * metalness alto reagiria de novo ao ambiente e escureceria a foto. O que se
 * quer aqui é que a fotografia apareça como ela é, com apenas um verniz de
 * reflexo por cima.
 */
export function photographic(map: THREE.Texture): THREE.MeshStandardMaterial {
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  return new THREE.MeshStandardMaterial({
    map,
    metalness: 0.25,
    roughness: 0.55,
    envMapIntensity: 0.7,
    /* As texturas trazem alpha: o fundo Bone da fotografia foi recortado.
       `alphaTest` descarta esses pixels no shader — recorte limpo, sem os
       problemas de ordenação de `transparent: true`. De quebra, os vazados
       do rotor e do movimento ficam vazados de verdade: vê-se através deles. */
    alphaTest: 0.5,
  });
}

/**
 * Projeção planar de UV sobre a meia-lua do rotor.
 *
 * A `ExtrudeGeometry` gera UVs em unidades de mundo, que não servem para
 * encaixar uma foto. Reprojetamos: a caixa da geometria (x de -raio a +raio,
 * z de -raio a 0) vira exatamente o retângulo 2:1 da textura — que é como o
 * `scripts/textures.mjs` recorta a imagem do rotor. Os dois lados chegam
 * normalizados na mesma caixa, então o encaixe é automático.
 */
export function planarUV(geo: THREE.BufferGeometry, outer: number) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    uv[i * 2] = (x + outer) / (2 * outer);
    /* z = 0 é a linha do diâmetro (topo da imagem); z = -raio é o fim do arco. */
    uv[i * 2 + 1] = (z + outer) / outer;
  }

  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/**
 * Anel usinado — o perfil que o `TorusGeometry` não dá: aresta viva,
 * parede reta, furo central limpo.
 */
export function ringGeometry(
  outer: number,
  inner: number,
  depth: number,
  segments = 64,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.12,
    bevelSize: depth * 0.12,
    bevelSegments: 2,
    curveSegments: segments,
  });

  /* O shape nasce no plano XY; o relógio empilha no eixo Y. */
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -depth / 2, 0);
  return geo;
}

/** Meia-lua do rotor: um anel cortado em 180°, com o pivô no centro. */
export function rotorGeometry(
  outer: number,
  inner: number,
  depth: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI, false);
  shape.absarc(0, 0, inner, Math.PI, 0, true);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.2,
    bevelSize: depth * 0.2,
    bevelSegments: 2,
    curveSegments: 96,
  });

  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -depth / 2, 0);
  return geo;
}
