import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { HomePage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { EligibilityTestPage } from "./components/EligibilityTestPage";
import { RegistrationDonationPage } from "./components/RegistrationDonationPage";
import { DonorDashboard } from "./components/dashboards/DonorDashboard";
import { StaffDashboard } from "./components/dashboards/StaffDashboard";
import { DirectorDashboard } from "./components/dashboards/DirectorDashboard";
import { AdminDashboard } from "./components/dashboards/AdminDashboard";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
      { path: "teste-elegibilidade", Component: EligibilityTestPage },
      { path: "cadastro-doacao", Component: RegistrationDonationPage },
      { path: "dashboard/donor", Component: DonorDashboard },
      { path: "dashboard/staff", Component: StaffDashboard },
      { path: "dashboard/director", Component: DirectorDashboard },
      { path: "dashboard/admin", Component: AdminDashboard },
      { path: "*", Component: NotFound },
    ],
  },
]);