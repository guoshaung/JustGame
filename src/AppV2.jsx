import V2EmotionPostOffice from "./scenes/V2EmotionPostOffice.jsx";
import "./AppV2.css";

export default function AppV2() {
  return (
    <main className="app-shell">
      <section className="tablet v2-tablet">
        <V2EmotionPostOffice onBackToModeChoice={() => {}} />
      </section>
    </main>
  );
}
