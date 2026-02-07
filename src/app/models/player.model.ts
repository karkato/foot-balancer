export type Position = 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';

export interface Player {
  id: string;
  nom: string;
  surnom?: string;
  positions: Position[];
  score?: number;
  estPresent: boolean;
}