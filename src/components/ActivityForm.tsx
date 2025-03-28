import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Plus, Minus, Search, History } from 'lucide-react';
import type { Activity, ActivityFormData, ActivityService, ActivityProduct, PaymentMethod } from '../types/activity';
import type { Customer } from '../types/customer';
import type { Service } from '../types/service';
import type { Product } from '../types/product';
import type { CustomerNote } from '../types/customer';
import { Logo } from './Logo';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { CustomerNotesHistory } from './CustomerNotesHistory';

type ActivityFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => void;
  initialData?: Activity;
  title: string;
  customers: Customer[];
  services: Service[];
  products: Product[];
};

export function ActivityForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  customers,
  services,
  products,
}: ActivityFormProps) {
  if (!isOpen) return null;

  const [selectedServices, setSelectedServices] = useState<ActivityService[]>(
    initialData?.services || []
  );
  const [selectedProducts, setSelectedProducts] = useState<ActivityProduct[]>(
    initialData?.products || []
  );
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customer_id || '');
  const [newNote, setNewNote] = useState('');
  const [lastNote, setLastNote] = useState<CustomerNote | null>(null);
  const [allNotes, setAllNotes] = useState<CustomerNote[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalServices, setTotalServices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Memoize calculations
  const calculateTotals = useCallback(() => {
    const servicesTotal = selectedServices.reduce((sum, item) => sum + item.price, 0);
    const productsTotal = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setTotalServices(servicesTotal);
    setTotalProducts(productsTotal);
    setTotalAmount(servicesTotal + productsTotal);
  }, [selectedServices, selectedProducts]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const fetchCustomerNotes = useCallback(async (customerId: string) => {
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      if (notesData) {
        setAllNotes(notesData);
        if (notesData.length > 0) {
          setLastNote(notesData[0]);
        } else {
          setLastNote(null);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerNotes(selectedCustomerId);
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      if (selectedCustomer) {
        setCustomerSearch(`${selectedCustomer.last_name} ${selectedCustomer.first_name}`);
      }
    }
  }, [selectedCustomerId, customers, fetchCustomerNotes]);

  const filteredCustomers = useMemo(() => {
    const searchTerm = customerSearch.toLowerCase();
    return customers.filter(customer => {
      const fullName = `${customer.last_name} ${customer.first_name}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
  }, [customers, customerSearch]);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearch(`${customer.last_name} ${customer.first_name}`);
    setShowCustomerList(false);
    fetchCustomerNotes(customer.id);
  }, [fetchCustomerNotes]);

  const handleAddService = useCallback(() => {
    setSelectedServices(prev => [...prev, { service_id: '', price: 0 }]);
  }, []);

  const handleRemoveService = useCallback((index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleServiceChange = useCallback((index: number, field: keyof ActivityService, value: string | number) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }, []);

  const handleAddProduct = useCallback(() => {
    setSelectedProducts(prev => [...prev, { product_id: '', price: 0, quantity: 1 }]);
  }, []);

  const handleRemoveProduct = useCallback((index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleProductChange = useCallback((index: number, field: keyof ActivityProduct, value: string | number) => {
    setSelectedProducts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      const activityData: ActivityFormData = {
        customer_id: selectedCustomerId,
        date: formData.get('date') as string,
        services: selectedServices,
        products: selectedProducts,
        payment_method: formData.get('payment_method') as PaymentMethod,
      };

      if (newNote && selectedCustomerId) {
        const { error: noteError } = await supabase
          .from('customer_notes')
          .insert([{
            customer_id: selectedCustomerId,
            content: newNote.trim()
          }]);

        if (noteError) throw noteError;
      }

      await onSubmit(activityData);
      setNewNote('');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Logo />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="customer_search" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="customer_search"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerList(true);
                    if (!e.target.value) {
                      setSelectedCustomerId('');
                    }
                  }}
                  onFocus={() => setShowCustomerList(true)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="Rechercher un client..."
                  required
                />
                <input type="hidden" name="customer_id" value={selectedCustomerId} required />
              </div>
              {showCustomerList && customerSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-pink-50 cursor-pointer"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        {customer.last_name} {customer.first_name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Aucun client trouvé
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                defaultValue={initialData?.date || format(new Date(), 'yyyy-MM-dd')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
              />
            </div>
          </div>

          {selectedCustomerId && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Commentaires client
                </label>
                {allNotes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(true)}
                    className="inline-flex items-center px-2 py-1 text-sm font-medium text-pink-600 hover:text-pink-700"
                  >
                    <History className="h-4 w-4 mr-1" />
                    Voir l'historique
                  </button>
                )}
              </div>
              
              {lastNote && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">
                    Dernier commentaire ({format(new Date(lastNote.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })})
                  </div>
                  <p className="text-sm text-gray-700">{lastNote.content}</p>
                </div>
              )}

              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                placeholder="Ajouter un nouveau commentaire..."
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Prestations</h3>
              <button
                type="button"
                onClick={handleAddService}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une prestation
              </button>
            </div>

            {selectedServices.map((service, index) => (
              <div key={`service-${index}`} className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prestation
                  </label>
                  <select
                    value={service.service_id}
                    onChange={(e) => handleServiceChange(index, 'service_id', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  >
                    <option value="">Sélectionner une prestation</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prix
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={service.price}
                    onChange={(e) => handleServiceChange(index, 'price', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveService(index)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Retirer
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Produits</h3>
              <button
                type="button"
                onClick={handleAddProduct}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un produit
              </button>
            </div>

            {selectedProducts.map((product, index) => (
              <div key={`product-${index}`} className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Produit
                  </label>
                  <select
                    value={product.product_id}
                    onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prix unitaire
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveProduct(index)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Retirer
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total prestations:</span>
              <span>{totalServices.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total produits:</span>
              <span>{totalProducts.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900">
              <span>Total:</span>
              <span>{totalAmount.toFixed(2)} €</span>
            </div>
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
              Mode de règlement
            </label>
            <select
              name="payment_method"
              id="payment_method"
              required
              defaultValue={initialData?.payment_method || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            >
              <option value="">Sélectionner un mode de règlement</option>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="carte">Carte bancaire</option>
              <option value="autres">Autres</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : (initialData ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>

        {selectedCustomerId && (
          <CustomerNotesHistory
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            notes={allNotes}
            customerName={customers.find(c => c.id === selectedCustomerId)?.first_name + ' ' + customers.find(c => c.id === selectedCustomerId)?.last_name}
          />
        )}
      </div>
    </div>
  );
}