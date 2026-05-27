import { Toaster } from "sonner";
import Home from "./pages/Home";

export default function App() {
  return (
    <>
      <Home />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#111111",
            border: "1px solid #222222",
            color: "#f5f5f5",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontSize: "14px",
          },
          classNames: {
            toast: "rounded-md",
          },
        }}
      />
    </>
  );
}
