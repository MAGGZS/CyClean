# Créditos das imagens

Todas as fotos vêm do Unsplash e estão sob a [Unsplash License](https://unsplash.com/license):
uso livre, inclusive comercial, sem atribuição obrigatória. Os créditos abaixo são por cortesia.

| Arquivo | Origem | Uso no site |
| --- | --- | --- |
| `hero-forest.jpg`, `hero-forest-mobile.jpg` | Sebastian Unrau, `photo-1448375240586-882707db888b` | Fundo do hero e da seção Descartar |
| `hero-depth.webp`, `hero-depth-mobile.webp` | Derivadas das duas fotos acima | Camada de profundidade do hero |
| `foliage-wide.jpg`, `foliage.jpg` | Chris Lee, `photo-1518531933037-91b2f5f229cc` | Fundo da seção Por que separar |
| `glass-card.jpg` | Nick Fewings, `photo-1532996122724-e3c354a0b15b` | Card de vidro e miniatura do vídeo do hero |

## Como a camada de profundidade foi feita

`hero-depth*.webp` é a própria foto do hero com canal alfa: ficam opacos só os troncos,
galhos e folhas escuros que estão contra a neblina clara. Essa camada vai por cima da
palavra "SEPARE", então a floresta passa na frente das letras. O scrim de 45% de
`--forest-900` já está aplicado nos pixels, igual ao da foto de fundo.

Se trocar a foto do hero, gere a camada de novo com o mesmo enquadramento e o mesmo scrim,
senão as silhuetas não caem sobre a foto.

## Arquivos que não são mais usados

`sprout-cutout.webp`, `video-thumb.jpg`, `_thumb_hqdefault.jpg` e `_thumb_maxresdefault.jpg`
ficaram do layout anterior. As três miniaturas são de um vídeo do YouTube (não são imagens
livres) e podem ser apagadas.

## Vídeos

O card do hero abre `Go_xijAjy-k`, "Ciclo de Reciclagem da Lata de Alumínio" (GrupoReciclaBR),
pelo player do youtube-nocookie.com. As miniaturas dos vídeos na resposta da IA são carregadas
do próprio YouTube (`i.ytimg.com`).
