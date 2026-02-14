import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Player, Group, Position } from '../models/player.model';
import {environment} from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private supabase: SupabaseClient;

  groups = signal<Group[]>([]);
  activeGroupId = signal<string>('');

  activePlayers = computed(() => {
    const group = this.groups().find(g => g.id === this.activeGroupId());
    return group ? group.players : [];
  });

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.loadData();
  }

  async loadData() {
    // 1. Récupérer les groupes
    const { data: groupsData } = await this.supabase.from('groups').select('*');

    // 2. Récupérer tous les joueurs
    const { data: playersData } = await this.supabase.from('players').select('*');

    if (groupsData && playersData) {
      const formattedGroups = groupsData.map(g => ({
        id: g.id,
        name: g.name,
        players: playersData
          .filter(p => p.group_id === g.id)
          .map(p => ({
            id: p.id,
            nom: p.nom,
            positions: p.positions,
            estPresent: p.est_present
          }))
      }));

      this.groups.set(formattedGroups);
      if (formattedGroups.length > 0) this.activeGroupId.set(formattedGroups[0].id);
    }
  }

  async addPlayerToActiveGroup(name: string, positions: Position[]) {
    const { data, error } = await this.supabase.from('players').insert([
      {
        nom: name,
        positions: positions,
        group_id: this.activeGroupId(),
        est_present: true
      }
    ]).select();

    if (data) {
      await this.loadData();
    }
  }

  async togglePresence(playerId: string, currentStatus: boolean) {
    await this.supabase
      .from('players')
      .update({ est_present: !currentStatus })
      .eq('id', playerId);

    await this.loadData();
  }

  switchGroup(id: string) {
    this.activeGroupId.set(id);
  }
}
