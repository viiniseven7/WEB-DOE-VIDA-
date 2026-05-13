import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppointmentForm } from "./AppointmentForm";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export function AppointmentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6 text-gray-600 hover:text-red-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          
          <AppointmentForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
