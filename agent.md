# Regras Para Alterações No Código

## Organização De Gráficos

Sempre que uma nova funcionalidade, gráfico, filtro ou análise for adicionada ao dashboard:

- Verificar primeiro qual é o tipo e o objetivo do gráfico.
- Inserir o gráfico no setor correto do site, respeitando a organização visual já existente:
  - produtos;
  - operação, tempo, regiões e categorias;
  - estatística e análises avançadas;
  - ranking.
- Manter a mesma ordem lógica também no código, colocando novas funções, configurações e renderizações nos módulos correspondentes.
- Evitar misturar responsabilidades: processamento de dados deve ficar em `src/data`, cálculos estatísticos em `src/analytics`, criação de gráficos em `src/charts`, renderização auxiliar de UI em `src/ui` e orquestração em `src/main.js`.
- Antes de finalizar, conferir se a posição do gráfico no site e a posição da implementação no código continuam coerentes entre si.

O objetivo é preservar a setorização do dashboard, manter a leitura do código previsível e evitar que novas adições quebrem a ordem visual ou arquitetural do projeto.
