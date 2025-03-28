import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Scissors,
  Plus,
  Calendar,
  Package,
  Download,
  RefreshCw,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Customer, CustomerFormData, CustomerNote } from './types/customer';
import type { Service, ServiceFormData } from './types/service';
import type { Product, ProductFormData } from './types/product';
import type { Activity, ActivityFormData } from './types/activity';
import { CustomerForm } from './components/CustomerForm';
import { ServiceForm } from './components/ServiceForm';
import { ProductForm } from './components/ProductForm';
import { ActivityForm } from './components/ActivityForm';
import { SignIn } from './components/SignIn';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { format } from 'date-fns';
import { Logo } from './components/Logo';

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('accueil');
  const [allNotes, setAllNotes] = useState<CustomerNote[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCustomers();
        fetchServices();
        fetchProducts();
        fetchActivities();
        fetchAllNotes();
      }
    });

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCustomers();
        fetchServices();
        fetchProducts();
        fetchActivities();
        fetchAllNotes();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAllNotes() {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }

  async function fetchCustomers() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }

  async function fetchServices() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Erreur lors du chargement des prestations');
    }
  }

  async function fetchProducts() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Erreur lors du chargement des produits');
    }
  }

  async function fetchActivities() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('activities')
        .select(
          `
          *,
          customer:customers(first_name, last_name),
          activity_services(service_id, price),
          activity_products(product_id, price, quantity)
        `
        )
        .order('date', { ascending: false });

      if (error) throw error;

      const activitiesWithDetails = data.map((activity) => ({
        ...activity,
        services: activity.activity_services.map((service) => ({
          service_id: service.service_id,
          price: service.price,
        })),
        products: activity.activity_products.map((product) => ({
          product_id: product.product_id,
          price: product.price,
          quantity: product.quantity,
        })),
      }));

      setActivities(activitiesWithDetails);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Erreur lors du chargement des activités');
    }
  }

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCustomers(),
        fetchAllNotes(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Erreur lors de l\'actualisation des données');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCustomer = async (data: CustomerFormData) => {
    try {
      setError(null);
      const { error } = await supabase.from('customers').insert([data]);

      if (error) throw error;

      await fetchCustomers();
      setIsCustomerFormOpen(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Erreur lors de la création du client');
    }
  };

  const handleUpdateCustomer = async (data: CustomerFormData) => {
    if (!selectedCustomer) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      await fetchCustomers();
      setIsCustomerFormOpen(false);
      setSelectedCustomer(undefined);
    } catch (error) {
      console.error('Error updating customer:', error);
      setError('Erreur lors de la mise à jour du client');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      await fetchCustomers();
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Erreur lors de la suppression du client');
    }
  };

  const handleCreateService = async (data: ServiceFormData) => {
    try {
      setError(null);
      const { error } = await supabase.from('services').insert([data]);

      if (error) throw error;

      await fetchServices();
      setIsServiceFormOpen(false);
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Erreur lors de la création de la prestation');
    }
  };

  const handleUpdateService = async (data: ServiceFormData) => {
    if (!selectedService) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('services')
        .update(data)
        .eq('id', selectedService.id);

      if (error) throw error;

      await fetchServices();
      setIsServiceFormOpen(false);
      setSelectedService(undefined);
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Erreur lors de la mise à jour de la prestation');
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete.id);

      if (error) throw error;

      await fetchServices();
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Erreur lors de la suppression de la prestation');
    }
  };

  const handleCreateProduct = async (data: ProductFormData) => {
    try {
      setError(null);
      const { error } = await supabase.from('products').insert([data]);

      if (error) throw error;

      await fetchProducts();
      setIsProductFormOpen(false);
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Erreur lors de la création du produit');
    }
  };

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!selectedProduct) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      await fetchProducts();
      setIsProductFormOpen(false);
      setSelectedProduct(undefined);
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Erreur lors de la mise à jour du produit');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      await fetchProducts();
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Erreur lors de la suppression du produit');
    }
  };

  const handleCreateActivity = async (data: ActivityFormData) => {
    try {
      setError(null);

      // Calculate totals
      const totalServices = data.services.reduce(
        (sum, service) => sum + service.price,
        0
      );
      const totalProducts = data.products.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );
      const totalAmount = totalServices + totalProducts;

      // Create activity
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert([
          {
            customer_id: data.customer_id,
            date: data.date,
            total_services: totalServices,
            total_products: totalProducts,
            total_amount: totalAmount,
            payment_method: data.payment_method,
          },
        ])
        .select()
        .single();

      if (activityError) throw activityError;

      // Create activity services
      if (data.services.length > 0) {
        const { error: servicesError } = await supabase
          .from('activity_services')
          .insert(
            data.services.map((service) => ({
              activity_id: activity.id,
              service_id: service.service_id,
              price: service.price,
            }))
          );

        if (servicesError) throw servicesError;
      }

      // Create activity products
      if (data.products.length > 0) {
        const { error: productsError } = await supabase
          .from('activity_products')
          .insert(
            data.products.map((product) => ({
              activity_id: activity.id,
              product_id: product.product_id,
              price: product.price,
              quantity: product.quantity,
            }))
          );

        if (productsError) throw productsError;
      }

      await fetchActivities();
      setIsActivityFormOpen(false);
      setSelectedActivity(undefined);
    } catch (error) {
      console.error('Error creating activity:', error);
      setError("Erreur lors de la création de l'activité");
    }
  };

  const handleUpdateActivity = async (data: ActivityFormData) => {
    if (!selectedActivity) return;
  
    try {
      setError(null);
  
      // Calculate totals
      const totalServices = data.services.reduce(
        (sum, service) => sum + service.price,
        0
      );
      const totalProducts = data.products.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );
      const totalAmount = totalServices + totalProducts;
  
      // Update activity
      const { error: activityError } = await supabase
        .from('activities')
        .update({
          customer_id: data.customer_id,
          date: data.date,
          total_services: totalServices,
          total_products: totalProducts,
          total_amount: totalAmount,
          payment_method: data.payment_method,
        })
        .eq('id', selectedActivity.id);
  
      if (activityError) throw activityError;
  
      // Delete existing services and products
      const { error: deleteServicesError } = await supabase
        .from('activity_services')
        .delete()
        .eq('activity_id', selectedActivity.id);
  
      if (deleteServicesError) throw deleteServicesError;
  
      const { error: deleteProductsError } = await supabase
        .from('activity_products')
        .delete()
        .eq('activity_id', selectedActivity.id);
  
      if (deleteProductsError) throw deleteProductsError;
  
      // Create new activity services
      if (data.services.length > 0) {
        const { error: servicesError } = await supabase
          .from('activity_services')
          .insert(
            data.services.map((service) => ({
              activity_id: selectedActivity.id,
              service_id: service.service_id,
              price: service.price,
            }))
          );
  
        if (servicesError) throw servicesError;
      }
  
      // Create new activity products
      if (data.products.length > 0) {
        const { error: productsError } = await supabase
          .from('activity_products')
          .insert(
            data.products.map((product) => ({
              activity_id: selectedActivity.id,
              product_id: product.product_id,
              price: product.price,
              quantity: product.quantity,
            }))
          );
  
        if (productsError) throw productsError;
      }
  
      await fetchActivities();
      setIsActivityFormOpen(false);
      setSelectedActivity(undefined);
    } catch (error) {
      console.error('Error updating activity:', error);
      setError("Erreur lors de la mise à jour de l'activité");
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToDelete.id);

      if (error) throw error;

      await fetchActivities();
      setIsDeleteModalOpen(false);
      setActivityToDelete(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
      setError("Erreur lors de la suppression de l'activité");
    }
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const csvData = activities.flatMap((activity) => {
      const customer = customers.find((c) => c.id === activity.customer_id);
      const date = format(new Date(activity.date), 'dd/MM/yyyy');
      const rows = [];

      // Add service rows
      activity.services.forEach((service) => {
        rows.push({
          date,
          client: `${customer?.last_name} ${customer?.first_name}`,
          type: 'Prestation',
          item: getServiceName(service.service_id),
          price: service.price.toFixed(2),
          quantity: '1',
          total: service.price.toFixed(2),
          payment: activity.payment_method,
        });
      });

      // Add product rows
      activity.products.forEach((product) => {
        rows.push({
          date,
          client: `${customer?.last_name} ${customer?.first_name}`,
          type: 'Produit',
          item: getProductName(product.product_id),
          price: product.price.toFixed(2),
          quantity: product.quantity.toString(),
          total: (product.price * product.quantity).toFixed(2),
          payment: activity.payment_method,
        });
      });

      return rows;
    });

    // Convert to CSV string
    const headers = [
      'Date',
      'Client',
      'Type',
      'Article',
      'Prix unitaire',
      'Quantité',
      'Total',
      'Règlement',
    ];
    const csvString = [
      headers.join(';'),
      ...csvData.map((row) =>
        [
          row.date,
          row.client,
          row.type,
          row.item,
          row.price,
          row.quantity,
          row.total,
          row.payment,
        ].join(';')
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activites_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openEditCustomerForm = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerFormOpen(true);
  };

  const openDeleteCustomerModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const openEditServiceForm = (service: Service) => {
    setSelectedService(service);
    setIsServiceFormOpen(true);
  };

  const openDeleteServiceModal = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setSelectedProduct(product);
    setIsProductFormOpen(true);
  };

  const openDeleteProductModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const openEditActivityForm = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsActivityFormOpen(true);
  };

  const openDeleteActivityModal = (activity: Activity) => {
    setActivityToDelete(activity);
    setIsDeleteModalOpen(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      `${customer.first_name} ${customer.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActivities = activities.filter((activity) => {
    const customer = customers.find((c) => c.id === activity.customer_id);
    if (!customer) return false;

    const searchString = `${customer.first_name} ${customer.last_name} ${format(
      new Date(activity.date),
      'dd/MM/yyyy'
    )}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer
      ? `${customer.last_name} ${customer.first_name}`
      : 'Client inconnu';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : 'Prestation inconnue';
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : 'Produit inconnu';
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'tableau-de-bord':
        return (
          <Dashboard
            activities={activities}
            customers={customers}
            services={services}
            products={products}
          />
        );
      case 'activite':
        return (
          <div className="py-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion des activités
                </h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setSelectedActivity(undefined);
                      setIsActivityFormOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nouvelle Activité
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="Rechercher une activité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Prestations
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Produits
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Règlement
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Chargement...
                      </td>
                    </tr>
                  ) : filteredActivities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Aucune activité trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(activity.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCustomerName(activity.customer_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <ul className="list-disc list-inside">
                            {activity.services.map((service, index) => (
                              <li key={index}>
                                {getServiceName(service.service_id)} -{' '}
                                {service.price.toFixed(2)} €
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <ul className="list-disc list-inside">
                            {activity.products.map((product, index) => (
                              <li key={index}>
                                {getProductName(product.product_id)} -{' '}
                                {product.quantity}x {product.price.toFixed(2)} €
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.total_amount.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {activity.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditActivityForm(activity)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteActivityModal(activity)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'clients':
        return (
          <div className="py-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion de la clientèle
                </h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus: outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCustomer(undefined);
                      setIsCustomerFormOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Nouveau Client
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Dernier commentaire
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Chargement...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Aucun client trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.last_name} {customer.first_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {allNotes.find(note => note.customer_id === customer.id)?.content || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditCustomerForm(customer)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteCustomerModal(customer)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'produits':
        return (
          <div className="py-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion des produits
                </h2>
                <button
                  onClick={() => {
                    setSelectedProduct(undefined);
                    setIsProductFormOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nouveau Produit
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Libellé
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Chargement...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Aucun produit trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {product.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditProductForm(product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteProductModal(product)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'prestations':
        return (
          <div className="py-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion des prestations
                </h2>
                <button
                  onClick={() => {
                    setSelectedService(undefined);
                    setIsServiceFormOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvelle Prestation
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="Rechercher une prestation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Libellé
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Chargement...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Aucune prestation trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {service.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditServiceForm(service)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteServiceModal(service)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default: // accueil
        return (
          <div className="py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {/* Bienvenue sur LaetitiaCoif */}
            </h2>
            <p className="text-gray-600 mb-4">
              Gérez votre clientèle et vos rendez-vous en toute simplicité.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Clients
                </h3>
                <p className="text-3xl font-bold text-pink-600">
                  {customers.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  clients enregistrés
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Prestations
                </h3>
                <p className="text-3xl font-bold text-pink-600">
                  {services.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  prestations disponibles
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Produits
                </h3>
                <p className="text-3xl font-bold text-pink-600">
                  {products.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  produits disponibles
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!session) {
    return <SignIn />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                <Logo />
              </h1>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Forms */}
      <CustomerForm
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setSelectedCustomer(undefined);
        }}
        onSubmit={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer}
        initialData={selectedCustomer}
        title={selectedCustomer ? 'Modifier le client' : 'Nouveau client'}
      />

      <ServiceForm
        isOpen={isServiceFormOpen}
        onClose={() => {
          setIsServiceFormOpen(false);
          setSelectedService(undefined);
        }}
        onSubmit={selectedService ? handleUpdateService : handleCreateService}
        initialData={selectedService}
        title={selectedService ? 'Modifier la prestation' : 'Nouvelle prestation'}
      />

      <ProductForm
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setSelectedProduct(undefined);
        }}
        onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
        initialData={selectedProduct}
        title={selectedProduct ? 'Modifier le produit' : 'Nouveau produit'}
      />

      <ActivityForm
        isOpen={isActivityFormOpen}
        onClose={() => {
          setIsActivityFormOpen(false);
          setSelectedActivity(undefined);
        }}
        onSubmit={selectedActivity ? handleUpdateActivity : handleCreateActivity}
        initialData={selectedActivity}
        title={selectedActivity ? "Modifier l'activité" : 'Nouvelle activité'}
        customers={customers}
        services={services}
        products={products}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen &&
        (customerToDelete ||
          serviceToDelete ||
          productToDelete ||
          activityToDelete) && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {customerToDelete
                  ? `Êtes-vous sûr de vouloir supprimer le client ${customerToDelete.first_name} ${customerToDelete.last_name} ?`
                  : serviceToDelete
                  ? `Êtes-vous sûr de vouloir supprimer la prestation ${serviceToDelete.name} ?`
                  : productToDelete
                  ? `Êtes-vous sûr de vouloir supprimer le produit ${productToDelete.name} ?`
                  : `Êtes-vous sûr de vouloir supprimer cette activité ?`}
                Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCustomerToDelete(null);
                    setServiceToDelete(null);
                    setProductToDelete(null);
                    setActivityToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Annuler
                </button>
                <button
                  onClick={
                    customerToDelete
                      ? handleDeleteCustomer
                      : serviceToDelete
                      ? handleDeleteService
                      : productToDelete
                      ? handleDeleteProduct
                      : handleDeleteActivity
                  }
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default App;