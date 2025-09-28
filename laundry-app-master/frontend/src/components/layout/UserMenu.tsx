import {Link} from "react-router";
import styles from './UserMenu.module.css';
import {type RefObject, useEffect, useRef, useState} from "react";
import {IoIosArrowDown, IoIosArrowUp, IoMdExit} from "react-icons/io";
import {useUserData} from "../../features/user/queries.ts";
import {Button} from "../Button.tsx";
import {FiClock, FiTool} from "react-icons/fi";

import type {UserData} from "../../features/user/models.ts";

function DropdownMenu({dropdownRef, data}: { dropdownRef: RefObject<HTMLDivElement | null>, data: UserData}) {
  console.log(data)
  return (
    <div className={styles.dropdownMenu} ref={dropdownRef}>
      <Button linkTo="/history">
        <FiClock/> History
      </Button>
      {data.role.includes('ADMIN') && (
        <Button linkTo="/admin">
          <FiTool/>Admin
        </Button>
      )}
      <Button linkTo="/logout">
        <IoMdExit/> Logout
      </Button>
    </div>
  );
}

export default function UserMenu() {
  const {data} = useUserData();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current
        && buttonRef.current
        && !dropdownRef.current.contains(event.target as Node)
        && !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  })

  if (!data) {
    // Redirect to log in
    return <Link to="/login" className="empty-button">Log In</Link>;
  }
  return (
    <div className={styles.userMenu} ref={dropdownRef}>
      <Button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {data.roomNumber}
        {showDropdown ? <IoIosArrowUp/> : <IoIosArrowDown/>}
      </Button>
      {showDropdown && (
        <DropdownMenu dropdownRef={dropdownRef} data={data}/>
      )}
    </div>
  );
}
