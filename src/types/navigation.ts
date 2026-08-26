// Navigation Types — SafeHer

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  IncidentHistory: undefined;
  IncidentDetails: { incidentId: string };
  Resources: undefined;
  EvidenceVault: undefined;
  FakeCall: { callerName?: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  TrustedContacts: undefined;
  Journey: undefined;
  Profile: undefined;
  Settings: undefined;
};
