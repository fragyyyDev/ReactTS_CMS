import { List, X } from '@phosphor-icons/react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';


interface SidebarProps {
  toggleSidebar: () => void;
  isVisible: boolean;
  doAnimation: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSidebar, isVisible, doAnimation }) => {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  
  return (
    <div
      className={`p-2 fixed top-0 left-0 md:w-[30vw] sm:w-[35vw] lg:w-[25vw] xl:w-[22vw] 2xl:w-[17vw] w-screen h-full ${
        doAnimation ? "transition-transform duration-300 ease-in-out" : ""
      } ${isVisible ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div
        className={`relative dark:bg-dark/50 backdrop-blur-2xl bg-lightbackground flex flex-col rounded-lg h-full p-4 border border-lightsecondary dark:border-secondary overflow-y-auto overflow-x-hidden z-10 transform`}
      >
        <h2 className="text-xl font-bold mb-4">Blog</h2>
        <ul>
          <li className='font-medium'><Link to="/admin">Vytvořit článek</Link></li>
          <li className='font-medium'><Link to="/admin-clanky">Články</Link></li>
          <li className='font-medium'><button onClick={logout}>Odhlásit se</button></li>
        </ul>
        {/* Tlačítko pro zavření sidebaru (pouze na mobilu) */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-800 px-2 py-1 rounded mt-4 absolute -top-1 right-4"
        >
          <X size={28} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
