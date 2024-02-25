use anchor_lang::prelude::*;
use instructions::*;
use state::game::Role;
use state::game::Tile;

pub mod errors;
pub mod instructions;
pub mod state;

// this key needs to be changed to whatever public key is returned by "anchor keys list"
declare_id!("8bdjSahEDzuJ7DvVYB7Rj9sENHosWpEQS5rejKY5FTjL");

#[program]
pub mod tic_tac_toe {
    use super::*;

    pub fn setup_game(ctx: Context<SetupGame>) -> Result<()> {
        instructions::setup_game::setup_game(ctx)
    }

    pub fn login(ctx: Context<Login>, role: Role) -> Result<()> {
        instructions::play::login(ctx, role)
    }

    pub fn play(ctx: Context<Play>, tile: Tile) -> Result<()> {
        instructions::play::play(ctx, tile)
    }
}
