import { Timestamp } from 'firebase/firestore';

/**
 * Representa uma Agência no sistema.
 * Raiz da hierarquia Multi-Tenancy para agências.
 * Collection: /agencies/{agencyId}
 */
export interface Agency {
  id: string;
  name: string;
  slug: string; // Usado para subdomínios ou identificação amigável (ex: 'minha-agencia')
  branding: AgencyBranding;
  settings: AgencySettings;
  ownerId: string; // Referência ao User.id que criou a agência
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgencyBranding {
  logoUrl: string;
  colors: {
    primary: string;   // HEX
    secondary: string; // HEX
  };
  customDomain?: string;
}

export interface AgencySettings {
  maxClients: number;
  featuresEnabled: string[]; // ex: ['predictive', 'automation', 'war-room']
  whiteLabelEnabled: boolean;
}

/**
 * Representa um Cliente de uma Agência.
 * Um cliente pertence a uma única agência.
 * Collection: /agencies/{agencyId}/clients/{clientId}
 */
export interface AgencyClient {
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  status: 'active' | 'paused' | 'archived';
  config: {
    currency: string;
    timezone: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    representative?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Papéis de usuário dentro do contexto de Agência.
 */
export type AgencyRole = 'admin' | 'manager' | 'viewer';

/**
 * Vínculo de um usuário com uma agência.
 * Collection: /agencies/{agencyId}/members/{userId}
 */
export interface AgencyMember {
  userId: string;
  agencyId: string;
  role: AgencyRole;
  assignedClients?: string[]; // IDs de AgencyClient que este manager pode acessar (se role for manager)
  joinedAt: Timestamp;
}

/**
 * Representa um convite para uma agência.
 * Collection: /agencies/{agencyId}/invites/{inviteId}
 */
export interface AgencyInvite {
  id: string;
  agencyId: string;
  email: string;
  role: AgencyRole;
  assignedClients?: string[]; // Para managers
  token: string; // Token único de uso único
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string; // userId
  expiresAt: Timestamp;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}
