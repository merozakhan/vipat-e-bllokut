import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search" component={SearchPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
