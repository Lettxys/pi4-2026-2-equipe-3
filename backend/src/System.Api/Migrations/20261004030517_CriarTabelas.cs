using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace System.Api.Migrations
{
    /// <inheritdoc />
    public partial class CriarTabelas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "etapa",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipo_perfil = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ordem = table.Column<short>(type: "smallint", nullable: false),
                    titulo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    orgao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    explicacao_simplificada = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_etapa", x => x.id);
                    table.CheckConstraint("ck_etapa_orgao", "orgao IN ('CLINIC', 'DETRAN', 'RECEITA_FEDERAL', 'SEFAZ', 'DEALERSHIP')");
                    table.CheckConstraint("ck_etapa_tipo_perfil", "tipo_perfil IN ('PCD_DRIVER', 'PCD_NON_DRIVER')");
                });

            migrationBuilder.CreateTable(
                name: "tipo_documento",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    codigo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    dono = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    regra_validade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    validade_dias = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tipo_documento", x => x.id);
                    table.CheckConstraint("ck_tipo_documento_dono", "dono IN ('HOLDER', 'DRIVER')");
                    table.CheckConstraint("ck_tipo_documento_regra_validade", "regra_validade IN ('DAYS_FROM_ISSUE', 'PRINTED_EXPIRY', 'NONE')");
                });

            migrationBuilder.CreateTable(
                name: "token_revogado",
                columns: table => new
                {
                    jti = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    expira_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_token_revogado", x => x.jti);
                });

            migrationBuilder.CreateTable(
                name: "usuario",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome_completo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    cpf = table.Column<string>(type: "character(11)", fixedLength: true, maxLength: 11, nullable: true),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    data_nascimento = table.Column<DateOnly>(type: "date", nullable: true),
                    senha_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    papel = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    cep = table.Column<string>(type: "character(8)", fixedLength: true, maxLength: 8, nullable: true),
                    logradouro = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    numero = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    complemento = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    bairro = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    cidade = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    uf = table.Column<string>(type: "character(2)", fixedLength: true, maxLength: 2, nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    anonimizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuario", x => x.id);
                    table.CheckConstraint("ck_usuario_papel", "papel IN ('USER', 'ADMIN')");
                });

            migrationBuilder.CreateTable(
                name: "etapa_acao",
                columns: table => new
                {
                    etapa_id = table.Column<short>(type: "smallint", nullable: false),
                    ordem = table.Column<short>(type: "smallint", nullable: false),
                    descricao = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_etapa_acao", x => new { x.etapa_id, x.ordem });
                    table.ForeignKey(
                        name: "fk_etapa_acao_etapa_etapa_id",
                        column: x => x.etapa_id,
                        principalTable: "etapa",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "etapa_documento",
                columns: table => new
                {
                    etapa_id = table.Column<short>(type: "smallint", nullable: false),
                    tipo_documento_id = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_etapa_documento", x => new { x.etapa_id, x.tipo_documento_id });
                    table.ForeignKey(
                        name: "fk_etapa_documento_etapa_etapa_id",
                        column: x => x.etapa_id,
                        principalTable: "etapa",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_etapa_documento_tipo_documento_tipo_documento_id",
                        column: x => x.tipo_documento_id,
                        principalTable: "tipo_documento",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quiz",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<long>(type: "bigint", nullable: true),
                    token_anonimo = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo_perfil = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    tipo_deficiencia = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    elegivel = table.Column<bool>(type: "boolean", nullable: true),
                    consentimento_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    vinculado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_quiz", x => x.id);
                    table.CheckConstraint("ck_quiz_tipo_deficiencia", "tipo_deficiencia IN ('PHYSICAL', 'VISUAL', 'HEARING', 'INTELLECTUAL', 'AUTISM', 'DOWN_SYNDROME')");
                    table.CheckConstraint("ck_quiz_tipo_perfil", "tipo_perfil IN ('PCD_DRIVER', 'PCD_NON_DRIVER')");
                    table.ForeignKey(
                        name: "fk_quiz_usuario_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuario",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "token_redefinicao_senha",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<long>(type: "bigint", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    expira_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    usado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_token_redefinicao_senha", x => x.id);
                    table.ForeignKey(
                        name: "fk_token_redefinicao_senha_usuario_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuario",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "processo",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<long>(type: "bigint", nullable: false),
                    quiz_id = table.Column<long>(type: "bigint", nullable: true),
                    tipo_perfil = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tipo_deficiencia = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    cnh_numero = table.Column<string>(type: "character(11)", fixedLength: true, maxLength: 11, nullable: true),
                    cnh_validade = table.Column<DateOnly>(type: "date", nullable: true),
                    cnh_possui_restricao = table.Column<bool>(type: "boolean", nullable: true),
                    veiculo_modelo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    veiculo_valor = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    data_prevista_compra = table.Column<DateOnly>(type: "date", nullable: true),
                    data_ultima_compra_isenta = table.Column<DateOnly>(type: "date", nullable: true),
                    aceite_zero_km_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    concluido_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_processo", x => x.id);
                    table.CheckConstraint("ck_processo_cnh", "tipo_perfil = 'PCD_DRIVER' OR (cnh_numero IS NULL AND cnh_validade IS NULL AND cnh_possui_restricao IS NULL)");
                    table.CheckConstraint("ck_processo_status", "status IN ('DRAFT', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')");
                    table.CheckConstraint("ck_processo_tipo_deficiencia", "tipo_deficiencia IN ('PHYSICAL', 'VISUAL', 'HEARING', 'INTELLECTUAL', 'AUTISM', 'DOWN_SYNDROME')");
                    table.CheckConstraint("ck_processo_tipo_perfil", "tipo_perfil IN ('PCD_DRIVER', 'PCD_NON_DRIVER')");
                    table.ForeignKey(
                        name: "fk_processo_quiz_quiz_id",
                        column: x => x.quiz_id,
                        principalTable: "quiz",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_processo_usuario_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuario",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quiz_resposta",
                columns: table => new
                {
                    quiz_id = table.Column<long>(type: "bigint", nullable: false),
                    codigo_pergunta = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    resposta = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_quiz_resposta", x => new { x.quiz_id, x.codigo_pergunta });
                    table.ForeignKey(
                        name: "fk_quiz_resposta_quiz_quiz_id",
                        column: x => x.quiz_id,
                        principalTable: "quiz",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "condutor_autorizado",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    processo_id = table.Column<long>(type: "bigint", nullable: false),
                    usuario_id = table.Column<long>(type: "bigint", nullable: true),
                    posicao = table.Column<short>(type: "smallint", nullable: false),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    cpf = table.Column<string>(type: "character(11)", fixedLength: true, maxLength: 11, nullable: false),
                    cnh_numero = table.Column<string>(type: "character(11)", fixedLength: true, maxLength: 11, nullable: false),
                    cnh_validade = table.Column<DateOnly>(type: "date", nullable: true),
                    parentesco = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_condutor_autorizado", x => x.id);
                    table.CheckConstraint("ck_condutor_autorizado_parentesco", "parentesco IN ('FATHER', 'MOTHER', 'SPOUSE', 'SIBLING', 'CHILD', 'OTHER')");
                    table.CheckConstraint("ck_condutor_autorizado_posicao", "posicao BETWEEN 1 AND 3");
                    table.ForeignKey(
                        name: "fk_condutor_autorizado_processo_processo_id",
                        column: x => x.processo_id,
                        principalTable: "processo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_condutor_autorizado_usuario_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuario",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "dossie",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    processo_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    caminho_arquivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    total_documentos = table.Column<int>(type: "integer", nullable: false),
                    gerado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_dossie", x => x.id);
                    table.CheckConstraint("ck_dossie_status", "status IN ('GENERATED')");
                    table.ForeignKey(
                        name: "fk_dossie_processo_processo_id",
                        column: x => x.processo_id,
                        principalTable: "processo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "processo_etapa",
                columns: table => new
                {
                    processo_id = table.Column<long>(type: "bigint", nullable: false),
                    etapa_id = table.Column<short>(type: "smallint", nullable: false),
                    status = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    validada_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_processo_etapa", x => new { x.processo_id, x.etapa_id });
                    table.CheckConstraint("ck_processo_etapa_status", "status IN ('LOCKED', 'IN_PROGRESS', 'VALIDATED')");
                    table.ForeignKey(
                        name: "fk_processo_etapa_etapa_etapa_id",
                        column: x => x.etapa_id,
                        principalTable: "etapa",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_processo_etapa_processo_processo_id",
                        column: x => x.processo_id,
                        principalTable: "processo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "documento",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    processo_id = table.Column<long>(type: "bigint", nullable: false),
                    condutor_autorizado_id = table.Column<long>(type: "bigint", nullable: true),
                    tipo_documento_id = table.Column<short>(type: "smallint", nullable: false),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    data_emissao = table.Column<DateOnly>(type: "date", nullable: true),
                    data_validade = table.Column<DateOnly>(type: "date", nullable: true),
                    caminho_arquivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    nome_original = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    tipo_conteudo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    tamanho_bytes = table.Column<int>(type: "integer", nullable: false),
                    enviado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_documento", x => x.id);
                    table.CheckConstraint("ck_documento_data", "data_emissao IS NOT NULL OR data_validade IS NOT NULL");
                    table.CheckConstraint("ck_documento_status", "status IN ('PENDING', 'VALID', 'EXPIRED', 'REJECTED')");
                    table.CheckConstraint("ck_documento_tamanho_bytes", "tamanho_bytes <= 10485760");
                    table.CheckConstraint("ck_documento_tipo_conteudo", "tipo_conteudo IN ('application/pdf', 'image/jpeg', 'image/png')");
                    table.ForeignKey(
                        name: "fk_documento_condutor_autorizado_condutor_autorizado_id",
                        column: x => x.condutor_autorizado_id,
                        principalTable: "condutor_autorizado",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_documento_processo_processo_id",
                        column: x => x.processo_id,
                        principalTable: "processo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_documento_tipo_documento_tipo_documento_id",
                        column: x => x.tipo_documento_id,
                        principalTable: "tipo_documento",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_condutor_autorizado_processo_id_cpf",
                table: "condutor_autorizado",
                columns: new[] { "processo_id", "cpf" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_condutor_autorizado_processo_id_posicao",
                table: "condutor_autorizado",
                columns: new[] { "processo_id", "posicao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_condutor_autorizado_usuario_id",
                table: "condutor_autorizado",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_documento_condutor_autorizado_id",
                table: "documento",
                column: "condutor_autorizado_id");

            migrationBuilder.CreateIndex(
                name: "ix_documento_processo_id",
                table: "documento",
                column: "processo_id");

            migrationBuilder.CreateIndex(
                name: "ix_documento_tipo_documento_id",
                table: "documento",
                column: "tipo_documento_id");

            migrationBuilder.CreateIndex(
                name: "ix_dossie_processo_id",
                table: "dossie",
                column: "processo_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_etapa_tipo_perfil_ordem",
                table: "etapa",
                columns: new[] { "tipo_perfil", "ordem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_etapa_documento_tipo_documento_id",
                table: "etapa_documento",
                column: "tipo_documento_id");

            migrationBuilder.CreateIndex(
                name: "ix_processo_quiz_id",
                table: "processo",
                column: "quiz_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_processo_usuario_id",
                table: "processo",
                column: "usuario_id",
                unique: true,
                filter: "status <> 'COMPLETED'");

            migrationBuilder.CreateIndex(
                name: "ix_processo_etapa_etapa_id",
                table: "processo_etapa",
                column: "etapa_id");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_token_anonimo",
                table: "quiz",
                column: "token_anonimo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_quiz_usuario_id",
                table: "quiz",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_tipo_documento_codigo",
                table: "tipo_documento",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_token_redefinicao_senha_token_hash",
                table: "token_redefinicao_senha",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_token_redefinicao_senha_usuario_id",
                table: "token_redefinicao_senha",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_usuario_cpf",
                table: "usuario",
                column: "cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_usuario_email",
                table: "usuario",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "documento");

            migrationBuilder.DropTable(
                name: "dossie");

            migrationBuilder.DropTable(
                name: "etapa_acao");

            migrationBuilder.DropTable(
                name: "etapa_documento");

            migrationBuilder.DropTable(
                name: "processo_etapa");

            migrationBuilder.DropTable(
                name: "quiz_resposta");

            migrationBuilder.DropTable(
                name: "token_redefinicao_senha");

            migrationBuilder.DropTable(
                name: "token_revogado");

            migrationBuilder.DropTable(
                name: "condutor_autorizado");

            migrationBuilder.DropTable(
                name: "tipo_documento");

            migrationBuilder.DropTable(
                name: "etapa");

            migrationBuilder.DropTable(
                name: "processo");

            migrationBuilder.DropTable(
                name: "quiz");

            migrationBuilder.DropTable(
                name: "usuario");
        }
    }
}
