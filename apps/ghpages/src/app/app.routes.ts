import { Routes } from "@angular/router";
import { PortfolioPage } from "./pages/portfolio/portfolio.page";

export const routes: Routes = [
  {
    path: "",
    component: PortfolioPage,
  },
  { path: "**", redirectTo: "" },
];
