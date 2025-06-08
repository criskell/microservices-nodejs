## Anotações
### Blue-Green Deployment

- As migrations devem serem retrocompatíveis.
  - modo incorreto
    - v1: tá usando first_name e last_name.
    - v2: tá usando full_name.
    - a migration apaga first name e last name.
    - enquanto a v2 está sendo implantada nesse modo blue-green, a v1 continua existindo, mas agora não está mais vendo o first_name e last_name.
  - modo correto
    - a migration cria full name e mantém first e last name.
    - em um novo deploy irá apagar a coluna first name e last name.