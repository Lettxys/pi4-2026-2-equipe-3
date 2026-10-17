using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace System.Api.Migrations
{
    /// <inheritdoc />
    public partial class CriarIndicesDeFiltro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_token_revogado_expira_em",
                table: "token_revogado",
                column: "expira_em");

            migrationBuilder.CreateIndex(
                name: "ix_processo_usuario_id_todos",
                table: "processo",
                column: "usuario_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_token_revogado_expira_em",
                table: "token_revogado");

            migrationBuilder.DropIndex(
                name: "ix_processo_usuario_id_todos",
                table: "processo");
        }
    }
}
