use anchor_lang::prelude::*;
// use crate::errors::TicTacToeError;
use crate::state::game::*;

pub fn login(ctx: Context<Login>, role: Role) -> Result<()> {
    let game = &mut ctx.accounts.game;
    game.login(ctx.accounts.player.key(), role)
}

pub fn play(ctx: Context<Play>, tile: Tile) -> Result<()> {
    let game = &mut ctx.accounts.game;
    game.play(ctx.accounts.player.key(), &tile)
}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct Login<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}
