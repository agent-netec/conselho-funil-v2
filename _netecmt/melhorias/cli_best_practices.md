# Guia de Boas Práticas para Uso de CLIs na NETECMT

## 1. Verifique a Versão Antes de Usar

Sempre rode `[cli] --version` para garantir que você está usando a versão mínima especificada no `dependencies.yaml`.

## 2. Consulte o `cli-reference.yaml`

Antes de rodar um comando, verifique a sintaxe correta para o seu ambiente (Bash vs PowerShell).

## 3. Cuidado com Caracteres Especiais no PowerShell

O PowerShell trata aspas e outros caracteres de forma diferente. Sempre use a variante correta do `cli-reference.yaml`.

## 4. Use o `--help`

Na dúvida, rode `[cli] [command] --help` para ver todas as opções disponíveis.

## 5. Não Execute Comandos como Root/Admin

A menos que seja absolutamente necessário, evite rodar CLIs com `sudo` ou como administrador.

## 6. Mantenha suas CLIs Atualizadas

Periodicamente, rode os comandos de atualização do seu gerenciador de pacotes (brew, apt, choco) para manter as CLIs em dia.
