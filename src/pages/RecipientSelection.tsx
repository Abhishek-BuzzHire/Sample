import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { FieldVisibility, RecipientSelections, Candidate } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const RecipientSelection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCandidate, updateRecipientSelections, getSelections } = useAppContext();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibility>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (id) {
      const candidateData = getCandidate(id);
      if (candidateData) {
        setCandidate(candidateData);
        
        // Get existing selections or initialize defaults
        const existingSelections = getSelections(id);
        
        if (existingSelections) {
          setFieldVisibility(existingSelections.fieldVisibility);
        } else {
          // Initialize with all fields visible for all recipient types
          const defaultVisibility: FieldVisibility = {};
          
          Object.keys(candidateData).forEach(field => {
            if (field !== 'id' && field !== 'createdAt') {
              defaultVisibility[field] = {
                client: true,
                internal: true,
                superiors: true
              };
            }
          });
          
          setFieldVisibility(defaultVisibility);
        }
      } else {
        toast.error('Candidate not found');
        navigate('/');
      }
    }
  }, [id, getCandidate, getSelections, navigate]);
  
  const handleToggleVisibility = (field: string, recipientType: 'client' | 'internal' | 'superiors') => {
    setFieldVisibility(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [recipientType]: !prev[field][recipientType]
      }
    }));
  };
  
  const handleSelectAll = (recipientType: 'client' | 'internal' | 'superiors') => {
    setFieldVisibility(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(field => {
        updated[field] = {
          ...updated[field],
          [recipientType]: true
        };
      });
      return updated;
    });
  };
  
  const handleDeselectAll = (recipientType: 'client' | 'internal' | 'superiors') => {
    setFieldVisibility(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(field => {
        updated[field] = {
          ...updated[field],
          [recipientType]: false
        };
      });
      return updated;
    });
  };
  
  const handleSaveSelections = () => {
    if (!id || !candidate) return;
    
    setIsSubmitting(true);
    
    try {
      const selections: RecipientSelections = {
        candidateId: id,
        fieldVisibility
      };
      
      updateRecipientSelections(id, selections);
      toast.success('Recipient selections saved');
      navigate(`/email-preview/${id}`);
    } catch (error) {
      console.error('Error saving selections:', error);
      toast.error('Failed to save selections');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!candidate) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Recipient Field Selection</h1>
      <p className="text-gray-600 mb-6">
        Select which fields to include for each recipient type
      </p>
      
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Candidate: {candidate.name}</h2>
          <p className="text-sm text-gray-600">
            Choose which information to share with each recipient type by using the checkboxes below.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Field
                </th>
                <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <span className="mb-2">Client</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAll('client')}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100"
                      >
                        All
                      </button>
                      <button
                        onClick={() => handleDeselectAll('client')}
                        className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <span className="mb-2">Internal Team</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAll('internal')}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100"
                      >
                        All
                      </button>
                      <button
                        onClick={() => handleDeselectAll('internal')}
                        className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <span className="mb-2">Superiors</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAll('superiors')}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100"
                      >
                        All
                      </button>
                      <button
                        onClick={() => handleDeselectAll('superiors')}
                        className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(fieldVisibility).map(([field, visibility]) => {
                // Skip internal fields
                if (field === 'id' || field === 'createdAt') return null;
                
                // Format field name for display
                const displayField = field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                
                return (
                  <tr key={field} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayField}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleVisibility(field, 'client')}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                          visibility.client
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {visibility.client ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleVisibility(field, 'internal')}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                          visibility.internal
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {visibility.internal ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleVisibility(field, 'superiors')}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                          visibility.superiors
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {visibility.superiors ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/add-candidate`)}
            icon={<ArrowLeft size={18} />}
          >
            Back to Form
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveSelections}
            isLoading={isSubmitting}
            icon={<ArrowRight size={18} />}
          >
            Continue to Email Preview
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RecipientSelection;