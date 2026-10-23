import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <>
      <Navbar />
      <main><AppRoutes /></main>
      <Toaster position="top-right" />
    </>
  );
}