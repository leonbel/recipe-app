import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGate from "@/components/AuthGate";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import SetupScreen from "./components/SetupScreen";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthCallback from "./pages/AuthCallback";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import CookingMode from "./pages/CookingMode";
import MealHistory from "./pages/MealHistory";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeResults from "./pages/RecipeResults";
import { APP_ROUTES } from "./routes";

function Router() {
  return (
    <Switch>
      <Route path={APP_ROUTES.login} component={() => <AuthPage mode="login" />} />
      <Route path={APP_ROUTES.signup} component={() => <AuthPage mode="signup" />} />
      <Route path={APP_ROUTES.authCallback} component={AuthCallback} />
      <Route path={APP_ROUTES.capture} component={() => <AuthGate allowGuest><Home /></AuthGate>} />
      <Route path={APP_ROUTES.results} component={() => <AuthGate allowGuest><RecipeResults /></AuthGate>} />
      <Route path={APP_ROUTES.cooking}>{(params) => <AuthGate allowGuest><CookingMode recipeId={params.recipeId} /></AuthGate>}</Route>
      <Route path={APP_ROUTES.recipeDetail}>{(params) => <AuthGate allowGuest><RecipeDetail recipeId={params.recipeId} /></AuthGate>}</Route>
      <Route path={APP_ROUTES.history} component={() => <AuthGate><MealHistory /></AuthGate>} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <SupabaseAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
