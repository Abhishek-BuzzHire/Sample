import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { Candidate } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

const CandidateForm: React.FC = () => {
  const navigate = useNavigate();
  const { addCandidate } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Candidate, 'id'>>({
    name: '',
    phoneNumber: '',
    email: '',
    resumeLink: '',
    currentCompany: '',
    experience: '',
    skills: [],
    expectedSalary: '',
    location: '',
    notes: '',
    customFields: {}
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  const [skillInput, setSkillInput] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  };
  
  const handleAddSkill = () => {
    if (skillInput.trim() !== '' && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '' }]);
  };
  
  const handleCustomFieldChange = (index: number, field: 'key' | 'value', value: string) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = value;
    setCustomFields(updatedFields);
    
    // Update the formData customFields object
    const customFieldsObject: Record<string, string> = {};
    updatedFields.forEach(field => {
      if (field.key.trim() !== '') {
        customFieldsObject[field.key] = field.value;
      }
    });
    
    setFormData(prev => ({
      ...prev,
      customFields: customFieldsObject
    }));
  };
  
  const handleRemoveCustomField = (index: number) => {
    const updatedFields = customFields.filter((_, i) => i !== index);
    setCustomFields(updatedFields);
    
    // Update the formData customFields object
    const customFieldsObject: Record<string, string> = {};
    updatedFields.forEach(field => {
      if (field.key.trim() !== '') {
        customFieldsObject[field.key] = field.value;
      }
    });
    
    setFormData(prev => ({
      ...prev,
      customFields: customFieldsObject
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the candidate and get the ID
      const candidateId = addCandidate(formData);
      
      toast.success('Candidate added successfully');
      // Navigate to recipient selection with the new candidate ID
      navigate(`/recipient-selection/${candidateId}`);
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast.error('Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Candidate</h1>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <FormField
              label="Full Name"
              name="name"
              required
              error={errors.name}
            >
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="John Doe"
              />
            </FormField>
            
            <FormField
              label="Email"
              name="email"
              required
              error={errors.email}
            >
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="john.doe@example.com"
              />
            </FormField>
            
            <FormField
              label="Phone Number"
              name="phoneNumber"
              error={errors.phoneNumber}
            >
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="+1 (123) 456-7890"
              />
            </FormField>
            
            <FormField
              label="Current Company"
              name="currentCompany"
            >
              <input
                type="text"
                id="currentCompany"
                name="currentCompany"
                value={formData.currentCompany}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="ABC Corp"
              />
            </FormField>
            
            <FormField
              label="Experience"
              name="experience"
            >
              <input
                type="text"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="5 years"
              />
            </FormField>
            
            <FormField
              label="Expected Salary"
              name="expectedSalary"
            >
              <input
                type="text"
                id="expectedSalary"
                name="expectedSalary"
                value={formData.expectedSalary}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="$100,000"
              />
            </FormField>
            
            <FormField
              label="Location"
              name="location"
            >
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="New York, NY"
              />
            </FormField>
            
            <FormField
              label="Resume Link"
              name="resumeLink"
              hint="URL to candidate's resume or portfolio"
            >
              <input
                type="url"
                id="resumeLink"
                name="resumeLink"
                value={formData.resumeLink}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="https://example.com/resume.pdf"
              />
            </FormField>
          </div>
          
          {/* Skills section */}
          <div className="mt-6">
            <FormField
              label="Skills"
              name="skills"
              hint="Enter skills and press Enter or Add"
            >
              <div className="flex">
                <input
                  type="text"
                  id="skills"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="JavaScript"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2 mt-1"
                  onClick={handleAddSkill}
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>
            </FormField>
            
            {formData.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1.5 text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div className="mt-6">
            <FormField
              label="Notes/Remarks"
              name="notes"
            >
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Additional information about the candidate..."
              />
            </FormField>
          </div>
          
          {/* Custom Fields */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Custom Fields</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomField}
                icon={<Plus size={16} />}
              >
                Add Custom Field
              </Button>
            </div>
            
            {customFields.map((field, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-3">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)}
                    placeholder="Field Name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                    placeholder="Field Value"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(index)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save size={18} />}
            >
              Save & Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CandidateForm;