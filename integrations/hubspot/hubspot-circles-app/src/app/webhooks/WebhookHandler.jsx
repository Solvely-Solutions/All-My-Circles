import React from 'react';
import {
  Text,
  hubspot
} from '@hubspot/ui-extensions';

hubspot.extend(({ runServerlessFunction, sendAlert }) => {
  return <WebhookHandler runServerlessFunction={runServerlessFunction} sendAlert={sendAlert} />;
});

const WebhookHandler = ({ runServerlessFunction, sendAlert }) => {

  // This component is primarily for webhook handling and doesn't need UI
  // The actual webhook processing happens on the server side

  React.useEffect(() => {
    console.log('All My Circles webhook handler initialized');
  }, []);

  return (
    <Text>
      All My Circles webhook handler is active and ready to receive HubSpot events.
    </Text>
  );
};

export default WebhookHandler;