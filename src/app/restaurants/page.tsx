'use client';

import { useState, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileCheck, Loader, CheckCircle, XCircle, Wand2, RefreshCw } from 'lucide-react';

type Restaurant = { id: string; name: string; website: string | null; email: string | null; address: string | null; phone: string | null; category: string | null; status: 'Nouveau' | 'En attente' | 'En cours...' | 'Terminé' | 'Erreur' };

// API pour mettre à jour un restaurant
async function updateRestaurant(id: string, data: Partial<Restaurant>) {
  const response = await fetch(`/api/restaurants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update restaurant');
  return response.json();
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/restaurants');
      const data = await response.json();
      const processedData = data.map((r: any) => ({ ...r, status: 'Nouveau' }));
      setRestaurants(processedData);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      alert("Impossible de charger les restaurants depuis la base de données.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const getColumnValue = (row: any, keys: string[]): string | null => {
    for (const key of keys) { if (row[key]) return row[key]; }
    return null;
  };

  const handleFile = (file: File) => {
    if (!file) return;
    setIsLoading(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const newRestaurants = results.data.map((row: any) => {
          const name = getColumnValue(row, ['name', 'place_name', 'Titre', 'Nom']);
          if (!name) return null;
          return { name, website: getColumnValue(row, ['website', 'Site Web']), email: getColumnValue(row, ['email', 'E-mail']), address: getColumnValue(row, ['address', 'Adresse']), phone: getColumnValue(row, ['phone', 'Numéro de téléphone']), category: getColumnValue(row, ['main_category', 'categories', 'Catégorie'])};
        }).filter(Boolean);

        if (newRestaurants.length > 0) {
          await fetch('/api/restaurants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRestaurants),
          });
          await fetchRestaurants(); 
        } else {
          setIsLoading(false);
        }
      }
    });
  };

  const handleEmailChange = async (id: string, newEmail: string) => {
    const originalRestaurants = restaurants;
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, email: newEmail } : r));
    try {
      await updateRestaurant(id, { email: newEmail });
    } catch (error) {
      alert("Erreur lors de la sauvegarde de l'email.");
      setRestaurants(originalRestaurants);
    }
  };
  
  const startAudit = async (restaurant: Restaurant) => {
    setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, status: 'En attente' } : r));
    await fetch('/api/restaurants/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant),
    }).then(res => {
      if(res.ok) setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, status: 'En cours...' } : r));
      else setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, status: 'Erreur' } : r));
    });
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleDragEvents = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { handleDragEvents(e); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { handleDragEvents(e); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { handleDragEvents(e); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gourmet-Presence</h1>
          <p className="text-lg text-gray-600">Outil de prospection pour restaurants</p>
        </header>
        
        <div className={`mb-8 p-6 bg-white rounded-lg shadow-sm border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onDrop={handleDrop} onDragOver={handleDragEnter} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
          <div className="flex flex-col items-center justify-center text-center">
            <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">Glissez-déposez votre fichier CSV ici</h3>
            <p className="text-gray-500">ou</p>
            <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
            <label htmlFor="csv-upload" className="mt-2 cursor-pointer px-5 py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors">Sélectionner un fichier</label>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold text-gray-800">Prospects</h2>
            <button onClick={() => fetchRestaurants()} disabled={isLoading} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full disabled:opacity-50"><RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
          </div>
          {isLoading ? <p className="p-4 text-center text-gray-500">Chargement des données...</p> :
            <table className="min-w-full">
              <thead className="bg-gray-50"><tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase">Nom du Restaurant</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase">Email</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase">Statut</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {restaurants.map((resto) => (
                  <tr key={resto.id} className="hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap font-medium text-gray-800">{resto.name}</td>
                    <td className="p-4 text-gray-600 w-64"><input type="email" defaultValue={resto.email || ''} onBlur={(e) => handleEmailChange(resto.id, e.target.value)} placeholder="Ajouter un email..." className="p-1 border rounded-md w-full focus:ring-2 focus:ring-blue-500" /></td>
                    <td className="p-4 whitespace-nowrap"><StatusBadge status={resto.status} /></td>
                    <td className="p-4"><button onClick={() => startAudit(resto)} className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 disabled:bg-gray-400" disabled={resto.status !== 'Nouveau'}>Lancer Audit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}

// Le composant pour afficher les statuts visuels
const StatusBadge = ({ status }: { status: 'Nouveau' | 'En attente' | 'En cours...' | 'Terminé' | 'Erreur' }) => {
  const styles = {
    Nouveau: 'bg-gray-100 text-gray-700',
    'En attente': 'bg-blue-100 text-blue-800',
    'En cours...': 'bg-blue-100 text-blue-800 animate-pulse',
    Terminé: 'bg-green-100 text-green-800',
    Erreur: 'bg-red-100 text-red-800',
  };
  const icons = {
    Nouveau: <FileCheck className="w-4 h-4" />,
    'En attente': <Loader className="w-4 h-4 animate-spin" />,
    'En cours...': <Loader className="w-4 h-4 animate-spin" />,
    Terminé: <CheckCircle className="w-4 h-4" />,
    Erreur: <XCircle className="w-4 h-4" />,
  }
  return <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit ${styles[status]}`}>{icons[status]}{status}</div>;
};