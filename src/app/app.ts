import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Player, Position } from './models/player.model';
import { TeamService } from './services/team.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // CommonModule est nécessaire pour [class] etc.
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  private teamService = inject(TeamService);

  // --- State géré par les Signals ---
  allPlayers = signal<Player[]>([
    { id: '1', nom: 'Omar', positions: ['Défenseur'], estPresent: true },
    { id: '2', nom: 'Ismael', positions: ['Défenseur'], estPresent: true },
    { id: '3', nom: 'Francis', positions: ['Milieu'], estPresent: true },
    { id: '4', nom: 'Assirem', positions: ['Attaquant'], estPresent: true },
    { id: '5', nom: 'Massi', positions: ['Gardien'], estPresent: true },
    { id: '6', nom: 'Maro', positions: ['Milieu'],  estPresent: true },
    { id: '7', nom: 'Billal', positions: ['Défenseur'],  estPresent: true },
    { id: '8', nom: 'Romain', positions: ['Défenseur'], estPresent: true },
    { id: '9', nom: 'Hassan', positions: ['Milieu'],  estPresent: true },
    { id: '10', nom: 'Anis', positions: ['Défenseur'],  estPresent: true },
    { id: '11', nom: 'Mike', positions: ['Gardien'],  estPresent: true },
    { id: '12', nom: 'Seb', positions: ['Attaquant'],  estPresent: true },
    { id: '13', nom: 'M10', positions: ['Milieu'],  estPresent: true },
    { id: '14', nom: 'Airwin', positions: ['Défenseur'], estPresent: true },
    { id: '15', nom: 'Alex Ma', positions:[ 'Milieu'],  estPresent: true },
    { id: '16', nom: 'Amin', positions: ['Attaquant'],  estPresent: true },
    { id: '17', nom: 'Pepito', positions: ['Attaquant'],  estPresent: true },
    { id: '18', nom: 'Chris', positions: ['Milieu'], estPresent: true },
  ]);

  teams = signal<{ team1: Player[], team2: Player[] }>({ team1: [], team2: [] });
  isMaintenance = signal(true);

  // --- Champs du formulaire ---
  newPlayerName = '';
  newPlayerPos: Position = 'Milieu';
  newPlayerScore = 5;

  // --- Signals dérivés (computed) ---
  playersPresent = computed(() => this.allPlayers().filter(p => p.estPresent));
  availablePositions: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
  selectedPositions: { [key: string]: boolean } = {}; // Pour les checkboxes

  // --- Méthodes ---
  addPlayer() {
    const roles = this.availablePositions.filter(p => this.selectedPositions[p]);
    if (!this.newPlayerName.trim() || roles.length === 0) return;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      nom: this.newPlayerName,
      positions: roles as Position[],
      estPresent: true
    };
    this.allPlayers.update(ps => [...ps, newPlayer]);
    this.newPlayerName = '';
    this.selectedPositions = {};
  }

  togglePresence(playerToToggle: Player) {
    this.allPlayers.update(players => 
      players.map(p => 
        p.id === playerToToggle.id ? { ...p, estPresent: !p.estPresent } : p
      )
    );
  }

 makeTeams() {
    const result = this.teamService.generateTeams(this.playersPresent());
    this.teams.set(result);
  }

}

// Définition des profils
export const NIVEAUX = [
  { label: '🌟 Top', valeur: 9 },
  { label: '✅ Confirmé', valeur: 7 },
  { label: '🏃 Moyen', valeur: 5 },
  { label: '🌱 Débutant', valeur: 3 }
];