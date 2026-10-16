using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace System.Api.Migrations
{
    /// <inheritdoc />
    public partial class CorrigirFkDocumentoCondutor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_documento_condutor_autorizado_condutor_autorizado_id",
                table: "documento");

            migrationBuilder.DropIndex(
                name: "ix_documento_condutor_autorizado_id",
                table: "documento");

            migrationBuilder.AddUniqueConstraint(
                name: "ak_condutor_autorizado_id_processo_id",
                table: "condutor_autorizado",
                columns: new[] { "id", "processo_id" });

            migrationBuilder.CreateIndex(
                name: "ix_documento_condutor_autorizado_id_processo_id",
                table: "documento",
                columns: new[] { "condutor_autorizado_id", "processo_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_documento_condutor_autorizado",
                table: "documento",
                columns: new[] { "condutor_autorizado_id", "processo_id" },
                principalTable: "condutor_autorizado",
                principalColumns: new[] { "id", "processo_id" },
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_documento_condutor_autorizado",
                table: "documento");

            migrationBuilder.DropIndex(
                name: "ix_documento_condutor_autorizado_id_processo_id",
                table: "documento");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_condutor_autorizado_id_processo_id",
                table: "condutor_autorizado");

            migrationBuilder.CreateIndex(
                name: "ix_documento_condutor_autorizado_id",
                table: "documento",
                column: "condutor_autorizado_id");

            migrationBuilder.AddForeignKey(
                name: "fk_documento_condutor_autorizado_condutor_autorizado_id",
                table: "documento",
                column: "condutor_autorizado_id",
                principalTable: "condutor_autorizado",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
