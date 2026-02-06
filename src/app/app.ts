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
    { id: '1', nom: 'Omar', positions: ['Défenseur'], score: 7.3, estPresent: true },
    { id: '2', nom: 'Ismael', positions: ['Défenseur'], score: 7.8, estPresent: true },
    { id: '3', nom: 'Francis', positions: ['Milieu'], score: 8, estPresent: true },
    { id: '4', nom: 'Assirem', positions: ['Attaquant'], score: 7.9, estPresent: true },
    { id: '5', nom: 'Massi', positions: ['Gardien'], score: 8, estPresent: true },
    { id: '6', nom: 'Maro', positions: ['Milieu'], score: 8.5, estPresent: true },
    { id: '7', nom: 'Billal', positions: ['Défenseur'], score: 8, estPresent: true },
    { id: '8', nom: 'Romain', positions: ['Défenseur'], score: 8.2, estPresent: true },
    { id: '9', nom: 'Hassan', positions: ['Milieu'], score: 7, estPresent: true },
    { id: '10', nom: 'Anis', positions: ['Défenseur'], score: 7.8, estPresent: true },
    { id: '11', nom: 'Mike', positions: ['Gardien'], score: 7.5, estPresent: true },
    { id: '12', nom: 'Seb', positions: ['Attaquant'], score: 7, estPresent: true },
    { id: '13', nom: 'M10', positions: ['Milieu'], score: 7.8, estPresent: true },
    { id: '14', nom: 'Airwin', positions: ['Défenseur'], score: 6, estPresent: true },
    { id: '15', nom: 'Alex Ma', positions:[ 'Milieu'], score: 8.2, estPresent: true },
    { id: '16', nom: 'Amin', positions: ['Attaquant'], score: 8.4, estPresent: true },
    { id: '17', nom: 'Pepito', positions: ['Attaquant'], score: 8.6, estPresent: true },
    { id: '18', nom: 'Chris', positions: ['Milieu'], score: 9, estPresent: true },
  ]);

  teams = signal<{ team1: Player[], team2: Player[] }>({ team1: [], team2: [] });

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
      score: this.newPlayerScore,
      estPresent: true
    };
    this.allPlayers.update(ps => [...ps, newPlayer]);
    this.newPlayerName = '';
    this.selectedPositions = {}; // Reset positions
  }

  togglePresence(playerToToggle: Player) {
    this.allPlayers.update(players => 
      players.map(p => 
        p.id === playerToToggle.id ? { ...p, estPresent: !p.estPresent } : p
      )
    );
  }

  shuffleByPositionOnly() {
    const result = this.teamService.generateTeams(this.playersPresent(), false);
    this.teams.set(result);
  }

  // Génération initiale (stricte)
  makeTeams() {
    const result = this.teamService.generateTeams(this.playersPresent(), false);
    this.teams.set(result);
  }

  // RE-GÉNÉRER (avec mélange)
  reShuffle() {
    const result = this.teamService.generateTeams(this.playersPresent(), true);
    this.teams.set(result);
  }

  avgScore(team: Player[]): string {
    if (team.length === 0) return '0';
    const total = team.reduce((acc, p) => acc + p.score, 0);
    return (total / team.length).toFixed(1);
  }
}