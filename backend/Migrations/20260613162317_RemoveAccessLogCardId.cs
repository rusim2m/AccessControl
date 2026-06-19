using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccessControlPlatform.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAccessLogCardId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccessLogs_Cards_CardId",
                table: "AccessLogs");

            migrationBuilder.DropIndex(
                name: "IX_AccessLogs_CardId",
                table: "AccessLogs");

            migrationBuilder.DropColumn(
                name: "CardId",
                table: "AccessLogs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CardId",
                table: "AccessLogs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_CardId",
                table: "AccessLogs",
                column: "CardId");

            migrationBuilder.AddForeignKey(
                name: "FK_AccessLogs_Cards_CardId",
                table: "AccessLogs",
                column: "CardId",
                principalTable: "Cards",
                principalColumn: "Id");
        }
    }
}
