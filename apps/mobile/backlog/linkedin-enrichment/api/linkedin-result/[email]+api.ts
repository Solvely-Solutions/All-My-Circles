import { ServerLinkedInStore } from '../../../utils/server-linkedin-store';

export async function GET(request: Request, { email }: { email: string }) {
  try {
    // Decode the email parameter from URL
    const decodedEmail = decodeURIComponent(email);
    console.log('Checking for LinkedIn result for email:', decodedEmail);
    
    const result = ServerLinkedInStore.getCompletedResult(decodedEmail);
    
    if (result) {
      console.log('Found LinkedIn result for:', decodedEmail);
      return Response.json(result);
    } else {
      console.log('No LinkedIn result found for:', decodedEmail);
      return Response.json({ 
        success: false, 
        error: 'No result found' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error retrieving LinkedIn result:', error);
    return Response.json(
      { success: false, error: 'Failed to retrieve result' }, 
      { status: 500 }
    );
  }
}