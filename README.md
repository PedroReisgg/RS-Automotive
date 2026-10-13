# RS Automotive — site institucional

Site estático (Vite + TypeScript + Tailwind CSS) com um Audi R8 3D procedural em three.js
(sem argolas, logos ou placa), hero e cena de rolagem em 8 etapas no mesmo canvas
(GSAP ScrollTrigger + SplitText + DrawSVG), rolagem suave com Lenis e micro-interações com Motion.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera a pasta dist/ (pronta para hospedar em qualquer servidor estático)
```

## Estrutura

- `index.html` — todas as seções, SEO e dados estruturados (AutoRepair).
- `src/style.css` — paleta oficial e componentes.
- `src/data.ts` — telefones, WhatsApp, serviços e textos das 8 etapas.
- `src/main.ts` — abertura, header, menu, botões (ímã e preenchimento), formulário do WhatsApp, animações de rolagem.
- `src/scene.ts` — timeline única (pin + scrub): hero e as 8 etapas do carro.
- `src/three/r8Body.ts` e `r8Shell.ts` — carroceria do R8 por seções, vidros, faróis, grade, lâmina lateral e rodas.
- `src/three/carModel.ts` — peças internas (bateria, alternador, injeção, partida, cabine, som).
- `src/three/viewer.ts` — renderização, giro do hero, destaques dourados das peças.
- `public/img/etapas/` — imagens estáticas das 8 etapas (usadas sem WebGL ou com movimento reduzido).

## Pendências

- Horário de atendimento (hoje o site diz "consulte pelo WhatsApp").
- Domínio e URL final para as tags Open Graph.
