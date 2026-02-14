export interface Group {
  id: string;
  name: string;
  players: Player[];
}

export type Position = 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';

export interface Player {
  id: string;
  nom: string;
  positions: Position[];
  estPresent: boolean;
}
