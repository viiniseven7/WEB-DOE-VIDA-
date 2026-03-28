import { Header } from "./Header";
import { Hero } from "./Hero";
import { HowToDonate } from "./HowToDonate";
import { DonationLocations } from "./DonationLocations";
import { AppointmentForm } from "./AppointmentForm";
import { EligibilityChecker } from "./EligibilityChecker";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";

export function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HowToDonate />
        <DonationLocations />
        <AppointmentForm />
        <EligibilityChecker />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
