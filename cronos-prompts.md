# CRONOS — prompts de regeneração de assets

Gere em qualquer ferramenta (o rotor veio do ChatGPT e foi o melhor recorte de
todos). Salve os PNGs na raiz do projeto e me avise — o resto do pipeline
(recorte, alpha, escala, webp) é automático.

Regras que valem para TODOS os prompts:
- fundo **liso e uniforme** (o recorte é automático; degradê e vinheta atrapalham)
- objeto **inteiro dentro do quadro, com margem** — nada encostando na borda
- **frontal, de cima** (top-down) — é o ângulo que a cena usa; peça em ¾ entorta
- paleta fria, sem dourado, sem tons quentes

---

## 1. Relógio montado — PRIORIDADE (alça cortada + borda esfarelada)

> Luxury skeleton wristwatch seen from directly above, perfectly frontal
> top-down view, complete watch fully inside the frame with generous margin on
> all sides, nothing cropped. Polished steel case with lugs and crown, open
> skeleton dial showing the movement, steel indices and hands. Cold desaturated
> grading, no gold, no warm tones. Solid flat dark charcoal background, clean
> sharp edges, isolated object, no motion blur, no text, no logo, no watermark.

O still atual nasceu com a alça esquerda colada na borda — pixel cortado não se
inventa. A margem no prompt é o que evita isso.

## 2. Fundo (caseback) — PRIORIDADE (texto "IWC" alucinado + perspectiva torta)

> Watch exhibition caseback seen from DIRECTLY ABOVE, perfectly frontal
> top-down view, perfectly concentric circles: a steel ring with a clear
> sapphire glass window in the center showing a skeletonized automatic
> movement, knurled notches around the outer edge. NO text, NO engraving with
> letters, clean engraved concentric rings only. Cold desaturated grading, only
> silver and steel tones, no gold, no red jewels. The single caseback alone,
> floating, centered, complete inside the frame with margin. Solid flat warm
> off-white background (#F2F0EB), soft even lighting, ultra sharp macro product
> photography, no watermark.

O atual tem "IWC CALIBER / WATER RESISTANT" gravado (marca de concorrente — não
pode existir nem em teste publicado) e foi fotografado em ângulo, por isso os
anéis saem descentrados no disco ("torto"). `DIRECTLY ABOVE` + `perfectly
concentric` são as palavras que consertam.

## 3. Mostrador — opcional (o atual funciona)

> A flat circular watch dial seen from directly above, perfectly frontal
> top-down view, cold slate grey galvanized brass, completely blank with no
> indices, no numerals, no hands, subtle fine-grained matte texture, one small
> circular aperture near the 6 o'clock position. The single flat disc alone,
> centered, complete inside the frame with margin. Solid flat warm off-white
> background (#F2F0EB), soft even light, ultra sharp, no text, no watermark.

## 4. Movimento — opcional (o atual funciona)

> A skeletonized mechanical watch movement seen from directly above, perfectly
> frontal top-down view, exposed gear train, mainspring barrel, balance wheel,
> tourbillon cage at 6 o'clock, rhodium-plated bridges with Geneva striping.
> Only silver and steel tones, desaturated ruby jewels, no gold, no brass. The
> bare movement alone, centered, complete inside the frame with margin. Solid
> flat warm off-white background (#F2F0EB), soft even light, ultra sharp macro
> horology photography, no text, no watermark.

---

# As quatro peças do catálogo

Estas não são peças da anatomia: são os quatro relógios inteiros que ilustram os
cards do catálogo. Valem as mesmas regras acima (top-down, inteiro no quadro com
margem, paleta fria), com **três exigências próprias**:

- **fundo escuro** — e ele NÃO é recortado. Diferente das peças da anatomia,
  estas entram sangradas: a foto é o painel do card. Vinheta e luz montada em
  volta do objeto são bem-vindas, é o que dá corpo ao quadro. Fundo claro não
  serve: o card mora numa seção clara e é o escuro que faz o metal frio saltar.
- **duas vistas por peça**: a frontal e uma **de lado** (perfil, mostrando a
  espessura da caixa e a coroa). O card abre na segunda quando a mão chega. A
  segunda tem que ser a MESMA peça, mesma luz, mesmo fundo — é a peça girando,
  não outra fotografia.
- **o material é a única variável entre peças.** Mesma caixa, mesmo
  enquadramento, mesma luz nas quatro. O que distingue Ardósia de Névoa é a liga
  e o acabamento — não a pose. Ângulos diferentes fazem o grid 2×2 virar colagem.
- **sem texto, sem logotipo, sem marca de terceiro** gravado em lugar nenhum
  (o caseback já nasceu com "IWC" alucinado uma vez).

Para a vista de lado, acrescente ao prompt da peça: *"seen from the side, strict
profile view, showing the case thickness and the crown, same watch, same
lighting, same dark background."*

## CR-01 · Ardósia — aço 904L, mostrador ardósia sem índices

> Luxury wristwatch seen from directly above, perfectly frontal top-down view,
> complete watch fully inside the frame with generous margin on all sides,
> nothing cropped. Polished 904L stainless steel case with lugs and crown,
> 39 mm. Solid slate-grey stone dial, hand-washed matte mineral texture,
> completely without indices and without numerals, only two slim polished steel
> hands. Cold desaturated grading, no gold, no warm tones. Solid flat dark
> charcoal background, clean sharp edges, isolated object, ultra sharp macro
> product photography, no text, no logo, no watermark.

## CR-02 · Névoa — titânio grau 5 jateado

> Luxury wristwatch seen from directly above, perfectly frontal top-down view,
> complete watch fully inside the frame with generous margin on all sides,
> nothing cropped. Grade 5 titanium case with a fully bead-blasted matte finish
> that scatters reflection, 40 mm, lugs and crown. Pale cold grey dial with a
> fine misty gradient, slim brushed steel hands, minimal indices. Light, airy,
> almost weightless metal. Cold desaturated grading, no gold, no warm tones.
> Solid flat dark charcoal background, clean sharp edges, isolated object, ultra
> sharp macro product photography, no text, no logo, no watermark.

## CR-03 · Obsidiana — cerâmica preta, tourbillon às 6h

> Luxury wristwatch seen from directly above, perfectly frontal top-down view,
> complete watch fully inside the frame with generous margin on all sides,
> nothing cropped. Black polished ceramic case, 41 mm, lugs and crown. Open
> skeleton dial in deep black revealing the movement, with a visible tourbillon
> cage at the 6 o'clock position, rhodium bridges, steel hands and indices
> catching a cold highlight against the black. Cold desaturated grading, no
> gold, no warm tones, no coloured jewels. Solid flat dark charcoal background,
> clean sharp edges, isolated object, ultra sharp macro horology photography,
> no text, no logo, no watermark.

## CR-04 · Salitre — platina 950, ponte polida em espelho

> Luxury wristwatch seen from directly above, perfectly frontal top-down view,
> complete watch fully inside the frame with generous margin on all sides,
> nothing cropped. Platinum 950 case, 41 mm, dense bright white metal with a
> mirror-polished finish, lugs and crown. Open skeleton dial with a visible
> tourbillon at 6 o'clock whose bridge is mirror-polished to a sharp specular
> white, brilliant against the darker movement behind it. Cold desaturated
> grading, silver and platinum tones only, no gold, no warm tones. Solid flat
> dark charcoal background, clean sharp edges, isolated object, ultra sharp
> macro horology photography, no text, no logo, no watermark.

---

Depois de salvar os arquivos na raiz, os nomes esperados em
`scripts/textures.mjs` (const `SOURCES` / `ASSEMBLED` / `WATCHES`) devem ser
atualizados para os novos arquivos e o script roda com `node scripts/textures.mjs`.
As quatro do catálogo saem em `public/pecas/cr-0N.webp`, recortadas com alpha.
Ao trocar textura da anatomia, subir o `?v=` em `parts.tsx` e `assembled.tsx`
para furar o cache do navegador.
