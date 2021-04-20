import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class Quote extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public quote_name: String;

  @column()
  public symbol: String;

  @column()
  public date: DateTime;

  @column()
  public open: number;

  @column()
  public high: number;

  @column()
  public low: number;

  @column()
  public close: number;

  @column()
  public adj_close: number;

  @column()
  public volume: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
