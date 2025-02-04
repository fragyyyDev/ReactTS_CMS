import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AdminClankyScreen from '../components/AdminClankyScreen';

const AdminClanky: React.FC = () => {
    // Stav pro viditelnost sidebaru na mobilu
    const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);

    const toggleSidebar = () => {
        setSidebarVisible((prev) => !prev);
    };

    // Pro ukázku nastavíme demo téma – upravte dle vašeho kontextu
    return (
        <div className="flex min-h-screen">
            {/* Sidebar – jeho šířka a animace jsou nastaveny podle předaných propů */}
            <Sidebar
                toggleSidebar={toggleSidebar}
                isVisible={sidebarVisible}
                doAnimation={true}
            />

            {/* Hlavní obsah – na desktopu posunutý doprava dle šířky sidebaru */}
            <div className="flex-1 ml-0 sm:ml-[35vw] md:ml-[30vw] lg:ml-[25vw] xl:ml-[22vw] 2xl:ml-[17vw]">
                {/* Mobilní Navbar pro otevírání sidebaru */}
                <Navbar
                    isSidebarVisible={sidebarVisible}
                    setIsSidebarVisible={setSidebarVisible}
                />
                <AdminClankyScreen />
            </div>
        </div>
    );
};

export default AdminClanky;
