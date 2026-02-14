import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Player, Position } from './models/player.model';
import { TeamService } from './services/team.service';
import {PlayerService} from './services/player.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // CommonModule est nécessaire pour [class] etc.
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  public playerService = inject(PlayerService);
  private teamService = inject(TeamService);

  teams = signal<{ team1: Player[], team2: Player[] }>({ team1: [], team2: [] });
  isMaintenance = signal(true);

  newPlayerName = '';
  availablePositions: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
  selectedPositions: { [key: string]: boolean } = {};

  playersPresent = computed(() =>
    this.playerService.activePlayers().filter(p => p.estPresent)
  );

  addPlayer() {
    const roles = this.availablePositions.filter(p => this.selectedPositions[p]);
    if (!this.newPlayerName.trim() || roles.length === 0) return;

    this.playerService.addPlayerToActiveGroup(this.newPlayerName, roles as Position[]);
    this.newPlayerName = '';
    this.selectedPositions = {};
  }

  async makeTeams() {
    await this.playerService.syncWithSupabase();

    const result = this.teamService.generateTeams(this.playersPresent());
    this.teams.set(result);
  }
}


export const NIVEAUX = [
  { label: '🌟 Top', valeur: 9 },
  { label: '✅ Confirmé', valeur: 7 },
  { label: '🏃 Moyen', valeur: 5 },
  { label: '🌱 Débutant', valeur: 3 }
];
