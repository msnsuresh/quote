import Route from "@ioc:Adonis/Core/Route";

Route.group(async () => {
  Route.group(() => {
    Route.get("/", "QuotesController.index");
    Route.get("/make", "QuotesController.makeQuote");
    Route.get("/list", "QuotesController.listQuotes");
    Route.get("/history-data", "QuotesController.historyData");
    Route.get("/overview/:symbol", "QuotesController.overview");
    Route.get("/chart", "QuotesController.chart");
  }).prefix("quote");
}).prefix("api");
