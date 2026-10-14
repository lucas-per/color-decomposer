# Duas cores: desenho

Status: aprovado. Entrega 1 (motor e testes) feita; entrega 2 (interface) pendente. Data: 2026-10-14.

## Objetivo

Deixar a pessoa montar a paleta a partir de duas cores, sem precisar saber a que nível cada uma pertence. Exemplo: um off-white de fundo (`#FCFBF2`) e um amarelo de destaque (`#FFD23F`).

Motivo: com uma cor só, os tons herdam o matiz e a intensidade dela. Com o off-white (matiz 101°, intensidade 0,012), até a Cor viva gera tons escuros em oliva. A segunda cor dá o matiz e a intensidade dos tons do meio e dos escuros.

## Papéis, não níveis

A pessoa diz o que a cor é. O motor decide onde ela fica.

- **Cor principal:** ocupa o nível padrão do preset (100), como a cor base no Aplica.
- **Cor de apoio:** vai para o nível de claridade mais próxima (a mesma regra do Auto). Pode ser mais clara ou mais escura que a principal.

Os níveis aparecem só como resultado ("Fica no nível 20").

## Motor

- Uma opção nova, `anchors: [{ hex, level? }]`, com as cores de apoio. A cor principal (`base`) fica no `brandLevel`; sem `level`, a de apoio vai para o nível de claridade mais próxima. Implementado em `src/anchors.js`.
- Com uma âncora, o resultado é idêntico ao de hoje. Sem nenhuma extensão, o Aplica continua igual ao oficial (3.23.4).
- Com duas âncoras, a claridade em função do nível deixa de ser uma reta: passa pelos pontos das duas cores, pelo tom mais claro e pelo mais escuro. Interpolação monotônica (sem subir e descer no meio), para não ter quebras.
- Entre as âncoras, a intensidade e o matiz se interpolam (o matiz pelo caminho mais curto no círculo).
- Depois da última âncora, vale a regra atual a partir dela (matiz e intensidade da última âncora, claridade até o mais escuro). Antes da primeira, o mesmo, em direção ao mais claro.
- Modo escuro: os níveis das âncoras são espelhados.
- Dois níveis iguais: o motor devolve um aviso (`type: 'anchors'`, `reason: 'same-level'`) e usa só a cor principal. Se a de apoio fizesse a claridade subir, o aviso é `reason: 'order'` e ela é ignorada.
- Cor viva: não se aplica com cor de apoio.
- Neutros e estados de comportamento: vêm da cor principal (o estado normal fica sempre no 100).

## Interface

- Botão "Adicionar cor de apoio", abaixo do campo da cor. Mostra um segundo campo (hex e seletor) com botão para remover.
- Status sob o campo: "Fica no nível 20."
- Os três sliders (claridade, intensidade e matiz) editam a cor escolhida em uma alternância "Cor principal | Cor de apoio".
- Auto, Cor viva e o alternador "Usar sua cor no estado normal" ficam desabilitados ou ocultos com duas cores, porque os níveis passam a ser definidos pelos papéis.
- Aviso de dois níveis iguais: caixa de warning, como o aviso de tons parecidos. Texto proposto: "As duas cores caem no mesmo nível (20). Escolha uma cor de apoio mais clara ou mais escura."
- Estado na URL: `support=<hex>`. Mudar a cor principal não apaga a de apoio.

## Testes

- Motor: uma âncora idêntica a hoje; âncoras exatas nos níveis; claridade nunca sobe quando o nível sobe; todos os tons dentro do sRGB; dois níveis iguais avisam; modo escuro espelhado; Aplica sem extensões idêntico ao oficial.
- Interface (navegador): adicionar e remover a cor de apoio, status do nível, aviso de níveis iguais, URL, claro, escuro e mobile, axe.

## Entregas

1. Motor e testes.
2. Interface.

## Decisões abertas

- **Dois níveis iguais:** o desenho usa só a cor principal e avisa. Alternativa: empurrar a de apoio para o nível vizinho.
- **Interpolação:** monotônica suave. Alternativa: linhas retas entre âncoras.
- **Nome do campo:** hoje é "Cor da marca". Com papéis, os nomes viram "Cor principal" e "Cor de apoio". O nome da cor única fica para decidir (ver `docs/backlog.md`).

## Fora do escopo

- Escolher o nível de cada cor à mão.
- Mais de duas cores (o motor aceita uma lista, a interface só duas).
- Deriva de matiz automática: ver `docs/backlog.md`.
