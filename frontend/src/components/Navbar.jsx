import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  Hammer,
  Search,
  ShoppingCart,
  UserRound,
  Menu,
  X,
  Package,
  ClipboardList,
  LogOut,
  ArrowLeft,
} from "lucide-react";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const closeMenu = () => setMobileOpen(false);

  // --- Route classification ---
  const path = location.pathname;

  // Hide navbar completely on auth pages (they have their own full-page layout)
  const isAuthPage =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path.startsWith("/reset-password/");

  // Admin pages get a minimal navbar (logo + admin links + logout)
  const isAdminPage = path.startsWith("/admin");

  // Search bar is only useful on the homepage
  const isHomePage = path === "/";

  // --- Handlers ---
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const value = search.trim();
    navigate(value ? `/?search=${encodeURIComponent(value)}` : "/");
    closeMenu();
  };

  // Auth pages: render nothing
  if (isAuthPage) return null;

  // Admin pages: minimal navbar
  if (isAdminPage) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-stone-800 bg-[#242424]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/admin/products" className="group flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f5c32c] text-black transition-transform duration-200 group-hover:scale-105">
              <Hammer size={22} strokeWidth={2.3} />
            </span>
            <span className="text-lg font-black uppercase tracking-tight text-white transition-colors group-hover:text-[#f5c32c]">
              Forge <span className="text-[10px] font-bold tracking-widest text-stone-400">ADMIN</span>
            </span>
          </Link>

          {/* Admin nav links */}
          <nav className="hidden items-center gap-2 text-[11px] font-bold uppercase text-stone-300 sm:flex">
            <Link
              to="/admin/products"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all hover:bg-stone-800 hover:text-[#f5c32c] ${
                path.includes("/admin/products") ? "bg-stone-800 text-[#f5c32c]" : ""
              }`}
            >
              <Package size={14} /> Products
            </Link>
            <Link
              to="/admin/orders"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all hover:bg-stone-800 hover:text-[#f5c32c] ${
                path.includes("/admin/orders") ? "bg-stone-800 text-[#f5c32c]" : ""
              }`}
            >
              <ClipboardList size={14} /> Orders
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-stone-400 transition-all hover:bg-stone-800 hover:text-white"
            >
              <ArrowLeft size={14} /> Back to Shop
            </Link>
          </nav>

          {/* Logout */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden text-xs text-stone-400 sm:block">
                {user.first_name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className="flex items-center gap-1.5 rounded-md p-2 text-stone-400 transition-all hover:bg-stone-800 hover:text-red-400 active:scale-95"
            >
              <LogOut size={18} />
              <span className="hidden text-[10px] font-bold uppercase sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Standard shop navbar
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#f5c32c] text-black transition-transform duration-200 group-hover:scale-105">
            <Hammer size={26} strokeWidth={2.3} />
          </span>
          <span className="text-xl font-black uppercase tracking-tight text-stone-900 transition-colors group-hover:text-[#a17b00] sm:text-2xl">
            Forge<span className="text-[#d8a500]">.</span>
          </span>
        </Link>

        {/* Desktop nav links — shown on homepage only */}
        {isHomePage && (
          <nav className="hidden items-center gap-1 text-[11px] font-extrabold uppercase text-stone-800 xl:flex">
            <a href="#home" className="rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">Home</a>
            <a href="#categories" className="rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">Categories</a>
            <a href="#products" className="rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">Products</a>
            <a href="#offers" className="rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">Offers</a>
          </nav>
        )}

        {/* Non-homepage desktop nav: simple breadcrumb-style links */}
        {!isHomePage && (
          <nav className="hidden items-center gap-2 text-[11px] font-bold uppercase text-stone-500 xl:flex">
            <Link to="/" className="flex items-center gap-1.5 rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">
              <ArrowLeft size={13} /> Shop
            </Link>
            {user && !isAdmin && (
              <Link to="/my-orders" className="rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">My Orders</Link>
            )}
            {user && !isAdmin && (
              <Link to="/cart" className="relative flex items-center gap-1.5 rounded-md px-3 py-2 transition-all hover:bg-stone-100 hover:text-[#b48600]">
                Cart
                {itemCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f5c32c] px-1 text-[9px] font-black text-black">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
          </nav>
        )}

        {/* Search — desktop, only on homepage */}
        {isHomePage && (
          <form
            onSubmit={handleSearch}
            className="hidden w-full max-w-[240px] items-center rounded-md border border-stone-300 px-3 py-2 transition-colors focus-within:border-[#f5c32c] focus-within:ring-1 focus-within:ring-[#f5c32c] md:flex"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-black"
            >
              <Search size={16} />
            </button>
          </form>
        )}

        {/* Account, cart, and mobile menu toggle */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Cart icon — always visible for customers */}
          {user && !isAdmin && (
            <Link
              to="/cart"
              aria-label={`Cart, ${itemCount} items`}
              className="relative rounded-md p-2.5 text-stone-700 transition-all hover:bg-stone-100 hover:text-[#a17b00] active:scale-95"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f5c32c] px-1 text-[9px] font-black text-black shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <>
              <span className="hidden items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 sm:flex">
                <UserRound size={17} />
                {user.first_name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                className="hidden rounded-md p-2 text-stone-500 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 sm:block"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                aria-label="Login"
                className="rounded-md p-2.5 text-stone-700 transition-all hover:bg-stone-100 hover:text-[#a17b00] active:scale-95"
              >
                <UserRound size={20} />
              </Link>
              <Link
                to="/register"
                className="hidden rounded-md bg-[#f5c32c] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black transition-all hover:bg-[#e7b51b] hover:shadow-sm active:scale-95 sm:block"
              >
                Register
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="rounded-md p-2 text-stone-700 transition-all hover:bg-stone-100 hover:text-black active:scale-95 xl:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile search — only on homepage */}
      {isHomePage && (
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 border-t border-stone-100 px-4 py-2 md:hidden"
        >
          <Search size={16} className="shrink-0 text-stone-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full bg-transparent text-xs outline-none"
          />
        </form>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 xl:hidden">
          <nav className="flex flex-col gap-1 text-xs font-bold uppercase">
            {isHomePage ? (
              <>
                <a href="#home" onClick={closeMenu} className="rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">Home</a>
                <a href="#categories" onClick={closeMenu} className="rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">Categories</a>
                <a href="#products" onClick={closeMenu} className="rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">Products</a>
                <a href="#offers" onClick={closeMenu} className="rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">Offers</a>
              </>
            ) : (
              <Link to="/" onClick={closeMenu} className="flex items-center gap-2 rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">
                <ArrowLeft size={14} /> Back to Shop
              </Link>
            )}

            {user && !isAdmin && (
              <>
                <Link to="/my-orders" onClick={closeMenu} className="flex items-center gap-2 rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">
                  <ClipboardList size={15} /> My Orders
                </Link>
                <Link to="/cart" onClick={closeMenu} className="flex items-center gap-2 rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">
                  <ShoppingCart size={15} /> Cart {itemCount > 0 && `(${itemCount})`}
                </Link>
              </>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={15} /> Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="rounded-md px-3 py-2.5 transition-colors hover:bg-stone-100 hover:text-[#a17b00]">Login</Link>
                <Link to="/register" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-[#987000] transition-colors hover:bg-stone-100">Create Account</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
