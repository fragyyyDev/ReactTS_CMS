import { List } from '@phosphor-icons/react';
import React, { useEffect } from 'react';

interface NavbarProps {
    isSidebarVisible: boolean;
    setIsSidebarVisible: (visible: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarVisible, setIsSidebarVisible }) => {
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 640) {
                setIsSidebarVisible(false);
            } else {
                // Nad 640px se sidebar otevře
                setIsSidebarVisible(true);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [setIsSidebarVisible]);

    return (
        <div
            className={`bg-white bg-opacity-50 backdrop-blur-xl border border-tetriary w-full fixed top-0 left-0 h-fit md:hidden py-3 px-4 rounded-md flex items-center justify-between z-[9998] transition-all duration-300 transform ${isSidebarVisible ? "-translate-y-full" : "translate-y-0"}`}
        >
            <div className="flex gap-3 items-center">
                <h1>Blog</h1>
            
            </div>
            {/* Tlačítko pro otevření/vypnutí sidebaru */}
            <button
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                className="text-gray-800 px-4 py-2 rounded"
            >
                <List size={28}/>
            </button>
        </div>
    );
};

export default Navbar;
