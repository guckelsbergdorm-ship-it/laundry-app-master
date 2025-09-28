import styles from './Navbar.module.css';
import {Link, useLocation} from "react-router";
import clsx from "clsx";
import ThemeToggle from "./ThemeToggle.tsx";
import UserMenu from "./UserMenu.tsx";
import * as React from "react";
import {useState} from "react";
import {RxCross1, RxHamburgerMenu} from "react-icons/rx";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import Logo from '../../static/guckelsberg.svg?react';
import {useUserData} from "../../features/user/queries.ts";

function Hamburger({open, setOpen, close}: {
  open: boolean,
  setOpen: (open: boolean) => void,
  close?: boolean
}) {
  return (
    <div className={clsx(styles.hamburger, styles.link)}
         onClick={() => setOpen(!open)}>
      {close
        ? <RxCross1 size={32}/>
        : <RxHamburgerMenu size={32}/>
      }
    </div>
  )
}

function NavbarLink({to, children, regex}: {
  to: string,
  children: React.ReactNode,
  regex?: RegExp,
  requiresAuth?: boolean
}) {
  const location = useLocation();
  const current = regex ? regex.test(location.pathname) : location.pathname === to;
  return (
    <Link to={to} className={clsx(styles.link, current && styles.currentLink)}>
      {children}
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const {data: loggedIn} = useUserData();
  return (
    <div className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <Hamburger open={open} setOpen={setOpen}/>
        <div className={styles.logo}>
          <Link to="/" className={styles.logo}>
            <Logo className={styles.logoSvg}/>
          </Link>
        </div>
        <div className={clsx(styles.links, styles.navLinks, open && styles.open)}>
          <Hamburger open={open} setOpen={setOpen} close/>
          <NavbarLink to="/">
            Home
          </NavbarLink>
          <NavbarLink to="/presidium">
            Presidium
          </NavbarLink>
          {loggedIn && (
            <>
              <NavbarLink to="/laundry/bookings" regex={/\/laundry.*/}>
                Laundry
              </NavbarLink>
              <NavbarLink to="/rooftop/bookings" regex={/\/rooftop.*/}>
                Rooftop
              </NavbarLink>
            </>
          )}
        </div>
        <div className={clsx(styles.links, styles.right)}>
          <UserMenu/>
          <ThemeToggle/>
        </div>
        {open && <div className={styles.overlay} onClick={() => setOpen(false)}/>}
      </div>
    </div>
  )
}
