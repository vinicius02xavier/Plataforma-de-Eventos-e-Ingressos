# Decisões de implementação

## 1. Reserva por quantidade

Escolhi o modelo de pista/quantidade em vez do mapa de assentos.

Motivo: o enunciado permite implementar um dos dois modelos. A prioridade foi entregar um fluxo completo e consistente antes de investir a maior parte do tempo em um editor/mapa de assentos.

## 2. SQLite inicialmente

O projeto começa com SQLite para reduzir o atrito de configuração durante a avaliação. Prisma mantém a camada de acesso desacoplada o suficiente para a troca para PostgreSQL.

## 3. Token opaco

O ingresso usa um token aleatório de 32 bytes. O banco recebe apenas SHA-256 desse token.

O QR não deve transportar preço, usuário ou informações confiáveis do ingresso. Essas informações são recuperadas no servidor.

## 4. Pagamento simulado

O pagamento não possui integração financeira porque o requisito permite uma simulação. O objetivo é demonstrar claramente os dois estados: aprovado e recusado.

## 5. Portaria

A portaria precisa saber qual evento está sendo validado. Por isso o endpoint recebe `eventId` junto com o código/token. Isso permite diferenciar um ingresso válido de um ingresso válido para outro evento.

## 6. Concorrência

A reserva decrementa disponibilidade dentro de uma transação. A decisão foi tomada para evitar que duas requisições normais ultrapassem o estoque disponível.

## 7. O que ficou deliberadamente fora

- recuperação de senha;
- nota fiscal;
- revenda;
- e-mail;
- aplicativo nativo;
- pagamentos reais.

Esses itens estão explicitamente fora do escopo obrigatório do desafio ou não agregam tanto valor quanto completar o fluxo principal.
