import React, { useState, useEffect } from 'react';
import { Home, Calendar, Settings, Users, Package, Scissors, BarChart3 } from 'lucide-react';

type NavigationItem = {
  name: string;
  icon: React.ReactNode;
  current: boolean;
  subItems?: { name: string; icon: React.ReactNode }[];
};

type NavigationProps = {
  currentPage: string;
  onPageChange: (page: string) => void;
};

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [showSubMenu, setShowSubMenu] = useState(false);

  const navigation: NavigationItem[] = [
    { name: 'accueil', icon: <Home className="h-6 w-6" />, current: currentPage === 'accueil' },
    { name: 'activite', icon: <Calendar className="h-6 w-6" />, current: currentPage === 'activite' },
    { name: 'tableau-de-bord', icon: <BarChart3 className="h-6 w-6" />, current: currentPage === 'tableau-de-bord' },
    {
      name: 'Gestion',
      icon: <Settings className="h-6 w-6" />,
      current: ['gestion', 'clients', 'produits', 'prestations'].includes(currentPage),
      subItems: [
        { name: 'Clients', icon: <Users className="h-5 w-5" /> },
        { name: 'Produits', icon: <Package className="h-5 w-5" /> },
        { name: 'Prestations', icon: <Scissors className="h-5 w-5" /> },
      ],
    },
  ];

  // Close sub-menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.navigation-menu')) {
        setShowSubMenu(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex navigation-menu">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <button
                  onClick={() => {
                    if (item.subItems) {
                      setShowSubMenu(!showSubMenu);
                      if (!showSubMenu) {
                        onPageChange('clients');
                      }
                    } else {
                      onPageChange(item.name.toLowerCase());
                      setShowSubMenu(false);
                    }
                  }}
                  className={`
                    inline-flex items-center px-4 h-16 border-b-2 text-sm font-medium
                    ${item.current
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {item.icon}
                  <span className="ml-2">{item.name === 'accueil' ? 'Accueil' : 
                                        item.name === 'activite' ? 'Activités' :
                                        item.name === 'tableau-de-bord' ? 'Tableau de bord' :
                                        item.name}</span>
                </button>

                {item.subItems && showSubMenu && item.current && (
                  <div 
                    className="absolute left-0 mt-0 w-48 bg-white rounded-b-lg shadow-lg z-50"
                  >
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.name}
                        onClick={() => {
                          onPageChange(subItem.name.toLowerCase());
                          setShowSubMenu(false);
                        }}
                        className={`
                          w-full flex items-center px-4 py-3 text-sm
                          ${currentPage === subItem.name.toLowerCase()
                            ? 'text-pink-600 bg-pink-50'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {subItem.icon}
                        <span className="ml-2">{subItem.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}