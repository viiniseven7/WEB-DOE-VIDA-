import { createBrowserRouter } from "react-router-dom";
import { Root } from "./components/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("./components/HomePage")).HomePage }),
      },
      {
        path: "login",
        lazy: async () => ({ Component: (await import("./components/LoginPage")).LoginPage }),
      },
      {
        path: "forgot-password",
        lazy: async () => ({ Component: (await import("./components/ForgotPasswordPage")).ForgotPasswordPage }),
      },
      {
        path: "reset-password",
        lazy: async () => ({ Component: (await import("./components/ResetPasswordPage")).ResetPasswordPage }),
      },
      {
        path: "teste-elegibilidade",
        lazy: async () => ({ Component: (await import("./components/EligibilityTestPage")).EligibilityTestPage }),
      },
      {
        path: "cadastro-doacao",
        lazy: async () => ({ Component: (await import("./components/RegistrationDonationPage")).RegistrationDonationPage }),
      },
      {
        path: "agendar",
        lazy: async () => ({ Component: (await import("./components/AppointmentPage")).AppointmentPage }),
      },
      {
        path: "dashboard/doador",
        lazy: async () => ({ Component: (await import("./components/dashboards/DonorDashboard")).DonorDashboard }),
      },
      {
        path: "dashboard/funcionario",
        lazy: async () => ({ Component: (await import("./components/dashboards/StaffDashboard")).StaffDashboard }),
      },
      {
        path: "dashboard/diretor",
        lazy: async () => ({ Component: (await import("./components/dashboards/DirectorDashboard")).DirectorDashboard }),
      },
      {
        path: "dashboard/admin",
        lazy: async () => ({ Component: (await import("./components/dashboards/AdminDashboard")).AdminDashboard }),
      },
      {
        path: "dashboard/custom",
        lazy: async () => ({ Component: (await import("./components/dashboards/CustomRoleDashboard")).CustomRoleDashboard }),
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("./components/NotFound")).NotFound }),
      },
    ],
  },
]);
