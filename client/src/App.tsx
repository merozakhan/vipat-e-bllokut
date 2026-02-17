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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import GDPR from "./pages/GDPR";
import Terms from "./pages/Terms";
import CookiePolicy from "./pages/CookiePolicy";
import EditorialPolicy from "./pages/EditorialPolicy";
import Advertise from "./pages/Advertise";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/gdpr" component={GDPR} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/editorial-policy" component={EditorialPolicy} />
      <Route path="/advertise" component={Advertise} />
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
