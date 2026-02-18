import { 
  Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, 
  NavbarMenu, NavbarMenuItem, Link, Button 
} from "@heroui/react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

// Logo inside the same file for convenience
export const FLogo = () => (
  <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
    <path clipRule="evenodd" fillRule="evenodd" d="M21.5 6H8L5 26H8.5L9.5 19H17.5L18 16H10L10.8 11H20.8L21.5 6Z" fill="currentColor" />
  </svg>
);

export default function MainNavbar({ onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper function para sa styling ng active links
  const getLinkStyle = ({ isActive }) => ({
    color: isActive ? "#0070f3" : "#11181C", // Blue kung active, default color kung hindi
    fontWeight: isActive ? "bold" : "normal",
  });

  return (
    <Navbar isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} isBordered className="bg-white">
      <NavbarContent>
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} className="sm:hidden" />
        <NavbarBrand>
          <FLogo />
          <p className="font-bold text-inherit ml-2 tracking-tight uppercase">FTP Leave App</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-8" justify="center">
        <NavbarItem>
          {/* Ginagamit natin ang as={NavLink} para hindi mag-refresh ang page */}
          <Link as={NavLink} to="/" style={getLinkStyle}>
            Home
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link as={NavLink} to="/information" style={getLinkStyle}>
            Information
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button color="danger" variant="flat" radius="full" size="sm" className="font-semibold" onPress={onLogout}>
            Logout
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem>
          <Link as={NavLink} to="/" className="w-full" size="lg" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link as={NavLink} to="/information" className="w-full" size="lg" onClick={() => setIsMenuOpen(false)}>
            Information
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link className="w-full" color="danger" href="#" size="lg" onClick={onLogout}>
            Log Out
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}