# Relatorio Tecnico - Layout A/B do Dashboard

## 1. O que foi alterado

Foi criada uma alternancia visual compacta entre duas versoes do dashboard:

- Layout A: mantem a organizacao atual do sistema.
- Layout B: exibe uma barra superior com filtros em destaque antes dos cards e graficos.

A escolha do usuario e salva no `localStorage` com a chave `dashboard-layout-version`, permitindo manter o layout escolhido ao recarregar a pagina.

## 2. Arquivos modificados

- `index.html`: recebeu o seletor de layout A/B no topo do dashboard e a barra superior de filtros da Versao B.
- `src/main.js`: manteve a renderizacao principal do dashboard e passou a usar modulos dedicados para layout A/B e teste de hipotese.
- `src/ui/layoutAb.js`: centraliza a alternancia A/B, a persistencia da escolha, o reposicionamento dos filtros de periodo e a area recolhida de estatisticas secundarias no Layout B.
- `src/ui/hypothesisPanel.js`: renderiza o teste de hipotese somente quando o painel final e aberto pela primeira vez.
- `src/style.css`: recebeu os estilos condicionados ao Layout B, incluindo filtros compactos, cards principais destacados, estatisticas recolhidas e responsividade.
- O Layout B recebeu uma repaginacao executiva, com fundo mais neutro, cards corporativos, secoes com hierarquia mais clara, graficos com bordas/sombras mais discretas e controles mais compactos.
- `src/data/salesData.js`: passou a manter registros processados para calcular o resumo dos filtros da Versao B.
- A secao de teste de hipotese foi movida para o final da pagina e ficou recolhida em um botao, para nao competir visualmente com as analises de vendas.

## 3. Como funciona a troca entre Versao A e Versao B

O usuario escolhe entre `Layout A` e `Layout B` em um botao segmentado abaixo do alternador de modo claro/escuro.

Quando o Layout A esta ativo, o dashboard preserva a organizacao atual. Quando o Layout B esta ativo, a barra de filtros aparece acima dos cards principais, os campos de data do periodo ficam nessa barra e os cards estatisticos secundarios ficam recolhidos.

Essa troca altera apenas a organizacao visual da tela. Os dados, cards e graficos continuam usando a mesma base processada pelo dashboard.

## 4. Como a Versao B organiza os filtros

Na Versao B, os filtros principais ficam reunidos em uma area destacada:

- Regiao;
- Categoria;
- Produto;
- Periodo.

Os filtros de regiao, categoria e produto atualizam um resumo do recorte selecionado. O filtro de categoria tambem sincroniza as analises por categoria ja existentes no dashboard. O filtro de periodo usa os campos de data inicial e data final para manter a analise por intervalo.

## 5. Como testar

1. Execute o projeto com `npm run dev`.
2. Abra o endereco exibido pelo Vite no navegador.
3. Use o seletor `Layout A` e `Layout B`.
4. Confirme que o Layout A mantem a tela original.
5. Confirme que o Layout B mostra a barra superior de filtros antes dos cards.
6. Altere regiao, categoria, produto e periodo na barra superior.
7. No Layout B, confira se apenas os quatro cards principais ficam destacados e se as estatisticas secundarias aparecem ao abrir o botao correspondente.
8. Abra o botao final de testes de hipotese e confira se os dados sao preenchidos nesse momento.
9. Recarregue a pagina e confira se o layout escolhido permanece ativo.
