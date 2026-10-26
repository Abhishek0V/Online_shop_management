import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "../components/GuestRoute";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminProductFormPage from "../pages/admin/AdminProductFormPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AdminOrderDetailPage from "../pages/admin/AdminOrderDetailPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import CartPage from "../pages/shop/CartPage";
import CheckoutPage from "../pages/shop/CheckoutPage";
import MyOrdersPage from "../pages/shop/MyOrdersPage";
import OrderDetailPage from "../pages/shop/OrderDetailPage";
import ProductDetailPage from "../pages/shop/ProductDetailPage";
import ProductListPage from "../pages/shop/ProductListPage";
import NotFoundPage from "../components/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProductListPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute roles={["customer"]} />}>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderNumber" element={<OrderDetailPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/my-orders/:orderNumber" element={<OrderDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:orderNumber" element={<AdminOrderDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}