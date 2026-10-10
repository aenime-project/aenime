import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { HomeInfoProvider } from "./context/HomeInfoContext";
import Home from "./pages/Home/Home";
import AnimeInfo from "./pages/animeInfo/AnimeInfo";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Error from "./components/error/Error";
import Category from "./pages/category/Category";
import AtoZ from "./pages/a2z/AtoZ";
import { azRoute, categoryRoutes } from "./utils/category.utils";
import "./App.css";
import Search from "./pages/search/Search";
import Watch from "./pages/watch/Watch";
import Producer from "./components/producer/Producer";
import SplashScreen from "./components/splashscreen/SplashScreen";
import DonatePage from "./pages/donate/donate";
import proxyWarmup from "./utils/proxyWarmup.utils";
import ErrorBoundary from "./components/error/ErrorBoundary";

function App() {
  const location = useLocation();

  // Scroll to top on location change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    proxyWarmup.smartWarmup();
    return () => proxyWarmup.cleanup();
  }, [location.pathname]);

  // Check if the current route is for the splash screen
  const isSplashScreen = location.pathname === "/";

  return (
    <HomeInfoProvider>
      <div className="app-container">
        <main className="content">
          {!isSplashScreen && <Navbar />}
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<Home />} />
            <Route path="/info/:id" element={<AnimeInfo />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/random" element={<AnimeInfo random={true} />} />
            <Route path="/404-not-found-page" element={<Error error="404" />} />
            <Route path="/error-page" element={<Error />} />
            {/* Render category routes */}
            {categoryRoutes.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={
                  <Category path={path} label={path.split("-").join(" ")} />
                }
              />
            ))}
            {/* Render A to Z routes */}
            {azRoute.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={<AtoZ path={path} />}
              />
            ))}
            <Route path="/producer/:id" element={<Producer />} />
            <Route path="/search" element={<Search />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<Error error="404" />} />
            <Route path="/donate" element={<DonatePage />} />
          </Routes>
          </ErrorBoundary>
          {!isSplashScreen && <Footer />}
        </main>
      </div>
    </HomeInfoProvider>
  );
}

export default App;