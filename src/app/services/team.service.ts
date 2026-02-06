import { Injectable } from '@angular/core';
import { Player, Position } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class TeamService {

  generateTeams(presentPlayers: Player[], useScore: boolean = true) {
    let team1: Player[] = [];
    let team2: Player[] = [];
    const positionOrder: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
    let pickTeam1First = Math.random() > 0.5; // Aléatoire sur qui commence

    positionOrder.forEach(pos => {
      // On récupère les joueurs dont la PREMIÈRE position correspond (poste préférentiel)
      let playersInPos = presentPlayers.filter(p => p.positions[0] === pos);

      if (useScore) {
        // On ajoute un petit bonus/malus aléatoire de +/- 0.5 
        // pour varier les compositions à chaque clic
        playersInPos = playersInPos.map(p => ({
          ...p,
          tempScore: p.score + (Math.random() - 0.5)
        }));

        playersInPos.sort((a: any, b: any) => b.tempScore - a.tempScore);
      } else {
        playersInPos = playersInPos.sort(() => Math.random() - 0.5);
      }

      playersInPos.forEach((player) => {
        if (pickTeam1First) team1.push(player);
        else team2.push(player);
        pickTeam1First = !pickTeam1First;
      });
    });

    return this.ensureNumericBalance(team1, team2);
  }

  private ensureNumericBalance(t1: Player[], t2: Player[]) {
    const all = [...t1, ...t2];
    // Si la différence est trop grande, on rééquilibre strictement en 9v9
    while (Math.abs(t1.length - t2.length) > 1) {
      if (t1.length > t2.length) t2.push(t1.pop()!);
      else t1.push(t2.pop()!);
    }
    return { team1: t1, team2: t2 };
  }
}