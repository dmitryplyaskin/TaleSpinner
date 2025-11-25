export interface Faction {
  name: string;
  type: string;
  ideology_and_goals: string;
  structure: string;
  key_leaders: string;
  methods: string;
  relationships: string;
  role_in_conflict: string;
  resources_and_influence: string;
}

export interface Location {
  name: string;
  type: string;
  appearance: string;
  history: string;
  inhabitants: string;
  significance: string;
  features_and_secrets: string;
  adventure_opportunities: string;
}

export interface Race {
  name: string;
  description: string;
  relationship_to_conflict: string;
  special_abilities: string;
  social_structure: string;
}

export interface TimelineEvent {
  name: string;
  timeframe: string;
  description: string;
  impact_on_present: string;
}

export interface MagicSchool {
  name: string;
  description: string;
}

export interface MagicSystem {
  magic_fundamentals: string;
  power_sources: string;
  magic_schools: MagicSchool[];
  limitations_and_costs: string;
  societal_attitude: string;
  role_in_conflict: string;
  artifacts_and_places: string;
}

export interface WorldData {
  name: string;
  genre: string;
  tone: string;
  world_primer: string;
  factions?: Faction[];
  locations?: Location[];
  races?: Race[];
  history?: TimelineEvent[];
  magic?: MagicSystem;
}

