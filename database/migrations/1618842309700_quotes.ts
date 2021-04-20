import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class Quotes extends BaseSchema {
  protected tableName = "quotes";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("quote_name");
      table.string("symbol");
      table.dateTime("date");
      table.float("open");
      table.float("high");
      table.float("low");
      table.float("close");
      table.float("adj_close");
      table.bigInteger("volume");
      table.timestamps(true);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
