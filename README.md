

# LambdaNodeOracle

> Função Lambda em Node.js que realiza conexão com banco de dados oracle e executa uma consulta, embarcado do framework serverless.


## Intro

Este micro serviço usa o framework serverless para realizar o deploy automático no aws.

Certamente você irá precisar da VPC configurada com uma VPN para o seu endpoint Oracle, então lembre-se de inseri-la nas configurações da função Lambda :)


### Setup

> instalar os pacotes

```shell
$ npm install serverless -g
$ npm init
```
> inserindo as credenciais do seu servidor cloud

```shell
$ serverless config credentials -o --provider aws --key *sua chave de acesso* --secret *sua secret key*

```
