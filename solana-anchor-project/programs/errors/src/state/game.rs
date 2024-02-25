use anchor_lang::prelude::*;
use crate::errors::TicTacToeError;
// use num_derive::*;
// use num_traits::*;

// bitmap of the board
// low ------> high
// right_door, up_door, left_door, down_door

#[account]
pub struct Game {
    // 0: seeker, 1: hider
    players: [Pubkey; 2],           // (32 * 2)
    move_cnt: [u8; 2],              // 2
    players_position: [[u8; 2]; 2], // 4
    state: GameState,               // 32 + 1
}

impl Game {
    pub const MAXIMUM_SIZE: usize = (32 * 2) + 2 + 4 + (32 + 1);

    pub fn start(&mut self) -> Result<()> {
        self.move_cnt = [0, 0];
        self.players_position = [[2, 2], [0, 0]];
        Ok(())
    }

    pub fn login(&mut self, player: Pubkey, role: Role) -> Result<()> {
        let role: usize = role.value as usize;
        self.players[role] = player;
        Ok(())
    }

    pub fn is_active(&self) -> bool {
        self.state == GameState::Active
    }

    fn player_index(&self, player: Pubkey) -> usize {
        let mut player_idx = 2;
        if player == self.players[0] {
            player_idx = 0;
        } else if player == self.players[1] {
            player_idx = 1;
        }
        player_idx
    }

    pub fn play(&mut self, player: Pubkey, tile: &Tile) -> Result<()> {
        require!(self.is_active(), TicTacToeError::GameAlreadyOver);

        // TODO: error checking
        let player_idx = self.player_index(player);
        if player_idx > 1 {
            return Err(TicTacToeError::UnknownPlayer.into());
        }
        self.players_position[player_idx] = [tile.row, tile.column];
        self.update_state();

        if GameState::Active == self.state {
            self.move_cnt[player_idx] += 1;
        }

        Ok(())
    }

    fn update_state(&mut self) {
        if self.players_position[0] == self.players_position[1] {
            self.state = GameState::Won {
                winner: self.players[0],
            };
        } else if self.move_cnt[1] > 10 {
            self.state = GameState::Won {
                winner: self.players[1],
            };
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    Active,
    Won { winner: Pubkey },
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Tile {
    row: u8,
    column: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Role {
    value: i32,
}
