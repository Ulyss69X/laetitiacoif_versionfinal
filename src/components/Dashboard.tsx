import React, { useState } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Activity } from '../types/activity';
import type { Customer } from '../types/customer';
import type { Service } from '../types/service';
import type { Product } from '../types/product';
import {
  BarChart,
  TrendingUp,
  Users,
  ShoppingBag,
  Scissors,
  CreditCard,
  Banknote,
  CheckSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Euro
} from 'lucide-react';

type Period = 'day' | 'week' | 'month' | 'year';

type DashboardProps = {
  activities: Activity[];
  customers: Customer[];
  services: Service[];
  products: Product[];
};

export function Dashboard({ activities, customers, services, products }: DashboardProps) {
  const [period, setPeriod] = useState<Period>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (period) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    switch (period) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setSelectedDate(newDate);
  };

  // Get date range based on selected period
  const getDateRange = () => {
    switch (period) {
      case 'day':
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
          label: format(selectedDate, 'dd MMMM yyyy', { locale: fr })
        };
      case 'week':
        return {
          start: startOfWeek(selectedDate, { locale: fr }),
          end: endOfWeek(selectedDate, { locale: fr }),
          label: `Semaine du ${format(startOfWeek(selectedDate, { locale: fr }), 'dd MMMM', { locale: fr })}`
        };
      case 'month':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
          label: format(selectedDate, 'MMMM yyyy', { locale: fr })
        };
      case 'year':
        return {
          start: startOfYear(selectedDate),
          end: endOfYear(selectedDate),
          label: format(selectedDate, 'yyyy', { locale: fr })
        };
    }
  };

  const { start, end, label } = getDateRange();

  // Filter activities for selected period
  const filteredActivities = activities.filter(activity => {
    const activityDate = parseISO(activity.date);
    return activityDate >= start && activityDate <= end;
  });

  // Calculate metrics
  const totalRevenue = filteredActivities.reduce((sum, activity) => sum + activity.total_amount, 0);
  const totalServices = filteredActivities.reduce((sum, activity) => sum + activity.total_services, 0);
  const totalProducts = filteredActivities.reduce((sum, activity) => sum + activity.total_products, 0);
  const uniqueCustomers = new Set(filteredActivities.map(activity => activity.customer_id)).size;
  const averageRevenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

  // Calculate payment method distribution
  const paymentMethodStats = filteredActivities.reduce((acc, activity) => {
    acc[activity.payment_method] = (acc[activity.payment_method] || 0) + activity.total_amount;
    return acc;
  }, {} as Record<string, number>);

  // Get all services stats
  const serviceStats = new Map<string, { count: number; revenue: number }>();
  filteredActivities.forEach(activity => {
    activity.services.forEach(service => {
      const stats = serviceStats.get(service.service_id) || { count: 0, revenue: 0 };
      stats.count += 1;
      stats.revenue += service.price;
      serviceStats.set(service.service_id, stats);
    });
  });

  const allServices = Array.from(serviceStats.entries())
    .map(([id, stats]) => ({
      name: services.find(s => s.id === id)?.name || 'Unknown',
      ...stats
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Get all products stats
  const productStats = new Map<string, { count: number; revenue: number }>();
  filteredActivities.forEach(activity => {
    activity.products.forEach(product => {
      const stats = productStats.get(product.product_id) || { count: 0, revenue: 0 };
      stats.count += product.quantity;
      stats.revenue += product.price * product.quantity;
      productStats.set(product.product_id, stats);
    });
  });

  const allProducts = Array.from(productStats.entries())
    .map(([id, stats]) => ({
      name: products.find(p => p.id === id)?.name || 'Unknown',
      ...stats
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="py-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Tableau de bord
        </h2>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          {/* Period selector */}
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setPeriod('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                period === 'day'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                period === 'week'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                period === 'month'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                period === 'year'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Année
            </button>
          </div>

          {/* Date navigation */}
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <button
              onClick={navigatePrevious}
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-medium text-gray-900">{label}</span>
            </div>
            <button
              onClick={navigateNext}
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label="Période suivante"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Date picker */}
          <input
            type={period === 'year' ? 'number' : 'date'}
            value={period === 'year' ? selectedDate.getFullYear() : format(selectedDate, 'yyyy-MM-dd')}
            min={period === 'year' ? '2000' : '2000-01-01'}
            max={period === 'year' ? '2100' : '2100-12-31'}
            onChange={(e) => {
              if (period === 'year') {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(parseInt(e.target.value));
                setSelectedDate(newDate);
              } else {
                setSelectedDate(new Date(e.target.value));
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chiffre d'affaires</h3>
            <TrendingUp className="h-6 w-6 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-pink-600 mt-2">{totalRevenue.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Panier moyen</h3>
            <Euro className="h-6 w-6 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-pink-600 mt-2">{averageRevenuePerCustomer.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Prestations</h3>
            <Scissors className="h-6 w-6 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-pink-600 mt-2">{totalServices.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Produits</h3>
            <ShoppingBag className="h-6 w-6 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-pink-600 mt-2">{totalProducts.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
            <Users className="h-6 w-6 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-pink-600 mt-2">{uniqueCustomers}</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Moyens de paiement</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CreditCard className="h-5 w-5 text-pink-600 mr-2" />
              <span className="text-sm text-gray-600">Virements</span>
            </div>
            <span className="text-lg font-medium">{(paymentMethodStats['virement'] || 0).toFixed(2)} €</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Banknote className="h-5 w-5 text-pink-600 mr-2" />
              <span className="text-sm text-gray-600">Espèces</span>
            </div>
            <span className="text-lg font-medium">{(paymentMethodStats['especes'] || 0).toFixed(2)} €</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckSquare className="h-5 w-5 text-pink-600 mr-2" />
              <span className="text-sm text-gray-600">Chèques</span>
            </div>
            <span className="text-lg font-medium">{(paymentMethodStats['cheque'] || 0).toFixed(2)} €</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <BarChart className="h-5 w-5 text-pink-600 mr-2" />
              <span className="text-sm text-gray-600">Autres</span>
            </div>
            <span className="text-lg font-medium">{(paymentMethodStats['autres'] || 0).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Services and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Services */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Toutes les prestations</h3>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Prestation</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Nombre</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allServices.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{service.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 text-right">{service.count}x</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      {service.revenue.toFixed(2)} €
                    </td>
                  </tr>
                ))}
                {allServices.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                      Aucune prestation sur cette période
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">Total</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                    {allServices.reduce((sum, service) => sum + service.count, 0)}x
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                    {allServices.reduce((sum, service) => sum + service.revenue, 0).toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* All Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tous les produits</h3>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Produit</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Quantité</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 text-right">{product.count}x</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      {product.revenue.toFixed(2)} €
                    </td>
                  </tr>
                ))}
                {allProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                      Aucun produit vendu sur cette période
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">Total</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                    {allProducts.reduce((sum, product) => sum + product.count, 0)}x
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                    {allProducts.reduce((sum, product) => sum + product.revenue, 0).toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}