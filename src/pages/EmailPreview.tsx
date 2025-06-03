import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Copy, ArrowLeft, Check, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { Candidate, RecipientSelections, RecipientType } from '../types';
import { generateEmailContent, generateSubjectLine, sendEmail, initializeGapi } from '../utils/emailService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

const EmailPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCandidate, getSelections } = useAppContext();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [selections, setSelections] = useState<RecipientSelections | null>(null);
  const [activeTab, setActiveTab] = useState<RecipientType>('client');
  const [emailAddress, setEmailAddress] = useState<Record<RecipientType, string>>({
    client: '',
    internal: '',
    superiors: ''
  });
  const [ccAddress, setCcAddress] = useState('');
  const [bccAddress, setBccAddress] = useState('');
  const [subject, setSubject] = useState<Record<RecipientType, string>>({
    client: '',
    internal: '',
    superiors: ''
  });
  const [emailContent, setEmailContent] = useState<Record<RecipientType, string>>({
    client: '',
    internal: '',
    superiors: ''
  });
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeEmail = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        await initializeGapi();
      } catch (error) {
        console.error('Error initializing Gmail API:', error);
        setError('Failed to initialize Gmail integration');
        toast.error('Failed to initialize Gmail integration');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeEmail();
  }, []);
  
  useEffect(() => {
    if (id) {
      const candidateData = getCandidate(id);
      const selectionsData = getSelections(id);
      
      if (candidateData && selectionsData) {
        setCandidate(candidateData);
        setSelections(selectionsData);
        
        const types: RecipientType[] = ['client', 'internal', 'superiors'];
        const newSubjects: Record<RecipientType, string> = { client: '', internal: '', superiors: '' };
        const newContent: Record<RecipientType, string> = { client: '', internal: '', superiors: '' };
        
        types.forEach(type => {
          newSubjects[type] = generateSubjectLine(candidateData, type);
          newContent[type] = generateEmailContent(candidateData, type, selectionsData.fieldVisibility);
        });
        
        setSubject(newSubjects);
        setEmailContent(newContent);
      } else {
        toast.error('Candidate or selection data not found');
        navigate('/');
      }
    }
  }, [id, getCandidate, getSelections, navigate]);
  
  const handleEmailAddressChange = (type: RecipientType, value: string) => {
    setEmailAddress(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const handleSubjectChange = (type: RecipientType, value: string) => {
    setSubject(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const copyToClipboard = () => {
    const emailHtml = emailContent[activeTab];
    
    const textarea = document.createElement('textarea');
    textarea.value = emailHtml;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    setCopySuccess(true);
    toast.success('Email content copied to clipboard');
    
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  const validateEmailList = (emails: string): string | null => {
    if (!emails.trim()) return null;
    
    const emailList = emails.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return `Invalid email format: ${invalidEmails.join(', ')}`;
    }
    
    return null;
  };

  const handleSendEmail = async () => {
    if (!emailAddress[activeTab]) {
      toast.error('Please enter a recipient email address');
      return;
    }

    // Validate all email addresses
    const toError = validateEmailList(emailAddress[activeTab]);
    const ccError = validateEmailList(ccAddress);
    const bccError = validateEmailList(bccAddress);

    if (toError || ccError || bccError) {
      toast.error(toError || ccError || bccError);
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const success = await sendEmail(
        emailAddress[activeTab],
        subject[activeTab],
        emailContent[activeTab],
        ccAddress,
        bccAddress
      );

      if (success) {
        toast.success('Email sent successfully');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while sending the email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };
  
  if (!candidate || !selections) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Preview & Send</h1>
      <p className="text-gray-600 mb-6">
        Preview and send customized emails to different recipients
      </p>
      
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="text-red-700">
            <h3 className="font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        </Card>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {(['client', 'internal', 'superiors'] as RecipientType[]).map(type => (
              <button
                key={type}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 mb-6">
            <FormField
              label="To"
              name={`${activeTab}-email`}
              required
            >
              <input
                type="email"
                value={emailAddress[activeTab]}
                onChange={(e) => handleEmailAddressChange(activeTab, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="recipient@example.com"
              />
            </FormField>
            
            <FormField
              label="CC"
              name="cc-email"
              hint="Separate multiple email addresses with commas"
            >
              <input
                type="text"
                value={ccAddress}
                onChange={(e) => setCcAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="email1@example.com, email2@example.com"
              />
            </FormField>
            
            <FormField
              label="BCC"
              name="bcc-email"
              hint="Separate multiple email addresses with commas"
            >
              <input
                type="text"
                value={bccAddress}
                onChange={(e) => setBccAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="email1@example.com, email2@example.com"
              />
            </FormField>
            
            <FormField
              label="Subject"
              name={`${activeTab}-subject`}
              required
            >
              <input
                type="text"
                value={subject[activeTab]}
                onChange={(e) => handleSubjectChange(activeTab, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </FormField>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Preview
            </label>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50 h-96 overflow-y-auto">
              <div 
                className="email-preview bg-white p-6 rounded-md shadow-sm"
                dangerouslySetInnerHTML={{ __html: emailContent[activeTab] }}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/recipient-selection/${id}`)}
              icon={<ArrowLeft size={18} />}
            >
              Back to Selection
            </Button>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={copyToClipboard}
                icon={copySuccess ? <Check size={18} /> : <Copy size={18} />}
              >
                {copySuccess ? 'Copied!' : 'Copy Email'}
              </Button>
              
              <Button
                type="button"
                variant="primary"
                onClick={handleSendEmail}
                isLoading={isSending || isInitializing}
                disabled={isInitializing || !!error}
                icon={<Send size={18} />}
              >
                {isInitializing ? 'Initializing...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;