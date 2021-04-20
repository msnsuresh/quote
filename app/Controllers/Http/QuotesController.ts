import Application from "@ioc:Adonis/Core/Application";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import Quote from "App/Models/Quote";
import * as csv from "fast-csv";
import * as fs from "fs";
import { DateTime } from "luxon";

export default class QuotesController {
  public async index({ response }: HttpContextContract) {
    return response.send(Quote.all());
  }

  public async makeQuote() {
    const list = [
      {
        quote_name: "Apple Inc.",
        symbol: "AAPL",
        fileName: "AAPL.csv",
      },
      {
        quote_name: "AMC Entertainment Holdings, Inc.",
        symbol: "AMC",
        fileName: "AMC.csv",
      },
      {
        quote_name: "ARK Innovation ETF",
        symbol: "ARKK",
        fileName: "ARKK.csv",
      },
      {
        quote_name: "BlackBerry Limited",
        symbol: "BB",
        fileName: "BB.csv",
      },
      {
        quote_name: "Breakwave Dry Bulk Shipping ETF",
        symbol: "BDRY",
        fileName: "BDRY.csv",
      },
      {
        quote_name: "Bilibili Inc.",
        symbol: "BILI",
        fileName: "BILI.csv",
      },
      {
        quote_name: "Chewy, Inc.",
        symbol: "CHWY",
        fileName: "CHWY.csv",
      },
      {
        quote_name: "SPDR Dow Jones Industrial Average ETF Trust",
        symbol: "DIA",
        fileName: "DIA.csv",
      },
      {
        quote_name: "Freeport-McMoRan Inc.",
        symbol: "FCX",
        fileName: "FCX.csv",
      },
      {
        quote_name: "GameStop Corp.",
        symbol: "GME",
        fileName: "GME.csv",
      },
      {
        quote_name: "iShares Russell 2000 ETF",
        symbol: "IWM",
        fileName: "IWM.csv",
      },
      {
        quote_name: "Microsoft Corporation",
        symbol: "MSFT",
        fileName: "MSFT.csv",
      },
      {
        quote_name: "Invesco QQQ Trust",
        symbol: "QQQ",
        fileName: "QQQ.csv",
      },
      {
        quote_name: "SPDR S&P 500 ETF Trust",
        symbol: "SPY",
        fileName: "SPY.csv",
      },
    ];

    list.forEach((item) => {
      const newQuotes: any[] = [];
      fs.createReadStream(Application.publicPath(item.fileName))
        .pipe(csv.parse({ headers: true }))
        .on("error", (error) => console.error(error))
        .on("data", (row) => {
          newQuotes.push({
            quote_name: item.quote_name,
            symbol: item.symbol,
            date: DateTime.fromJSDate(new Date(row["Date"])),
            open: parseFloat(row["Open"] || "0"),
            high: parseFloat(row["High"] || "0"),
            low: parseFloat(row["Low"] || "0"),
            close: parseFloat(row["Close"] || "0"),
            adj_close: parseFloat(row["Adj Close"] || "0"),
            volume: parseInt(row["Volume"] === "null" ? "0" : row["Volume"]),
          });
        })
        .on("end", (rowCount: number) =>
          console.log(`Parsed ${rowCount} rows`)
        );
      Quote.createMany(newQuotes);
    });
  }

  public async listQuotes({ request, response }: HttpContextContract) {
    const queryParam = request.get();
    const searchQuery = queryParam.query || "";
    const listOfQuotes = await Database.query()
      .distinct()
      .select("SYMBOL")
      .select("QUOTE_NAME")
      .from("QUOTES")
      .where("SYMBOL", "like", `%${searchQuery}%`);
    return response.send({
      data: listOfQuotes,
    });
  }

  public async historyData({ request, response }: HttpContextContract) {
    const queryParam = request.get();
    const searchQuery = queryParam.query;
    const endDate: Date = new Date(queryParam.endDate);
    const startDate = new Date(queryParam.startDate);
    const page = queryParam.page || 1;
    const limit = queryParam.limit || 10;
    const listOfQuotes = await Database.query()
      .select("DATE")
      .select("OPEN")
      .select("HIGH")
      .select("LOW")
      .select("CLOSE")
      .select("ADJ_CLOSE")
      .select("VOLUME")
      .from("QUOTES")
      .where("SYMBOL", "=", searchQuery)
      .where("DATE", ">=", `${DateTime.fromJSDate(startDate)}`)
      .where("DATE", "<", `${DateTime.fromJSDate(endDate)}`)
      .orderBy("DATE", "desc")
      .paginate(page, limit);
    return response.send(listOfQuotes);
  }

  public async overview({ response, params }: HttpContextContract) {
    const today = DateTime.fromJSDate(new Date());
    const overviewResponse = await Database.rawQuery(`SELECT QUOTE_NAME, 
    SYMBOL, 
    DATE,
    (SELECT MAX(CLOSE) FROM QUOTES WHERE SYMBOL = "${params.symbol}") AS highest,
    (SELECT MIN(CLOSE) FROM QUOTES WHERE SYMBOL = "${params.symbol}") AS lowest,
    OPEN,
    HIGH,
    LOW,
    CLOSE
    FROM QUOTES
    WHERE SYMBOL = "${params.symbol}" AND DATE <= "${today}" ORDER BY DATE DESC LIMIT 1`);

    const prevClose = await Database.rawQuery(
      `SELECT CLOSE FROM QUOTES WHERE SYMBOL = "${params.symbol}" AND DATE < "${overviewResponse[0].date}" ORDER BY DATE DESC LIMIT 1`
    );

    const todayClose = overviewResponse[0].close;
    const yesterdayClose = prevClose[0].close;
    const tred = todayClose > yesterdayClose ? "UP" : "DOWN";
    const difference = Math.abs(todayClose - yesterdayClose);
    const percentage = (difference * 100) / todayClose;

    response.send({
      ...overviewResponse[0],
      prevClose: prevClose[0].close,
      difference,
      percentage,
      tred,
    });
  }

  public async chart({ request, response }: HttpContextContract) {
    const queryParam = request.get();
    const searchQuery = queryParam.query;
    const endDate: Date = new Date(queryParam.endDate);
    const startDate = new Date(queryParam.startDate);
    const listOfQuotes = await Database.query()
      .select("DATE")
      .select("OPEN")
      .select("HIGH")
      .select("LOW")
      .select("CLOSE")
      .select("VOLUME")
      .from("QUOTES")
      .where("SYMBOL", "=", searchQuery)
      .where("DATE", ">=", `${DateTime.fromJSDate(startDate)}`)
      .where("DATE", "<", `${DateTime.fromJSDate(endDate)}`);

    return response.send({
      data: listOfQuotes.map((quote) => {
        const data: any[] = [];
        data.push({ name: "Open", value: quote.open });
        data.push({ name: "High", value: quote.high });
        data.push({ name: "Low", value: quote.low });
        data.push({ name: "Close", value: quote.close });

        return {
          x: new Date(quote.date.valueOf().toString()).valueOf(),
          y: quote.close,
          data,
        };
      }),
    });
  }
}
