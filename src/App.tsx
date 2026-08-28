import { useState } from "react";
import { Desktop } from "./components/Desktop/Desktop";
import { BootScreen } from "./components/Desktop/BootScreen";

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <>
      {!booted && <BootScreen onBootComplete={() => setBooted(true)} />}
      <div style={{ opacity: booted ? 1 : 0, transition: "opacity 0.3s ease", width: "100%", height: "100%" }}>
        <Desktop />
      </div>
    </>
  );
}

export default App;
