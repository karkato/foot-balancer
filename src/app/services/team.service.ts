import { Injectable } from '@angular/core';
import { Player, Position } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class TeamService {

  generateTeams(presentPlayers: Player[]) {
    let team1: Player[] = [];
    let team2: Player[] = [];
    
    // Ordre de priorité pour la répartition
    const positionOrder: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
    
    // Pile ou face pour savoir quelle équipe reçoit le premier joueur
    let pickTeam1First = Math.random() > 0.5;

    positionOrder.forEach(pos => {
      // On récupère les joueurs de ce poste et on les MÉLANGE totalement
      let playersInPos = presentPlayers
        .filter(p => p.positions[0] === pos)
        .sort(() => Math.random() - 0.5);

      // On distribue alternativement
      playersInPos.forEach((player) => {
        if (pickTeam1First) team1.push(player);
        else team2.push(player);
        pickTeam1First = !pickTeam1First;
      });
    });

    return this.ensureNumericBalance(team1, team2);
  }

  private ensureNumericBalance(t1: Player[], t2: Player[]) {
    // Si on a un nombre de joueurs impair, on accepte une différence de 1
    // Sinon on équilibre strictement (ex: 9v9)
    while (Math.abs(t1.length - t2.length) > 1) {
      if (t1.length > t2.length) t2.push(t1.pop()!);
      else t1.push(t2.pop()!);
    }
    return { team1: t1, team2: t2 };
  }
}