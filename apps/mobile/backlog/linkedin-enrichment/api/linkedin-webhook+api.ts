import { LinkedInEnrichmentResponse } from '../../utils/linkedin-webhook';
import { ServerLinkedInStore } from '../../utils/server-linkedin-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received LinkedIn webhook:', JSON.stringify(body, null, 2));
    
    // Extract email from the webhook data
    const email = body.email || body.search_email;
    if (!email) {
      console.error('No email found in webhook data');
      return Response.json(
        { success: false, error: 'No email found in webhook data' }, 
        { status: 400 }
      );
    }
    
    // Create enrichment result
    const enrichmentResult: LinkedInEnrichmentResponse = {
      success: true,
      data: {
        name: body.name,
        title: body.title,
        company: body.company,
        linkedinUrl: body.linkedinUrl || body.linkedin_url,
        profilePicture: body.profilePicture || body.profile_picture,
        location: body.location,
        headline: body.headline
      }
    };
    
    // Store the completed result using server-side store
    ServerLinkedInStore.storeCompletedResult(email, enrichmentResult);
    
    console.log('Processed and stored LinkedIn data for:', email);
    
    return Response.json({ 
      success: true, 
      message: 'LinkedIn data received and processed' 
    });
  } catch (error) {
    console.error('LinkedIn webhook error:', error);
    return Response.json(
      { success: false, error: 'Failed to process webhook' }, 
      { status: 500 }
    );
  }
}