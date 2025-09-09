// src/app/components/RestaurantEmailTemplate.tsx
import React from 'react';
import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from '@react-email/components';
import { RestaurantReport } from '@/workers/restaurant.ai.processor';

interface EmailProps {
  restaurantName: string;
  report: RestaurantReport;
}

export const RestaurantEmailTemplate = ({ restaurantName, report }: EmailProps) => (
  <Html><Head /><Body style={{fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f7'}}>
    <Container style={{maxWidth: '600px', margin: 'auto', backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px'}}>
      <Heading as="h1" style={{color: '#1e3a8a'}}>Votre réputation en ligne est excellente...</Heading>
      <Text style={{color: '#333', fontSize: '16px'}}>Bonjour,</Text>
      <Text style={{color: '#333', fontSize: '16px'}}>
        En analysant la présence en ligne de <strong>{restaurantName}</strong>, nous avons été impressionnés par votre excellente réputation, mise en évidence dans le rapport ci-joint. 🎉
      </Text>
      <Text style={{color: '#333', fontSize: '16px'}}>
        Cependant, notre analyse montre que votre image dépend aujourd’hui principalement de plateformes tierces. Cela vous prive :
      </Text>
      <ul style={{color: '#333', fontSize: '16px', paddingLeft: '20px'}}>
        <li>du contrôle total de votre image,</li>
        <li>d’une relation directe avec vos clients,</li>
        <li>et d’une partie importante de vos marges.</li>
      </ul>
      <Text style={{color: '#333', fontSize: '16px'}}>
        Chez Yonyalabs, nous aidons les restaurants à reprendre le contrôle de leur présence digitale.
      </Text>
      <Section style={{textAlign: 'center', margin: '32px 0'}}>
        <Button href="https://yonyalabs.com" style={{backgroundColor: '#1e3a8a', color: 'white', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', fontSize: '16px'}}>
          Découvrir nos solutions
        </Button>
      </Section>
      <Text style={{color: '#333', fontSize: '16px'}}>
        Nous proposons un audit gratuit de 15 minutes pour vous montrer concrètement les opportunités d’amélioration. Seriez-vous disponible la semaine prochaine ?
      </Text>
      <Hr style={{borderColor: '#cccccc'}} />
      <Text style={{color: '#555', fontSize: '14px'}}>
        Cordialement,<br/>
        <strong>Youness</strong><br/>
        Digital Strategist – Yonyalabs<br/>
        📞 0605740011 | 🌐 yonyalabs.com
      </Text>
    </Container>
  </Body></Html>
);