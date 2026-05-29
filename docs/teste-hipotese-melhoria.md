# Teste de Hipoteses - Dashboard vs Planilha

## 1. Melhoria analisada

A analise compara o tempo necessario para encontrar metricas no dataset cru em planilha com o tempo necessario para encontrar as mesmas informacoes no dashboard.

O dashboard organiza os dados em graficos, cards, filtros e secoes, reduzindo o esforco manual exigido na planilha.

Melhorias consideradas no dashboard:

- modo escuro;
- organizacao da pagina por secoes;
- visualizacao mais limpa e objetiva;
- filtros de regiao e produto nos graficos.

## 2. Hipoteses H0 e H1

**H0:** O dashboard nao reduziu o tempo necessario para encontrar informacoes em comparacao com a pesquisa direta na planilha.

**H1:** O dashboard reduziu o tempo necessario para encontrar informacoes em comparacao com a pesquisa direta na planilha.

## 3. Dados coletados

A coleta foi organizada em 4 registros, cada um correspondente a uma tarefa de busca.

Na planilha, foi considerado 1 participante realizando as buscas no dataset cru.

No dashboard, foi usado o tempo medio dos 2 participantes que ja tinham realizado as mesmas tarefas.

Assim, cada registro compara a busca manual na planilha com a busca visual no dashboard.

Diferenca utilizada: `tempo na planilha - tempo medio no dashboard`.

| Reg. | Tarefa | Planilha (s) | Dashboard medio (s) | Diferenca (s) |
|---:|---|---:|---:|---:|
| 1 | Encontrar a regiao com menor lucro | 105 | 21,5 | 83,5 |
| 2 | Encontrar o produto com maior venda | 98 | 19,5 | 78,5 |
| 3 | Identificar a categoria com maior lucro | 88 | 17,5 | 70,5 |
| 4 | Localizar regiao/produto com baixo desempenho | 120 | 23,5 | 96,5 |

## 4. Calculo do P-Valor

Foi aplicado um teste t pareado unilateral a direita, pois a hipotese alternativa verifica se o dashboard reduziu o tempo de busca em relacao a planilha.

Formula usada:

`t = d_bar / (sd / sqrt(n))`

Onde:

- `d_bar` e a media das diferencas;
- `sd` e o desvio padrao amostral das diferencas;
- `n` e o numero de registros.

| Metrica | Valor |
|---|---:|
| Media na planilha | 102,75 s |
| Media no dashboard | 20,50 s |
| Media das diferencas | 82,25 s |
| Desvio padrao das diferencas | 10,90 s |
| Numero de registros (n) | 4 |
| Graus de liberdade (gl) | 3 |
| Valor de t | 15,08 |
| P-Valor | 0,0003 |
| Alpha adotado | 0,05 |

## 5. Interpretacao do resultado

Regra de decisao:

- se `P-Valor < 0,05`, rejeitamos H0;
- se `P-Valor >= 0,05`, nao rejeitamos H0.

Como o P-Valor foi `0,0003`, menor que `0,05`, a decisao e:

**H0 rejeitada.**

Isso indica que ha evidencia estatistica de que o dashboard reduziu o tempo necessario para encontrar informacoes quando comparado a pesquisa direta na planilha com o dataset cru.

## 6. Evidencia da mensagem no dashboard

A secao do dashboard deve exibir os dados, o resumo dos calculos e a seguinte interpretacao final:

`Decisao: H0 rejeitada. P-Valor = 0,0003 < alpha 0,05. Portanto, ha evidencia estatistica de que o dashboard reduziu o tempo necessario para encontrar informacoes em comparacao com a pesquisa direta na planilha.`
