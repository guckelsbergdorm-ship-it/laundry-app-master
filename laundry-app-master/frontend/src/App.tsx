import {Route, Routes} from "react-router";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./features/user/LoginPage.tsx";
import LogoutPage from "./features/user/LogoutPage.tsx";
import LaundryPage from "./features/laundry/LaundryPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import RooftopPage from "./features/rooftop/RooftopPage.tsx";
import {AdminPage} from "./features/admin/AdminPage.tsx";
import {RooftopFormPage} from "./features/rooftop/RooftopFormPage.tsx";
import {HistoryPage} from "./features/user/HistoryPage.tsx";
import {PresidiumPage} from "./features/presidium/PresidiumPage.tsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/logout" element={<LogoutPage/>}/>
        <Route path="/laundry/bookings" element={<LaundryPage/>}/>
        <Route path="/rooftop/bookings" element={<RooftopPage/>}/>
        <Route path="/rooftop/bookings/request/:date" element={<RooftopFormPage/>}/>
        <Route path="/admin" element={<AdminPage/>}/>
        <Route path="/history" element={<HistoryPage/>}/>
        <Route path="/presidium" element={<PresidiumPage/>}/>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </>
  )
}
