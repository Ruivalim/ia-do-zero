# Política de segurança

## Superfície

O IA do Zero é um site estático. Não tem backend, não tem banco, não guarda conta de
usuário e não faz nenhuma chamada de rede em tempo de execução — todo cálculo dos
demos roda no navegador do leitor. O único estado persistido é tema, nível de detalhe
e progresso de leitura, tudo em `localStorage` da própria pessoa.

Ou seja: não há dado de usuário para vazar aqui. O que ainda importa:

- XSS via conteúdo MDX ou via renderização de fórmula (KaTeX)
- dependência de build comprometida ou vulnerável
- comprometimento do workflow de publicação no GitHub Pages

## Versões suportadas

Só a versão publicada a partir da branch `main`. Não há releases antigas com suporte.

## Reportando

Duas formas, nesta ordem de preferência:

1. **GitHub Security Advisory** — aba _Security_ do repositório, "Report a
   vulnerability". Fica privado até haver correção.
2. **Email** — r.valim.junior@gmail.com, com `[security]` no assunto.

Inclua o que der: passo a passo para reproduzir, versão/commit, navegador, e o
impacto que você enxerga.

**Não abra issue pública** para vulnerabilidade ainda não corrigida.

## O que esperar

- Confirmação de recebimento em até 5 dias corridos.
- Avaliação e um plano em até 15 dias corridos.
- Crédito no commit ou no advisory, se você quiser.

Este é um projeto pessoal e sem time de plantão: não há SLA, e os prazos acima são
intenção, não garantia.

## Fora de escopo

- Falta de header de segurança em hospedagem de terceiro que não controlamos
- Ataque que exige acesso físico ou navegador já comprometido
- Resultado bruto de scanner automático, sem impacto demonstrado
- **Imprecisão de conteúdo do curso** — isso é bug de conteúdo, não de segurança.
  Abra uma issue normal.
