# Teste de Hipoteses da Melhoria do Dashboard

## 1. Melhoria implementada

O dashboard recebeu melhorias de usabilidade e organizacao visual. Foram implementados:

- modo escuro;
- reorganizacao visual por secoes para deixar o conteudo mais limpo;
- filtros de regiao e produto em graficos que antes eram apenas gerais.

Para o teste estatistico, a melhoria analisada foi principalmente o impacto dos filtros e da reorganizacao visual no tempo necessario para encontrar informacoes.

## 2. Hipoteses H0 e H1

**H0:** As melhorias implementadas nao reduziram o tempo necessario para encontrar informacoes no dashboard.

**H1:** As melhorias implementadas reduziram o tempo necessario para encontrar informacoes no dashboard.

## 3. Dados coletados

A coleta foi feita com 2 participantes. Cada participante realizou 4 tarefas de busca no dashboard, antes e depois das melhorias, totalizando 8 registros de tempo.

As tarefas realizadas foram:

1. Encontrar a regiao com menor lucro.
2. Encontrar o produto com maior venda.
3. Identificar a categoria com maior lucro.
4. Localizar uma regiao ou produto com baixo desempenho.

Como o dashboard possui uma estrutura simples e objetiva, os tempos registrados foram relativamente baixos, variando entre 17 e 24 segundos antes das melhorias e entre 11 e 16 segundos apos as melhorias.

| Registro | Participante | Tarefa | Antes da melhoria (s) | Depois da melhoria (s) | Diferenca (s) |
|---:|---|---|---:|---:|---:|
| 1 | Participante 1 | Encontrar a regiao com menor lucro | 22 | 15 | 7 |
| 2 | Participante 1 | Encontrar o produto com maior venda | 20 | 14 | 6 |
| 3 | Participante 1 | Identificar a categoria com maior lucro | 18 | 12 | 6 |
| 4 | Participante 1 | Localizar regiao/produto com baixo desempenho | 24 | 16 | 8 |
| 5 | Participante 2 | Encontrar a regiao com menor lucro | 21 | 14 | 7 |
| 6 | Participante 2 | Encontrar o produto com maior venda | 19 | 13 | 6 |
| 7 | Participante 2 | Identificar a categoria com maior lucro | 17 | 11 | 6 |
| 8 | Participante 2 | Localizar regiao/produto com baixo desempenho | 23 | 15 | 8 |

## 4. Calculo do P-Valor

Foi utilizado teste t pareado unilateral a direita, com:

- diferenca = tempoAntes - tempoDepois
- H1: media das diferencas > 0

Formula aplicada:

`t = d_bar / (sd / sqrt(n))`

Onde:

- `d_bar` = media das diferencas;
- `sd` = desvio padrao amostral das diferencas;
- `n` = numero de registros.

Resultados calculados pelo sistema:

| Metrica | Valor |
|---|---:|
| Media antes | 20,50 s |
| Media depois | 13,75 s |
| Media das diferencas | 6,75 s |
| Desvio padrao das diferencas | 0,89 s |
| Numero de registros (n) | 8 |
| Graus de liberdade (gl) | 7 |
| Valor de t | 21,5385 |
| P-Valor | < 0,0001 |
| Alpha adotado | 0,05 |

## 5. Interpretacao do resultado

Regra de decisao:

- se `P-Valor < 0,05`, rejeitamos H0;
- se `P-Valor >= 0,05`, nao rejeitamos H0.

Como o P-Valor calculado foi menor que 0,05, a decisao estatistica e:

**H0 rejeitada.**

Interpretacao:

Ha evidencia estatistica de que as melhorias implementadas reduziram o tempo necessario para encontrar informacoes no dashboard.

## 6. Evidencia da mensagem exibida no dashboard

Inserir aqui o print da secao implementada no dashboard:

![Mensagem exibida no dashboard](./print-teste-hipotese-dashboard.png)

A mensagem exibida no dashboard apresenta:

- comparacao entre P-Valor e alpha = 0,05;
- decisao sobre H0;
- justificativa em linguagem simples sobre o resultado.
