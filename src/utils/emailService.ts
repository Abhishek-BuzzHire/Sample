import { EmailContent, Candidate, FieldVisibility, RecipientType } from '../types';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

let tokenClient: google.accounts.oauth2.TokenClient;

export const initializeGapi = async () => {
  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });

  // Load the Google Identity Services library
  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.body.appendChild(script);
  });

  await gapi.load('client', async () => {
    await gapi.client.init({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: SCOPES.join(' '),
      callback: '', // Will be set later
    });
  });
};

export const requestAccessToken = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Set the callback within the promise
      tokenClient.callback = async (response) => {
        if (response.error) {
          if (response.error === 'access_denied') {
            reject(new Error('Access denied. Please make sure you are added as a test user in the Google Cloud Console.'));
          } else {
            reject(new Error(`Authentication failed: ${response.error}`));
          }
        }
        resolve();
      };
      
      tokenClient.requestAccessToken({
        prompt: 'consent'  // Always show consent screen for testing
      });
    } catch (err) {
      reject(err);
    }
  });
};

const validateEmails = (emails: string): boolean => {
  if (!emails.trim()) return true;
  const emailList = emails.split(',').map(email => email.trim());
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailList.every(email => emailRegex.test(email));
};

const createMessage = (to: string, subject: string, content: string, cc?: string, bcc?: string) => {
  const message = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    bcc ? `Bcc: ${bcc}` : '',
    `Subject: ${subject}`,
    '',
    content
  ].filter(Boolean).join('\r\n');

  return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sendEmail = async (
  recipient: string, 
  subject: string, 
  content: string,
  cc?: string,
  bcc?: string
): Promise<boolean> => {
  try {
    // Request access token before sending
    await requestAccessToken();

    if (!gapi.client?.gmail) {
      throw new Error('Gmail API not initialized');
    }

    // Validate all email addresses
    if (!validateEmails(recipient) || 
        (cc && !validateEmails(cc)) || 
        (bcc && !validateEmails(bcc))) {
      throw new Error('Invalid email address format');
    }

    const encodedMessage = createMessage(recipient, subject, content, cc, bcc);
    
    await gapi.client.gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: encodedMessage
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error && error.message.includes('test user')) {
      throw new Error('Please add your email as a test user in the Google Cloud Console');
    }
    return false;
  }
};

export const generateEmailContent = (
  candidate: Candidate,
  recipientType: RecipientType,
  fieldVisibility: FieldVisibility
): string => {
  const visibleFields: string[] = [];
  
  Object.keys(fieldVisibility).forEach(field => {
    if (fieldVisibility[field][recipientType]) {
      visibleFields.push(field);
    }
  });
  
  let tableContent = `
    <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Field</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Value</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  visibleFields.forEach(field => {
    if (field !== 'id' && field !== 'customFields' && field !== 'createdAt') {
      let value: string = '';
      
      if (field === 'skills' && Array.isArray(candidate[field])) {
        value = candidate[field].join(', ');
      } else {
        value = candidate[field] as string;
      }
      
      const formattedField = field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      tableContent += `
        <tr>
          <td style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">${formattedField}</td>
          <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">${value}</td>
        </tr>
      `;
    }
  });
  
  if (candidate.customFields && fieldVisibility['customFields']?.[recipientType]) {
    Object.entries(candidate.customFields).forEach(([key, value]) => {
      tableContent += `
        <tr>
          <td style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">${key}</td>
          <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">${value}</td>
        </tr>
      `;
    });
  }
  
  tableContent += `
      </tbody>
    </table>
  `;
  
  const email = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Candidate Information</h2>
      <p style="margin-bottom: 20px;">Please find below the details for ${candidate.name}:</p>
      ${tableContent}
      <p style="margin-top: 20px;">Please let me know if you need any additional information.</p>
      <p>Best regards,</p>
    </div>
  `;
  
  return email;
};

export const generateSubjectLine = (candidate: Candidate, recipientType: RecipientType): string => {
  switch (recipientType) {
    case 'client':
      return `Candidate Profile: ${candidate.name} - ${candidate.currentCompany}`;
    case 'internal':
      return `Internal Review: ${candidate.name} - ${candidate.skills.slice(0, 3).join(', ')}`;
    case 'superiors':
      return `Candidate Assessment: ${candidate.name} - ${candidate.location}`;
    default:
      return `Candidate Information: ${candidate.name}`;
  }
};